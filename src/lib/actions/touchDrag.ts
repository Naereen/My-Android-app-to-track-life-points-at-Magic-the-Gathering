export type TouchDragOptions = {
    handle?: string;
    longPressMs?: number;
    ghostOpacity?: number;
    ghostScale?: number;
    sourceOpacity?: number;
    sourceScale?: number;
};

type GhostState = {
    ghostEl: HTMLElement | null;
    halfWidth: number;
    halfHeight: number;
};

// Dedicated player-panel touch drag action.
// Events intentionally mirror the pre-dfd0a92 behavior.
// 'dragstart' { x, y }
// 'dragmove'  { x, y }
// 'dragend'   { x, y }
// The action only starts if the initial touch target matches the handle selector (or is a child of it).
export default function touchDrag(node: HTMLElement, options: TouchDragOptions = {}) {
    let handleSelector = options.handle || '[data-player-seat-index]';
    let longPressMs = options.longPressMs ?? 260;
    let ghostOpacity = options.ghostOpacity ?? 0.96;
    let ghostScale = options.ghostScale ?? 0.985;
    let sourceOpacity = options.sourceOpacity ?? 0.35;
    let sourceScale = options.sourceScale ?? 0.98;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    let longPressTimer: number | null = null;
    let dragging = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let pendingClientX = 0;
    let pendingClientY = 0;
    let rafId: number | null = null;
    let sourceOpacityBeforeDrag = '';
    let sourceTransformBeforeDrag = '';
    const ghostState: GhostState = {
        ghostEl: null,
        halfWidth: 0,
        halfHeight: 0
    };

    const applyOptions = (nextOptions: TouchDragOptions = {}) => {
        handleSelector = nextOptions.handle || '[data-player-seat-index]';
        longPressMs = nextOptions.longPressMs ?? 260;
        ghostOpacity = nextOptions.ghostOpacity ?? 0.96;
        ghostScale = nextOptions.ghostScale ?? 0.985;
        sourceOpacity = nextOptions.sourceOpacity ?? 0.35;
        sourceScale = nextOptions.sourceScale ?? 0.98;
    };

    // We avoid Pointer Events here because Android WebView gesture behavior was more
    // reliable with raw touch events for this long-press drag interaction.

    const withinHandle = (target: EventTarget | null) => {
        if (!target || !(target instanceof Element)) return false;
        return target.closest(handleSelector) !== null;
    };

    const removeGhost = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (ghostState.ghostEl && ghostState.ghostEl.parentElement) {
            ghostState.ghostEl.parentElement.removeChild(ghostState.ghostEl);
        }
        ghostState.ghostEl = null;
        ghostState.halfWidth = 0;
        ghostState.halfHeight = 0;
    };

    const positionGhost = (clientX: number, clientY: number) => {
        if (!ghostState.ghostEl) return;
        const left = clientX - ghostState.halfWidth;
        const top = clientY - ghostState.halfHeight;
        ghostState.ghostEl.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${ghostScale})`;
    };

    const scheduleGhostPosition = (clientX: number, clientY: number) => {
        pendingClientX = clientX;
        pendingClientY = clientY;
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
            rafId = null;
            positionGhost(pendingClientX, pendingClientY);
        });
    };

    const createGhost = (clientX: number, clientY: number) => {
        removeGhost();

        const rect = node.getBoundingClientRect();
        const clone = node.cloneNode(true) as HTMLElement;
        const computedStyle = window.getComputedStyle(node);
        ghostState.halfWidth = rect.width / 2;
        ghostState.halfHeight = rect.height / 2;

        clone.setAttribute('aria-hidden', 'true');
        clone.style.position = 'fixed';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = '0';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = `${ghostOpacity}`;
        clone.style.zIndex = '2147483647';
        clone.style.willChange = 'transform, opacity';
        clone.style.filter = 'drop-shadow(0 16px 30px rgba(0,0,0,0.38))';
        clone.style.borderRadius = computedStyle.borderRadius;
        clone.style.transformOrigin = 'center center';
        clone.style.transform = `translate3d(${clientX - ghostState.halfWidth}px, ${clientY - ghostState.halfHeight}px, 0) scale(${ghostScale})`;

        ghostState.ghostEl = clone;
        document.body.appendChild(clone);
    };

    const applySourceDragStyle = () => {
        sourceOpacityBeforeDrag = node.style.opacity;
        sourceTransformBeforeDrag = node.style.transform;
        node.style.opacity = `${sourceOpacity}`;
        node.style.transform = `scale(${sourceScale})`;
    };

    const restoreSourceDragStyle = () => {
        node.style.opacity = sourceOpacityBeforeDrag;
        node.style.transform = sourceTransformBeforeDrag;
        sourceOpacityBeforeDrag = '';
        sourceTransformBeforeDrag = '';
    };

    const cancelLongPress = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        removeGhost();
        restoreSourceDragStyle();
        touchId = null;
        dragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        if (!withinHandle(e.target)) return;

        touchId = t.identifier;
        startX = t.clientX;
        startY = t.clientY;
        lastClientX = t.clientX;
        lastClientY = t.clientY;

        longPressTimer = window.setTimeout(() => {
            dragging = true;
            createGhost(startX, startY);
            applySourceDragStyle();
            node.dispatchEvent(
                new CustomEvent('dragstart', {
                    detail: { x: startX, y: startY }
                })
            );
        }, longPressMs);
    };

    const onTouchMove = (e: TouchEvent) => {
        if (touchId === null) return;
        const t = Array.from(e.touches).find((tt) => tt.identifier === touchId);
        if (!t) return;
        lastClientX = t.clientX;
        lastClientY = t.clientY;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const distSq = dx * dx + dy * dy;

        // Movement threshold protects against accidental drags while tapping controls.
        if (!dragging && distSq > 12 * 12) {
            cancelLongPress();
            return;
        }

        if (dragging) {
            e.preventDefault();
            scheduleGhostPosition(t.clientX, t.clientY);
            node.dispatchEvent(
                new CustomEvent('dragmove', {
                    detail: { x: t.clientX, y: t.clientY }
                })
            );
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        if (touchId === null) return;
        const t = Array.from(e.changedTouches).find((tt) => tt.identifier === touchId);
        if (!t) {
            cancelLongPress();
            return;
        }

        if (dragging) {
            node.dispatchEvent(
                new CustomEvent('dragend', {
                    detail: { x: t.clientX, y: t.clientY }
                })
            );
        }

        cancelLongPress();
    };

    const onTouchCancel = () => {
        if (dragging) {
            node.dispatchEvent(
                new CustomEvent('dragend', {
                    detail: { x: lastClientX, y: lastClientY }
                })
            );
        }
        cancelLongPress();
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return {
        update(nextOptions: TouchDragOptions) {
            applyOptions(nextOptions);
        },
        destroy() {
            cancelLongPress();
            node.removeEventListener('touchstart', onTouchStart as any);
            node.removeEventListener('touchmove', onTouchMove as any);
            node.removeEventListener('touchend', onTouchEnd as any);
            node.removeEventListener('touchcancel', onTouchCancel as any);
        }
    };
}

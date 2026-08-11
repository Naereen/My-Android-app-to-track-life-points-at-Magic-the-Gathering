export type TouchDragMeepleOptions = {
    handle?: string; // CSS selector for the meeple handle element inside the node
    longPressMs?: number;
    ghost?: boolean;
    ghostOpacity?: number;
    ghostScale?: number;
};

// Dungeon-meeple drag action (touch long-press) with dedicated ghost animation.
// Events dispatched:
// 'dragstart' { x, y }
// 'dragover'  { x, y }
// 'dragend'   { x, y }
export default function touchDragMeeple(node: HTMLElement, options: TouchDragMeepleOptions = {}) {
    let handleSelector = options.handle || '.meeple-handle';
    let longPressMs = options.longPressMs ?? 240;
    let ghostEnabled = options.ghost ?? true;
    let ghostOpacity = options.ghostOpacity ?? 0.9;
    let ghostScale = options.ghostScale ?? 1.08;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    let longPressTimer: number | null = null;
    let dragging = false;
    let ghostEl: HTMLElement | null = null;
    let ghostHalfWidth = 0;
    let ghostHalfHeight = 0;
    // Offset from the touch point to the meeple centre so the ghost starts
    // at the marker's current on-screen position rather than jumping to the
    // finger tip (which was causing the top-left-corner artifact on first drag).
    let ghostTouchOffsetX = 0;
    let ghostTouchOffsetY = 0;
    let lastClientX = 0;
    let lastClientY = 0;

    const applyOptions = (nextOptions: TouchDragMeepleOptions = {}) => {
        handleSelector = nextOptions.handle || '.meeple-handle';
        longPressMs = nextOptions.longPressMs ?? 240;
        ghostEnabled = nextOptions.ghost ?? true;
        ghostOpacity = nextOptions.ghostOpacity ?? 0.9;
        ghostScale = nextOptions.ghostScale ?? 1.08;
    };

    const removeGhost = () => {
        if (ghostEl && ghostEl.parentElement) {
            ghostEl.parentElement.removeChild(ghostEl);
        }
        ghostEl = null;
        ghostHalfWidth = 0;
        ghostHalfHeight = 0;
        ghostTouchOffsetX = 0;
        ghostTouchOffsetY = 0;
    };

    const positionGhost = (clientX: number, clientY: number) => {
        if (!ghostEl) return;
        // Apply the stored offset so the ghost tracks the meeple centre, not the raw finger tip.
        const cx = clientX + ghostTouchOffsetX;
        const cy = clientY + ghostTouchOffsetY;
        const left = cx - ghostHalfWidth;
        const top = cy - ghostHalfHeight;
        ghostEl.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${ghostScale})`;
    };

    const createGhost = (clientX: number, clientY: number) => {
        if (!ghostEnabled) return;
        removeGhost();

        const rect = node.getBoundingClientRect();
        const clone = node.cloneNode(true) as HTMLElement;
        ghostHalfWidth = rect.width / 2;
        ghostHalfHeight = rect.height / 2;

        // Compute the delta so the ghost appears exactly at the node's current
        // position regardless of where within the marker the user touched.
        const nodeCenterX = rect.left + ghostHalfWidth;
        const nodeCenterY = rect.top + ghostHalfHeight;
        ghostTouchOffsetX = nodeCenterX - clientX;
        ghostTouchOffsetY = nodeCenterY - clientY;

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
        clone.style.willChange = 'transform';
        clone.style.filter = 'drop-shadow(0 8px 18px rgba(0,0,0,0.45))';
        clone.style.transformOrigin = 'center center';

        ghostEl = clone;
        document.body.appendChild(clone);
        positionGhost(clientX, clientY);
    };

    const withinHandle = (target: EventTarget | null) => {
        if (!target || !(target instanceof Element)) return false;
        return target.closest(handleSelector) !== null;
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
            node.dispatchEvent(new CustomEvent('dragstart', {
                detail: { x: startX, y: startY }
            }));
        }, longPressMs);
    };

    const cancelLongPress = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        removeGhost();
        touchId = null;
        dragging = false;
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
        if (!dragging && distSq > 12 * 12) {
            cancelLongPress();
            return;
        }

        if (dragging) {
            e.preventDefault();
            positionGhost(t.clientX, t.clientY);
            node.dispatchEvent(new CustomEvent('dragover', {
                detail: { x: t.clientX, y: t.clientY }
            }));
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
            node.dispatchEvent(new CustomEvent('dragend', {
                detail: { x: t.clientX, y: t.clientY }
            }));
        }

        cancelLongPress();
    };

    const onTouchCancel = () => {
        if (dragging) {
            node.dispatchEvent(new CustomEvent('dragend', {
                detail: { x: lastClientX, y: lastClientY }
            }));
        }
        cancelLongPress();
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return {
        update(nextOptions: TouchDragMeepleOptions) {
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

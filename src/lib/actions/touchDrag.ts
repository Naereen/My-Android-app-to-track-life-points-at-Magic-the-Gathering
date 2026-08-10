export type TouchDragOptions = {
    handle?: string; // CSS selector for the handle element inside the node
    longPressMs?: number;
    ghost?: boolean;
    ghostOpacity?: number;
    ghostScale?: number;
};

// Svelte action for touch-only long-press drag that dispatches custom events:
// 'dragstart' { x, y }
// 'dragover'  { x, y }
// 'dragend'   { x, y }
// The action only starts if the initial touch target matches the handle selector (or is a child of it).
export default function touchDrag(node: HTMLElement, options: TouchDragOptions = {}) {
    let handleSelector = options.handle || '.beleren';
    let longPressMs = options.longPressMs ?? 260;
    let ghostEnabled = options.ghost ?? false;
    let ghostOpacity = options.ghostOpacity ?? 0.92;
    let ghostScale = options.ghostScale ?? 1.06;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    let longPressTimer: number | null = null;
    let dragging = false;
    let ghostEl: HTMLElement | null = null;
    let ghostHalfWidth = 0;
    let ghostHalfHeight = 0;
    let lastClientX = 0;
    let lastClientY = 0;

    const applyOptions = (nextOptions: TouchDragOptions = {}) => {
        handleSelector = nextOptions.handle || '.beleren';
        longPressMs = nextOptions.longPressMs ?? 260;
        ghostEnabled = nextOptions.ghost ?? false;
        ghostOpacity = nextOptions.ghostOpacity ?? 0.92;
        ghostScale = nextOptions.ghostScale ?? 1.06;
    };
    /**
     * Removes the optional drag ghost element from the DOM.
     * @returns {void}
     */
    const removeGhost = () => {
        if (ghostEl && ghostEl.parentElement) {
            ghostEl.parentElement.removeChild(ghostEl);
        }
        ghostEl = null;
        ghostHalfWidth = 0;
        ghostHalfHeight = 0;
    };

    /**
     * Moves the drag ghost to follow the active touch point.
     * @param {number} clientX Touch X coordinate.
     * @param {number} clientY Touch Y coordinate.
     * @returns {void}
     */
    const positionGhost = (clientX: number, clientY: number) => {
        if (!ghostEl) return;
        const left = clientX - ghostHalfWidth;
        const top = clientY - ghostHalfHeight;
        ghostEl.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${ghostScale})`;
    };

    /**
     * Creates a visual ghost copy of the dragged node that follows the finger.
     * @param {number} clientX Touch X coordinate.
     * @param {number} clientY Touch Y coordinate.
     * @returns {void}
     */
    const createGhost = (clientX: number, clientY: number) => {
        if (!ghostEnabled) return;
        removeGhost();

        const rect = node.getBoundingClientRect();
        const clone = node.cloneNode(true) as HTMLElement;
        ghostHalfWidth = rect.width / 2;
        ghostHalfHeight = rect.height / 2;

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


    // We avoid Pointer Events here because Android WebView gesture behavior was more
    // reliable with raw touch events for this long-press drag interaction.

    /**
     * Checks whether the initial touch target belongs to the configured drag handle.
     * @param {EventTarget | null} target Native event target from the touch event.
     * @returns {boolean} `true` when long-press drag is allowed to start.
     */
    const withinHandle = (target: EventTarget | null) => {
        if (!target || !(target instanceof Element)) return false;
        return target.closest(handleSelector) !== null;
    };

    /**
    * Starts long-press detection and initializes drag state for the first touch point.
    * When long press completes, dispatches `dragstart` while leaving the source element anchored.
     * @param {TouchEvent} e Touch start event.
     * @returns {void}
     */
    const onTouchStart = (e: TouchEvent) => {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        // Only start long-press if started inside the handle
        if (!withinHandle(e.target)) return;

        touchId = t.identifier;
        startX = t.clientX;
        startY = t.clientY;
        lastClientX = t.clientX;
        lastClientY = t.clientY;

        longPressTimer = window.setTimeout(() => {
            // dispatch dragstart
            dragging = true;
            createGhost(startX, startY);
            node.dispatchEvent(new CustomEvent('dragstart', {
                detail: { x: startX, y: startY }
            }));
        }, longPressMs);
    };

    /**
     * Cancels pending long-press activation and clears drag-tracking primitives.
     * @returns {void}
     */
    const cancelLongPress = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        removeGhost();
        touchId = null;
        dragging = false;
    };

    /**
     * Handles movement during pending long-press or active drag gesture.
    * Cancels if user moves too far before activation; otherwise emits `dragover` while dragging.
     * @param {TouchEvent} e Touch move event.
     * @returns {void}
     */
    const onTouchMove = (e: TouchEvent) => {
        if (touchId === null) return;
        const t = Array.from(e.touches).find((tt) => tt.identifier === touchId);
        if (!t) return;
        lastClientX = t.clientX;
        lastClientY = t.clientY;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const distSq = dx * dx + dy * dy;
        // Movement threshold protects against accidental drags while tapping life buttons.
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

    /**
     * Finalizes the gesture, emits `dragend` when needed, and restores visual state.
     * @param {TouchEvent} e Touch end event carrying the final pointer location.
     * @returns {void}
     */
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

    /**
     * Ensures dragend still fires when touch sequence is canceled by the browser/WebView.
     * @returns {void}
     */
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

export type TouchDragOptions = {
    handle?: string; // CSS selector for the handle element inside the node
    longPressMs?: number;
};

// Svelte action for touch-only long-press drag that dispatches custom events:
// 'dragstart' { x, y }
// 'dragover'  { x, y }
// 'dragend'   { x, y }
// The action only starts if the initial touch target matches the handle selector (or is a child of it).
export default function touchDrag(node: HTMLElement, options: TouchDragOptions = {}) {
    const handleSelector = options.handle || '.beleren';
    const longPressMs = options.longPressMs ?? 260;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    let longPressTimer: number | null = null;
    let dragging = false;
    let cloneEl: HTMLElement | null = null;
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

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
     * When long press completes, dispatches `dragstart` and creates the floating clone preview.
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

        longPressTimer = window.setTimeout(() => {
            // dispatch dragstart
            dragging = true;
            node.dispatchEvent(new CustomEvent('dragstart', {
                detail: { x: startX, y: startY }
            }));

            // create a visual clone that will follow the finger
            try {
                const rect = node.getBoundingClientRect();
                const cloned = node.cloneNode(true) as HTMLElement;
                cloneEl = cloned;
                // basic styles for the clone
                cloned.style.position = 'fixed';
                cloned.style.top = '0px';
                cloned.style.left = '0px';
                cloned.style.width = `${rect.width}px`;
                cloned.style.height = `${rect.height}px`;
                cloned.style.transform = `translate3d(${startX - rect.width / 2}px, ${startY - rect.height / 2}px, 0)`;
                cloned.style.transition = 'transform 0.06s linear, opacity 0.12s';
                cloned.style.pointerEvents = 'none';
                cloned.style.zIndex = '9999';
                cloned.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
                cloned.style.borderRadius = '12px';
                cloned.setAttribute('aria-hidden', 'true');
                document.body.appendChild(cloned);

                // dim the original node a bit
                (node.style as any).transition = 'opacity 0.12s, transform 0.12s';
                node.style.opacity = '0.35';
                node.style.transform = 'scale(0.98)';

                lastX = startX - rect.width / 2;
                lastY = startY - rect.height / 2;

                /**
                 * Animation frame loop that repositions the floating clone under the finger.
                 * @returns {void}
                 */
                const frame = () => {
                    if (!cloneEl) return;
                    cloneEl.style.transform = `translate3d(${lastX}px, ${lastY}px, 0)`;
                    rafId = window.requestAnimationFrame(frame);
                };
                rafId = window.requestAnimationFrame(frame);
            } catch (err) {
                // ignore clone errors
            }
        }, longPressMs);
    };

    /**
     * Cancels pending long-press activation and clears drag-tracking primitives.
     * @returns {void}
     */
    const cancelLongPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
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
            lastX = t.clientX - ((cloneEl && cloneEl.getBoundingClientRect().width) || 0) / 2;
            lastY = t.clientY - ((cloneEl && cloneEl.getBoundingClientRect().height) || 0) / 2;
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

        // cleanup clone and styles
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (cloneEl && cloneEl.parentNode) {
            cloneEl.parentNode.removeChild(cloneEl);
            cloneEl = null;
        }
        if (node) {
            node.style.opacity = '';
            node.style.transform = '';
        }

        cancelLongPress();
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', cancelLongPress, { passive: true });

    return {
        update(newOptions: TouchDragOptions) {
            // allow dynamic update of handle selector/longpress
            // (not used in POC)
        },
        destroy() {
            cancelLongPress();
            node.removeEventListener('touchstart', onTouchStart as any);
            node.removeEventListener('touchmove', onTouchMove as any);
            node.removeEventListener('touchend', onTouchEnd as any);
            node.removeEventListener('touchcancel', cancelLongPress as any);
        }
    };
}

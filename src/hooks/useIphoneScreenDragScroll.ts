// hooks/useIphoneScreenDragScroll.ts
'use client';

import { useCallback, useRef, useState } from 'react';

type DragState = {
    pointerId: number | null;
    startY: number;
    startX: number;
    startScrollTop: number;
    scrollEl: HTMLElement | null;
    moved: boolean;
};

const DRAG_THRESHOLD_PX = 6;

export function useIphoneScreenDragScroll() {
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef<DragState>({
        pointerId: null,
        startY: 0,
        startX: 0,
        startScrollTop: 0,
        scrollEl: null,
        moved: false,
    });

    const findScrollEl = (target: EventTarget | null): HTMLElement | null => {
        if (!(target instanceof HTMLElement)) return null;
        // Đồng bộ với data-attribute dùng trong IphoneScreenUI.tsx
        return target.closest<HTMLElement>('[data-sheet-scroll]');
    };

    const suppressNextClick = useCallback((el: HTMLElement) => {
        const killClick = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
        el.addEventListener('click', killClick, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', killClick, { capture: true }), 400);
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const scrollEl = findScrollEl(e.target) ?? (e.currentTarget as HTMLElement);
        dragState.current = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startX: e.clientX,
            startScrollTop: scrollEl ? scrollEl.scrollTop : 0,
            scrollEl,
            moved: false,
        };
        // Chưa setPointerCapture ở đây — chờ xác nhận là kéo thật,
        // nếu không thì tap vào dot ảnh / nút bên trong vẫn ra click bình thường.
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const state = dragState.current;
        if (state.pointerId !== e.pointerId || !state.scrollEl) return;

        const deltaY = e.clientY - state.startY;
        const deltaX = e.clientX - state.startX;

        if (!state.moved) {
            if (Math.abs(deltaY) < DRAG_THRESHOLD_PX && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
                return;
            }
            state.moved = true;
            setIsDragging(true);
            try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {}
        }

        state.scrollEl.scrollTop = state.startScrollTop - deltaY;
    }, []);

    const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const state = dragState.current;
        if (state.pointerId !== e.pointerId) return;

        if (state.moved) {
            suppressNextClick(e.currentTarget as HTMLElement);
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {}
        }

        dragState.current = {
            pointerId: null,
            startY: 0,
            startX: 0,
            startScrollTop: 0,
            scrollEl: null,
            moved: false,
        };
        setIsDragging(false);
    }, [suppressNextClick]);

    return {
        isDragging,
        onPointerDown,
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    };
}
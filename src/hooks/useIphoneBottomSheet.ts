// hooks/useIphoneBottomSheet.ts
'use client';

import { useCallback, useRef, useState } from 'react';

// Mốc chiều cao (px) tính theo "top" của sheet trong khung điện thoại 360x770
// Chỉnh 3 số này để đổi độ mở rộng/thu gọn của sheet.
export const SHEET_SNAP_POINTS = {
    HIGH: 70,   // mở gần hết cỡ, giống highestSnapPoint bên RN
    MID: 354,   // mặc định, khớp ~46% chiều cao ảnh cover
    LOW: 620,   // thu gọn, chỉ lộ tay cầm + tên, giống lowestSnapPoint
} as const;

const SNAP_VALUES = [SHEET_SNAP_POINTS.HIGH, SHEET_SNAP_POINTS.MID, SHEET_SNAP_POINTS.LOW];
const DRAG_THRESHOLD_PX = 6;
const FLING_VELOCITY = 0.5; // px/ms — vuốt nhanh hơn ngưỡng này thì nhảy mốc theo hướng vuốt

type DragMode = 'idle' | 'sheet' | 'content';

type DragState = {
    pointerId: number | null;
    startY: number;
    startTop: number;
    mode: DragMode;
    isHandleZone: boolean;
    scrollEl: HTMLElement | null;
    startScrollTop: number;
    lastY: number;
    lastT: number;
    velocity: number;
};

const initialDrag: DragState = {
    pointerId: null,
    startY: 0,
    startTop: SHEET_SNAP_POINTS.MID,
    mode: 'idle',
    isHandleZone: false,
    scrollEl: null,
    startScrollTop: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
};

export function useIphoneBottomSheet() {
    const [sheetTop, setSheetTopState] = useState<number>(SHEET_SNAP_POINTS.MID);
    const [isDragging, setIsDragging] = useState(false);
    const topRef = useRef(SHEET_SNAP_POINTS.MID);
    const drag = useRef<DragState>({ ...initialDrag });

    const setSheetTop = useCallback((value: number) => {
        topRef.current = value;
        setSheetTopState(value);
    }, []);

    const suppressNextClick = useCallback((el: HTMLElement) => {
        const kill = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
        el.addEventListener('click', kill, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', kill, { capture: true }), 400);
    }, []);

    const snapTo = useCallback((top: number, velocity: number) => {
        let target: number;

        if (Math.abs(velocity) > FLING_VELOCITY) {
            if (velocity < 0) {
                // vuốt lên nhanh -> mở rộng thêm 1 mốc
                const wider = SNAP_VALUES.filter((v) => v < top - 1);
                target = wider.length ? Math.max(...wider) : SNAP_VALUES[0];
            } else {
                // vuốt xuống nhanh -> thu gọn thêm 1 mốc
                const narrower = SNAP_VALUES.filter((v) => v > top + 1);
                target = narrower.length ? Math.min(...narrower) : SNAP_VALUES[SNAP_VALUES.length - 1];
            }
        } else {
            target = SNAP_VALUES.reduce((closest, v) =>
                Math.abs(v - top) < Math.abs(closest - top) ? v : closest
            );
        }

        setSheetTop(target);
    }, [setSheetTop]);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isHandleZone = !!target.closest('[data-sheet-handle]');
        const scrollEl = target.closest<HTMLElement>('[data-sheet-scroll]');
        console.log('[2] hook pointerdown', { isHandleZone, hasScrollEl: !!scrollEl });

        drag.current = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startTop: topRef.current,
            mode: 'idle', // xác định thật ở lần move đầu tiên vượt ngưỡng
            isHandleZone,
            scrollEl,
            startScrollTop: scrollEl ? scrollEl.scrollTop : 0,
            lastY: e.clientY,
            lastT: performance.now(),
            velocity: 0,
        };
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d.pointerId !== e.pointerId) return;

        const now = performance.now();
        const dt = Math.max(1, now - d.lastT);
        d.velocity = (e.clientY - d.lastY) / dt;
        d.lastY = e.clientY;
        d.lastT = now;

        const totalDelta = e.clientY - d.startY;

        if (d.mode === 'idle') {
            if (Math.abs(totalDelta) < DRAG_THRESHOLD_PX) return;

            const scrollable = !!d.scrollEl && d.scrollEl.scrollHeight > d.scrollEl.clientHeight + 1;
            const atScrollTop = !d.scrollEl || d.scrollEl.scrollTop <= 0;

            // Vùng nội dung cuộn được ở BẤT KỲ mốc nào, miễn nó thật sự tràn.
            // Chỉ khi đang ở đỉnh cuộn (scrollTop = 0) và kéo XUỐNG tiếp thì mới
            // coi là "kéo để thu gọn sheet" (pull-to-close), giữ đúng cảm giác cũ.
            if (!d.isHandleZone && scrollable && (!atScrollTop || totalDelta < 0)) {
                d.mode = 'content';
            } else {
                d.mode = 'sheet';
            }

            setIsDragging(true);
            try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch { }
        }

        if (d.mode === 'sheet') {
            const next = Math.min(
                SHEET_SNAP_POINTS.LOW,
                Math.max(SHEET_SNAP_POINTS.HIGH, d.startTop + totalDelta)
            );
            setSheetTop(next);
        } else if (d.mode === 'content' && d.scrollEl) {
            d.scrollEl.scrollTop = d.startScrollTop - totalDelta;
        }
    }, [setSheetTop]);

    const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d.pointerId !== e.pointerId) return;

        if (d.mode !== 'idle') {
            suppressNextClick(e.currentTarget as HTMLElement);
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch { }
        }

        if (d.mode === 'sheet') {
            snapTo(topRef.current, d.velocity);
        }

        setIsDragging(false);
        drag.current = { ...initialDrag };
    }, [snapTo, suppressNextClick]);

    return {
        sheetTop,
        isDragging,
        onPointerDown,
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    };
}
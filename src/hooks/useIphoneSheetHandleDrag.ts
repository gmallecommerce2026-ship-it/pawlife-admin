// hooks/useIphoneSheetHandleDrag.ts
'use client';

import { useCallback, useRef, useState } from 'react';

export const SHEET_SNAP_POINTS = { HIGH: 70, MID: 354, LOW: 620 } as const;
const SNAP_VALUES = [SHEET_SNAP_POINTS.HIGH, SHEET_SNAP_POINTS.MID, SHEET_SNAP_POINTS.LOW];
const DRAG_THRESHOLD_PX = 6;
const FLING_VELOCITY = 0.5;

export function useIphoneSheetHandleDrag() {
    const [sheetTop, setSheetTopState] = useState<number>(SHEET_SNAP_POINTS.MID);
    const [isDragging, setIsDragging] = useState(false);
    const topRef = useRef(SHEET_SNAP_POINTS.MID);
    const drag = useRef({
        pointerId: null as number | null,
        startY: 0,
        startTop: SHEET_SNAP_POINTS.MID,
        moved: false,
        lastY: 0,
        lastT: 0,
        velocity: 0,
    });

    const setSheetTop = useCallback((v: number) => {
        topRef.current = v;
        setSheetTopState(v);
    }, []);

    const snapTo = useCallback((top: number, velocity: number) => {
        let target: number;
        if (Math.abs(velocity) > FLING_VELOCITY) {
            if (velocity < 0) {
                const wider = SNAP_VALUES.filter((v) => v < top - 1);
                target = wider.length ? Math.max(...wider) : SNAP_VALUES[0];
            } else {
                const narrower = SNAP_VALUES.filter((v) => v > top + 1);
                target = narrower.length ? Math.min(...narrower) : SNAP_VALUES[SNAP_VALUES.length - 1];
            }
        } else {
            target = SNAP_VALUES.reduce((c, v) => (Math.abs(v - top) < Math.abs(c - top) ? v : c));
        }
        setSheetTop(target);
    }, [setSheetTop]);

    // Gắn trực tiếp lên [data-sheet-handle] — tap nhẹ (chưa vượt threshold) vẫn
    // không setPointerCapture, nên nút "..." trong vùng handle vẫn click bình thường.
    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        drag.current = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startTop: topRef.current,
            moved: false,
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

        if (!d.moved) {
            if (Math.abs(totalDelta) < DRAG_THRESHOLD_PX) return;
            d.moved = true;
            setIsDragging(true);
            try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {}
        }

        const next = Math.min(SHEET_SNAP_POINTS.LOW, Math.max(SHEET_SNAP_POINTS.HIGH, d.startTop + totalDelta));
        setSheetTop(next);
    }, [setSheetTop]);

    const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d.pointerId !== e.pointerId) return;

        if (d.moved) {
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {}
            snapTo(topRef.current, d.velocity);
        }

        setIsDragging(false);
        drag.current.pointerId = null;
    }, [snapTo]);

    return {
        sheetTop,
        isDragging,
        onPointerDown,
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    };
}
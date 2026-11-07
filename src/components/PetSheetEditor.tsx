'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    FiAlignCenter, FiAlignLeft, FiAlignRight, FiArrowLeft, FiBold, FiDroplet, FiExternalLink, FiFilter, FiFolder, FiImage, FiItalic,
    FiPlus, FiRotateCcw, FiRotateCw, FiSearch, FiStar, FiTrash2, FiType, FiX,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axiosClient from '@/lib/api/axiosClient';

type Species = 'DOG' | 'CAT';
type ColType = 'text' | 'suggest' | 'select' | 'readonly';
interface Col { key: string; header: string; width: number; type: ColType; options?: string[] }
interface Row { id: string; avatarUrl: string | null; apps: string; f: Record<string, string> }
interface Item { id: string; patch: Record<string, string> }
interface Cell { r: number; c: number }
interface Fmt { b?: boolean; i?: boolean; c?: string; bg?: string; al?: 'left' | 'center' | 'right' }
interface Hist { undo: Item[]; redo: Item[] }

const BASE = '/shelter-dashboard/pet-sheet';
const ACC = '#E89B5A';
const FILTER0 = { unspayed: false, unvacc: false, apps: false, priority: false };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const letter = (i: number) => { let s = ''; let n = i + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const errMsg = (e: any) => { const m = e?.response?.data?.message; return Array.isArray(m) ? m.join(', ') : m ?? e?.message ?? 'Có lỗi xảy ra'; };
const val = (r: Row, c: Col) => (c.key === 'apps' ? r.apps : r.f[c.key] ?? '');
const isPriority = (r: Row) => norm(r.f.extra ?? '').includes('uu tien');
const togglePriority = (extra: string) =>
    norm(extra).includes('uu tien')
        ? extra.replace(/ưu tiên/gi, '').replace(/^[\s·,;:-]+|[\s·,;:-]+$/g, '').trim()
        : `Ưu tiên${extra ? ` · ${extra}` : ''}`;
const isUnvacc = (r: Row) => { const n = norm(r.f.vacc ?? ''); return !n || n.includes('chua'); };
const saveBlob = (blob: Blob, name: string) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); };
const fit = (col: Col, v: string): string | null => {
    v = v.trim();
    if (col.type !== 'select') return v;
    if (!v) return '';
    return col.options?.find((o) => norm(o) === norm(v)) ?? null;
};

const STATUS_STYLE: Record<string, string> = {
    'Sẵn sàng nhận nuôi': 'bg-[#E5F7ED] text-[#16A34A]', 'Chờ nhận nuôi': 'bg-[#FFF3E0] text-[#E89B5A]',
    'Foster': 'bg-purple-50 text-purple-600', 'Từ chối': 'bg-red-50 text-red-500',
    'Vấn đề sức khỏe': 'bg-amber-50 text-amber-600', 'Đã được nhận nuôi': 'bg-gray-100 text-gray-500',
};
const vaccStyle = (v: string) => {
    const n = norm(v);
    if (n.includes('chua tiem du')) return 'bg-amber-50 text-amber-600';
    if (n.includes('chua tiem')) return 'bg-red-50 text-red-500';
    if (n.includes('da tiem du')) return 'bg-[#E5F7ED] text-[#16A34A]';
    return 'bg-blue-50 text-blue-600';
};
const chip = 'px-2 py-0.5 rounded-full text-xs font-medium';
const GUT = 46, COLA = 108, ROWH = 28, HDRH = 24;

export const PetSheetEditor: React.FC = () => {
    const [species, setSpecies] = useState<Species>('DOG');
    const [cols, setCols] = useState<Col[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [counts, setCounts] = useState({ DOG: 0, CAT: 0 });
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [fArea, setFArea] = useState('');
    const [fStatus, setFStatus] = useState('');
    const [chips, setChips] = useState(FILTER0);
    const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
    const [active, setActive] = useState<Cell | null>(null);
    const [ext, setExt] = useState<Cell | null>(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [fb, setFb] = useState('');
    const [saving, setSaving] = useState(0);
    const [fmt, setFmt] = useState<Record<string, Fmt>>({});
    const [widths, setWidths] = useState<Record<string, number>>({});
    const [zoom, setZoom] = useState(100);
    const [menu, setMenu] = useState<string | null>(null);
    const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
    const [showFilter, setShowFilter] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [find, setFind] = useState({ open: false, text: '', rep: '' });
    const [busy, setBusy] = useState(false);

    const rowsRef = useRef<Row[]>([]); rowsRef.current = rows;
    const spRef = useRef<Species>('DOG');
    const gridRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const editingRef = useRef(false);
    const drag = useRef(false);
    const pend = useRef(0);
    const rowPend = useRef(new Map<string, number>());
    const chain = useRef<Promise<void>>(Promise.resolve());
    const undoRef = useRef<Hist[]>([]);
    const redoRef = useRef<Hist[]>([]);
    const focusNewRef = useRef<string | null>(null);

    // ───────────── Tải dữ liệu ─────────────
    const load = useCallback(async (sp: Species, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const { data } = await axiosClient.get(`${BASE}/grid`, { params: { species: sp } });
            if (sp !== spRef.current) return;
            if (silent && (pend.current > 0 || editingRef.current)) return;
            setCols(data.columns); setRows(data.rows); setCounts(data.counts);
        } catch (e) { if (!silent) toast.error(errMsg(e)); }
        finally { if (!silent) setLoading(false); }
    }, []);

    useEffect(() => { spRef.current = species; load(species); }, [species, load]);
    useEffect(() => {
        const t = setInterval(() => load(spRef.current, true), 15000);
        const onFocus = () => load(spRef.current, true);
        const up = () => { drag.current = false; };
        window.addEventListener('focus', onFocus); window.addEventListener('mouseup', up);
        return () => { clearInterval(t); window.removeEventListener('focus', onFocus); window.removeEventListener('mouseup', up); };
    }, [load]);
    useEffect(() => {
        try {
            setFmt(JSON.parse(localStorage.getItem('petsheet-fmt') ?? '{}'));
            setWidths(JSON.parse(localStorage.getItem('petsheet-w') ?? '{}'));
        } catch { /* bỏ qua */ }
    }, []);
    const persist = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } };

    // ───────────── Lưu (cập nhật ngay, gửi tuần tự) ─────────────
    const save = useCallback((items: Item[], undoable = true) => {
        const cur = new Map(rowsRef.current.map((r) => [r.id, r]));
        const valid = items.filter((it) => cur.has(it.id) && Object.keys(it.patch).length);
        if (!valid.length) return;
        const before: Item[] = valid.map((it) => ({
            id: it.id, patch: Object.fromEntries(Object.keys(it.patch).map((k) => [k, cur.get(it.id)!.f[k] ?? ''])),
        }));
        const pm = new Map(valid.map((it) => [it.id, it.patch]));
        setRows((rs) => rs.map((r) => (pm.has(r.id) ? { ...r, f: { ...r.f, ...pm.get(r.id) } } : r)));
        if (undoable) { undoRef.current.push({ undo: before, redo: valid }); if (undoRef.current.length > 100) undoRef.current.shift(); redoRef.current = []; }
        valid.forEach((it) => rowPend.current.set(it.id, (rowPend.current.get(it.id) ?? 0) + 1));
        pend.current++; setSaving(pend.current);

        chain.current = chain.current.then(async () => {
            let fresh: Row[] | null = null;
            try { fresh = (await axiosClient.post<{ rows: Row[] }>(`${BASE}/grid/batch`, { items: valid })).data.rows; }
            catch (e) { toast.error(errMsg(e)); }
            const fm = new Map((fresh ?? []).map((r) => [r.id, r]));
            const bm = new Map(before.map((b) => [b.id, b.patch]));
            valid.forEach((it) => rowPend.current.set(it.id, (rowPend.current.get(it.id) ?? 1) - 1));
            setRows((rs) => rs.map((r) => {
                if ((rowPend.current.get(r.id) ?? 0) > 0) return r;
                const fr = fm.get(r.id);
                if (fr) return fr;
                if (!fresh && bm.has(r.id)) return { ...r, f: { ...r.f, ...bm.get(r.id) } };
                return r;
            }));
            pend.current--; setSaving(pend.current);
        });
    }, []);

    const undo = () => { const h = undoRef.current.pop(); if (h) { redoRef.current.push(h); save(h.undo, false); } };
    const redo = () => { const h = redoRef.current.pop(); if (h) { undoRef.current.push(h); save(h.redo, false); } };

    // ───────────── Lọc, sắp xếp ─────────────
    const view = useMemo(() => {
        const nq = norm(q.trim());
        let list = rows.filter((r) => {
            if (nq && !norm(Object.values(r.f).join(' ')).includes(nq)) return false;
            if (fArea && r.f.area !== fArea) return false;
            if (fStatus && r.f.status !== fStatus) return false;
            if (chips.unspayed && r.f.spay !== 'Chưa triệt sản') return false;
            if (chips.unvacc && !isUnvacc(r)) return false;
            if (chips.apps && !r.apps) return false;
            if (chips.priority && !isPriority(r)) return false;
            return true;
        });
        if (sort) list = [...list].sort((a, b) => (a.f[sort.key] ?? '').localeCompare(b.f[sort.key] ?? '', 'vi', { numeric: true }) * sort.dir);
        return list;
    }, [rows, q, fArea, fStatus, chips, sort]);
    const orig = useMemo(() => new Map(rows.map((r, i) => [r.id, i + 1])), [rows]);
    const stats = useMemo(() => ({
        total: rows.length,
        ready: rows.filter((r) => r.f.status === 'Sẵn sàng nhận nuôi').length,
        foster: rows.filter((r) => r.f.status === 'Foster').length,
        adopted: rows.filter((r) => r.f.status === 'Đã được nhận nuôi').length,
        unspayed: rows.filter((r) => r.f.spay === 'Chưa triệt sản').length,
        unvacc: rows.filter(isUnvacc).length,
        apps: rows.filter((r) => r.apps).length,
    }), [rows]);
    const areaOptions = useMemo(() => [...new Set(rows.map((r) => r.f.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [rows]);
    const statusOptions = cols.find((c) => c.key === 'status')?.options ?? [];
    const nameIdx = Math.max(cols.findIndex((c) => c.key === 'name'), cols.findIndex((c) => c.key === 'id'), 0);
    const W = (c: Col) => widths[c.key] ?? c.width * 7 + 16;
    const totalWidth = GUT + COLA + cols.reduce((s, c) => s + W(c), 0) + 72;

    // ───────────── Vùng chọn ─────────────
    const rng = useMemo(() => {
        if (!active) return null;
        const e = ext ?? active;
        return { r1: Math.min(active.r, e.r), r2: Math.max(active.r, e.r), c1: Math.min(active.c, e.c), c2: Math.max(active.c, e.c) };
    }, [active, ext]);
    const inRng = (r: number, c: number) => !!rng && r >= rng.r1 && r <= rng.r2 && c >= rng.c1 && c <= rng.c2;
    const activeCol = active ? cols[active.c] : undefined;
    const activeRow = active ? view[active.r] : undefined;
    const activeVal = activeRow && activeCol ? val(activeRow, activeCol) : '';
    useEffect(() => { setFb(activeVal); }, [activeVal, active]);
    const fk = (r?: Row, c?: Col) => (r && c ? `${r.id}|${c.key}` : '');
    const selInfo = useMemo(() => {
        if (!rng) return null;
        let n = 0, filled = 0, sum = 0, nums = 0;
        for (let r = rng.r1; r <= rng.r2; r++) for (let c = rng.c1; c <= rng.c2; c++) {
            const row = view[r], col = cols[c];
            if (!row || !col) continue;
            n++; const v = val(row, col);
            if (v) { filled++; if (col.key !== 'id' && /^[\d.,\s]+$/.test(v)) { const x = parseFloat(v.replace(',', '.')); if (!isNaN(x)) { sum += x; nums++; } } }
        }
        return { n, filled, sum, nums };
    }, [rng, view, cols]);

    const setCells = (u: { r: number; c: number; v: string }[]) => {
        const m = new Map<string, Record<string, string>>();
        for (const { r, c, v } of u) {
            const row = view[r], col = cols[c];
            if (!row || !col || col.type === 'readonly' || val(row, col) === v) continue;
            m.set(row.id, { ...(m.get(row.id) ?? {}), [col.key]: v });
        }
        save([...m].map(([id, patch]) => ({ id, patch })));
    };
    const eachCell = (f: (r: number, c: number) => void) => { if (rng) for (let r = rng.r1; r <= rng.r2; r++) for (let c = rng.c1; c <= rng.c2; c++) f(r, c); };
    const clearRange = () => { const u: { r: number; c: number; v: string }[] = []; eachCell((r, c) => u.push({ r, c, v: '' })); setCells(u); };
    const rangeText = () => {
        if (!rng) return '';
        const out: string[] = [];
        for (let r = rng.r1; r <= rng.r2; r++) {
            const line: string[] = [];
            for (let c = rng.c1; c <= rng.c2; c++) line.push(view[r] && cols[c] ? val(view[r], cols[c]) : '');
            out.push(line.join('\t'));
        }
        return out.join('\n');
    };
    const copyRange = () => navigator.clipboard?.writeText(rangeText()).then(() => toast.success('Đã sao chép'), () => toast.error('Trình duyệt chặn clipboard'));
    const pasteText = (text: string) => {
        if (!rng || !text) return;
        const lines = text.replace(/\r/g, '').split('\n');
        if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
        const u: { r: number; c: number; v: string }[] = [];
        const single = lines.length === 1 && !lines[0].includes('\t');
        if (single) {
            eachCell((r, c) => { const v = fit(cols[c], lines[0]); if (v !== null && cols[c]) u.push({ r, c, v }); });
        } else {
            lines.forEach((line, i) => line.split('\t').forEach((raw, j) => {
                const r = rng.r1 + i, c = rng.c1 + j;
                if (!view[r] || !cols[c]) return;
                const v = fit(cols[c], raw);
                if (v !== null) u.push({ r, c, v });
            }));
        }
        setCells(u);
        toast.success(`Đã dán ${u.length} ô`);
    };
    const pasteClip = () => navigator.clipboard?.readText().then(pasteText, () => toast.error('Hãy nhấn Ctrl+V để dán'));
    const fillDown = () => {
        if (!rng) return;
        const u: { r: number; c: number; v: string }[] = [];
        for (let c = rng.c1; c <= rng.c2; c++) for (let r = rng.r1 + 1; r <= rng.r2; r++) if (view[rng.r1] && cols[c]) u.push({ r, c, v: val(view[rng.r1], cols[c]) });
        setCells(u);
    };
    const fmtSel = (k: keyof Fmt, v?: string | boolean) => {
        if (!rng) return;
        const nv = v ?? !fmt[fk(view[rng.r1], cols[rng.c1])]?.[k];
        const n = { ...fmt };
        eachCell((r, c) => { const key = fk(view[r], cols[c]); if (key) n[key] = { ...n[key], [k]: nv as any }; });
        setFmt(n); persist('petsheet-fmt', n);
    };
    const clearFmt = () => {
        if (!rng) return;
        const n = { ...fmt };
        eachCell((r, c) => { delete n[fk(view[r], cols[c])]; });
        setFmt(n); persist('petsheet-fmt', n);
    };
    const fbApply = (v: string) => {
        if (!rng || !activeCol) return;
        const fv = fit(activeCol, v);
        if (fv === null) { toast.error('Giá trị không nằm trong danh sách'); setFb(activeVal); return; }
        const u: { r: number; c: number; v: string }[] = [];
        eachCell((r, c) => u.push({ r, c, v: fv }));
        if (fv !== activeVal || u.length > 1) setCells(u);
    };

    // ───────────── Sửa ô / điều hướng ─────────────
    const startEdit = (initial?: string, at: Cell | null = active) => {
        if (!at) return;
        const row = view[at.r], col = cols[at.c];
        if (!row || !col || col.type === 'readonly') return;
        setExt(null); setDraft(initial ?? val(row, col));
        editingRef.current = true; setEditing(true);
    };
    const move = (dr: number, dc: number, extend = false) => {
        if (!view.length || !cols.length) return;
        const clamp = (p: Cell): Cell => ({ r: Math.min(Math.max(p.r, 0), view.length - 1), c: Math.min(Math.max(p.c, 0), cols.length - 1) });
        if (extend) setExt((e) => { const b = e ?? active ?? { r: 0, c: 0 }; return clamp({ r: b.r + dr, c: b.c + dc }); });
        else { setExt(null); setActive((a) => { const b = a ?? { r: 0, c: 0 }; return clamp({ r: b.r + dr, c: b.c + dc }); }); }
    };
    const commit = (value: string, dir: 'down' | 'right' | 'left' | null, refocus = false) => {
        if (!editingRef.current) return;
        editingRef.current = false; setEditing(false);
        if (active) {
            const row = view[active.r], col = cols[active.c], v = value.trim();
            if (row && col && v !== val(row, col)) save([{ id: row.id, patch: { [col.key]: v } }]);
        }
        if (dir === 'down') move(1, 0);
        if (dir === 'right') move(0, 1);
        if (dir === 'left') move(0, -1);
        if (refocus) setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 0);
    };
    const cancelEdit = () => { editingRef.current = false; setEditing(false); setTimeout(() => gridRef.current?.focus(), 0); };

    const onGridKeyDown = (e: React.KeyboardEvent) => {
        if (editing || e.target !== e.currentTarget) return;
        const mod = e.ctrlKey || e.metaKey;
        if (mod) {
            const k = e.key.toLowerCase();
            if (k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
            if (k === 'y') { e.preventDefault(); redo(); return; }
            if (k === 'd') { e.preventDefault(); fillDown(); return; }
            if (k === 'b') { e.preventDefault(); fmtSel('b'); return; }
            if (k === 'i') { e.preventDefault(); fmtSel('i'); return; }
            if (k === 'h' || k === 'f') { e.preventDefault(); setFind((f) => ({ ...f, open: true })); return; }
            if (k === 'a') { e.preventDefault(); setActive({ r: 0, c: 0 }); setExt({ r: view.length - 1, c: cols.length - 1 }); return; }
            return;
        }
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); move(1, 0, e.shiftKey); return;
            case 'ArrowUp': e.preventDefault(); move(-1, 0, e.shiftKey); return;
            case 'ArrowLeft': e.preventDefault(); move(0, -1, e.shiftKey); return;
            case 'ArrowRight': e.preventDefault(); move(0, 1, e.shiftKey); return;
            case 'Tab': e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return;
            case 'Escape': setExt(null); setCtx(null); return;
            case 'Enter': case 'F2': e.preventDefault(); startEdit(); return;
            case 'Delete': case 'Backspace': e.preventDefault(); clearRange(); return;
        }
        if (!e.altKey && e.key.length === 1 && activeCol && activeCol.type !== 'readonly' && activeCol.type !== 'select') {
            e.preventDefault(); startEdit(e.key);
        }
    };
    const onCopy = (e: React.ClipboardEvent) => { if (editing || !rng) return; e.clipboardData.setData('text/plain', rangeText()); e.preventDefault(); };
    const onCut = (e: React.ClipboardEvent) => { onCopy(e); if (!editing) clearRange(); };
    const onPaste = (e: React.ClipboardEvent) => { if (editing) return; e.preventDefault(); pasteText(e.clipboardData.getData('text/plain')); };

    useEffect(() => {
        if (active) document.getElementById(`pc-${active.r}-${active.c}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [active]);
    useEffect(() => {
        if (!focusNewRef.current) return;
        const idx = view.findIndex((r) => r.id === focusNewRef.current);
        if (idx < 0 || !cols.length) return;
        focusNewRef.current = null;
        const at = { r: idx, c: nameIdx };
        setActive(at); startEdit(undefined, at);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    // ───────────── Hành động ─────────────
    const switchSpecies = (sp: Species) => {
        if (sp === species) return;
        setSpecies(sp); setActive(null); setExt(null); setEditing(false); editingRef.current = false;
        setFArea(''); setFStatus(''); setQ(''); setSort(null); setChips(FILTER0);
        undoRef.current = []; redoRef.current = [];
    };
    const addRow = async () => {
        try {
            const { data } = await axiosClient.post<Row>(`${BASE}/grid`, { species });
            setQ(''); setFArea(''); setFStatus(''); setSort(null); setChips(FILTER0);
            focusNewRef.current = data.id;
            setRows((r) => [...r, data]); setCounts((c) => ({ ...c, [species]: c[species] + 1 }));
        } catch (e) { toast.error(errMsg(e)); }
    };
    const delRows = async () => {
        if (!rng) return;
        const targets = view.slice(rng.r1, rng.r2 + 1);
        if (!targets.length || !window.confirm(`Xoá ${targets.length} dòng đã chọn? Không thể hoàn tác.`)) return;
        const res = await Promise.allSettled(targets.map((t) => axiosClient.delete(`${BASE}/grid/${t.id}`)));
        const ok = new Set<string>();
        res.forEach((r, i) => { if (r.status === 'fulfilled') ok.add(targets[i].id); else toast.error(errMsg((r as PromiseRejectedResult).reason)); });
        setRows((r) => r.filter((x) => !ok.has(x.id)));
        setCounts((c) => ({ ...c, [species]: c[species] - ok.size }));
        setExt(null);
    };
    const sortCol = (dir: 1 | -1) => { if (activeCol) setSort({ key: activeCol.key, dir }); };
    const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } };
    const download = (p: string, n: string) => run(async () => { saveBlob((await axiosClient.get(`${BASE}/${p}`, { responseType: 'blob' })).data, n); });
    const upload = (f: File) => run(async () => {
        const fd = new FormData(); fd.append('file', f);
        const { data } = await axiosClient.post(`${BASE}/upload`, fd);
        await load(species, false);
        toast.success(`Đã nhập: ${data.created} mới, ${data.updated} cập nhật, ${data.unchanged} không đổi.`);
    });
    const replaceAll = () => {
        if (!find.text) return;
        const re = new RegExp(esc(find.text), 'gi');
        const u: { r: number; c: number; v: string }[] = [];
        view.forEach((row, r) => cols.forEach((col, c) => {
            if (col.type === 'readonly') return;
            const v = val(row, col);
            if (!re.test(v)) { re.lastIndex = 0; return; }
            re.lastIndex = 0;
            const nv = fit(col, v.replace(re, find.rep));
            if (nv !== null) u.push({ r, c, v: nv });
        }));
        setCells(u); toast.success(`Đã thay thế ${u.length} ô`);
    };
    const hits = find.open && find.text ? view.reduce((n, row) => n + cols.filter((c) => norm(val(row, c)).includes(norm(find.text))).length, 0) : 0;
    const hasFilter = !!(q || fArea || fStatus || Object.values(chips).some(Boolean));

    const startResize = (e: React.MouseEvent, col: Col) => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, w0 = W(col);
        const mv = (ev: MouseEvent) => setWidths((w) => ({ ...w, [col.key]: Math.max(48, w0 + (ev.clientX - x0) / (zoom / 100)) }));
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); setWidths((w) => { persist('petsheet-w', w); return w; }); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    };

    // ───────────── Hiển thị ─────────────
    const display = (col: Col, row: Row) => {
        const v = val(row, col);
        if (col.key === 'photo' && v) {
            const m = /^(.*)\|(https?:\/\/\S+)$/.exec(v);
            const url = m ? m[2] : /^https?:/.test(v) ? v : '';
            const text = m ? m[1] : url ? '' : v;
            const folder = url ? url.includes('/folders/') : !/\.[a-z]{2,5}$/i.test(text);
            const label = text || (folder ? 'Thư mục ảnh' : 'Ảnh');
            const cls = 'inline-flex items-center gap-1.5 max-w-full px-2.5 py-0.5 rounded-full bg-[#F1F3F4] border border-gray-200 text-[13px] text-gray-800';
            const body = (<>
                {folder ? <FiFolder size={13} className="text-gray-700 shrink-0" /> : <FiImage size={13} className="text-[#EA4335] shrink-0" />}
                <span className="truncate">{label}</span>
            </>);
            return url
                ? <a href={url} target="_blank" rel="noreferrer" onMouseDown={(e) => e.stopPropagation()} className={`${cls} hover:bg-[#E8EAED]`}>{body}</a>
                : <span className={cls}>{body}</span>;
        }
        if (col.key === 'status' && v) return <span className={`${chip} ${STATUS_STYLE[v] ?? 'bg-gray-100 text-gray-500'}`}>{v}</span>;
        if (col.key === 'vacc' && v) return <span className={`${chip} ${vaccStyle(v)}`}>{v}</span>;
        if (col.key === 'apps') return v ? <span className={`${chip} bg-[#FFF3E0] text-[#E89B5A]`}>{v}</span> : null;
        return <span title={v}>{v}</span>;
    };
    const tb = (icon: React.ReactNode, title: string, onClick: () => void, on = false) => (
        <button type="button" title={title} onClick={onClick} className={`p-1.5 rounded hover:bg-gray-200 ${on ? 'bg-[#FFEBD6] text-[#E89B5A]' : 'text-gray-600'}`}>{icon}</button>
    );
    const sep = <span className="w-px h-5 bg-gray-300 mx-1" />;
    const colorBtn = (icon: React.ReactNode, title: string, k: 'c' | 'bg') => (
        <label title={title} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 cursor-pointer">
            {icon}<input type="color" className="sr-only" onChange={(e) => fmtSel(k, e.target.value)} />
        </label>
    );
    const chipBtn = (k: keyof typeof chips, label: string) => (
        <button key={k} type="button" onClick={() => setChips((c) => ({ ...c, [k]: !c[k] }))}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${chips[k] ? 'bg-[#E89B5A] text-white border-[#E89B5A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#E89B5A]'}`}>{label}</button>
    );
    const selCls = 'bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 focus:outline-none focus:border-[#E89B5A]';

    const menus: Record<string, [string, () => void, string?][]> = {
        'Tệp': [['Nhập từ Excel (.xlsx)', () => fileRef.current?.click()], ['Xuất Excel (.xlsx)', () => download('export', 'pawlife-pets.xlsx')], ['Tải file mẫu', () => download('template', 'pawlife-pet-template.xlsx')], ['Lấy ảnh từ thư mục Drive', () => run(async () => { const { data } = await axiosClient.post(`${BASE}/images`); await load(species, false); toast.success(`Đã gắn ${data.added} ảnh cho ${data.pets} pet`); })]],
        'Chỉnh sửa': [['Hoàn tác', undo, 'Ctrl+Z'], ['Làm lại', redo, 'Ctrl+Y'], ['Sao chép', copyRange, 'Ctrl+C'], ['Dán', pasteClip, 'Ctrl+V'], ['Điền xuống', fillDown, 'Ctrl+D'], ['Xoá nội dung', clearRange, 'Del'], ['Tìm và thay thế', () => setFind((f) => ({ ...f, open: true })), 'Ctrl+H']],
        'Xem': [['Bật/tắt bộ lọc', () => setShowFilter((v) => !v)], ['Bật/tắt thống kê', () => setShowStats((v) => !v)], ['Thu phóng 100%', () => setZoom(100)]],
        'Chèn': [['Thêm dòng ở cuối', addRow]],
        'Định dạng': [['Đậm', () => fmtSel('b'), 'Ctrl+B'], ['Nghiêng', () => fmtSel('i'), 'Ctrl+I'], ['Căn trái', () => fmtSel('al', 'left')], ['Căn giữa', () => fmtSel('al', 'center')], ['Căn phải', () => fmtSel('al', 'right')], ['Xoá định dạng', clearFmt]],
        'Dữ liệu': [['Sắp xếp A → Z theo cột', () => sortCol(1)], ['Gộp pet trùng ID / tên', () => run(async () => {
            const pre = (await axiosClient.post(`${BASE}/merge`)).data;
            if (!pre.extra) { toast.success('Không có pet nào trùng.'); return; }
            const ex = pre.preview.slice(0, 5).map((g: any) => `• ${g.keep} ← ${g.merge.join(', ')}`).join('\n');
            if (!window.confirm(`Tìm thấy ${pre.groups} nhóm trùng (${pre.extra} pet thừa):\n${ex}\n\nGộp lại? Không thể hoàn tác.`)) return;
            const r = (await axiosClient.post(`${BASE}/merge?dry=0`)).data;
            await load(species, false);
            toast.success(`Đã gộp ${r.merged} pet${r.blocked ? `, ${r.blocked} pet bị chặn do dữ liệu liên quan` : ''}.`);
        })], ['Sắp xếp Z → A theo cột', () => sortCol(-1)], ['Bỏ sắp xếp', () => setSort(null)], ['Xoá các dòng đã chọn', delRows]],
    };
    const ctxItems: [string, () => void][] = [['Sao chép', copyRange], ['Dán', pasteClip], ['Xoá nội dung', clearRange], ['Thêm dòng ở cuối', addRow], ['Xoá dòng đã chọn', delRows], ['Đánh dấu / bỏ ưu tiên', () => activeRow && save([{ id: activeRow.id, patch: { extra: togglePriority(activeRow.f.extra ?? '') } }])]];
    const nameBox = rng ? `${letter(rng.c1 + 1)}${rng.r1 + 2}${rng.r1 !== rng.r2 || rng.c1 !== rng.c2 ? `:${letter(rng.c2 + 1)}${rng.r2 + 2}` : ''}` : '';

    return (
        <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
            {(menu || ctx) && <div className="fixed inset-0 z-40" onMouseDown={() => { setMenu(null); setCtx(null); }} onContextMenu={(e) => { e.preventDefault(); setMenu(null); setCtx(null); }} />}

            {/* Tiêu đề + menu */}
            <div className="flex items-center gap-3 px-3 pt-2">
                <Link href="/shelter/pets" className="p-1.5 text-gray-400 hover:text-gray-700"><FiArrowLeft size={18} /></Link>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: ACC }}>P</div>
                <div>
                    <div className="text-[17px] text-[#0D062D] font-medium leading-tight">Hồ sơ pet — {species === 'DOG' ? 'TT chó lụm' : 'TT mèo'}</div>
                    <div className="flex items-center relative text-[13px] text-gray-700">
                        {Object.entries(menus).map(([name, items]) => (
                            <div key={name} className="relative">
                                <button type="button" onClick={() => setMenu(menu === name ? null : name)} className={`px-2 py-0.5 rounded hover:bg-gray-100 ${menu === name ? 'bg-gray-100' : ''}`}>{name}</button>
                                {menu === name && (
                                    <div className="absolute left-0 top-full mt-1 min-w-[230px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                        {items.map(([l, fn, k]) => (
                                            <button key={l} type="button" onClick={() => { setMenu(null); fn(); }} className="w-full flex justify-between gap-6 px-4 py-1.5 text-left hover:bg-[#FFF4EA]">
                                                <span>{l}</span><span className="text-gray-400 text-xs">{k}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1" />
                <span className={`text-xs ${saving || busy ? 'text-[#E89B5A]' : 'text-gray-400'}`}>{saving || busy ? 'Đang lưu...' : '✓ Đã lưu tự động'}</span>
            </div>

            {/* Thanh công cụ */}
            <div className="flex flex-wrap items-center gap-0.5 mx-3 my-1.5 px-2 py-1 bg-[#EDF2FA] rounded-full">
                {tb(<FiRotateCcw size={15} />, 'Hoàn tác (Ctrl+Z)', undo)}
                {tb(<FiRotateCw size={15} />, 'Làm lại (Ctrl+Y)', redo)}
                {tb(<FiSearch size={15} />, 'Tìm và thay thế (Ctrl+H)', () => setFind((f) => ({ ...f, open: !f.open })), find.open)}
                {tb(<FiFilter size={15} />, 'Bộ lọc', () => setShowFilter((v) => !v), showFilter)}
                {sep}
                <select value={zoom} onChange={(e) => setZoom(+e.target.value)} className="bg-transparent text-xs text-gray-700 rounded hover:bg-gray-200 py-1">
                    {[75, 90, 100, 110, 125, 150].map((z) => <option key={z} value={z}>{z}%</option>)}
                </select>
                {sep}
                {tb(<FiBold size={15} />, 'Đậm (Ctrl+B)', () => fmtSel('b'))}
                {tb(<FiItalic size={15} />, 'Nghiêng (Ctrl+I)', () => fmtSel('i'))}
                {colorBtn(<FiType size={15} />, 'Màu chữ', 'c')}
                {colorBtn(<FiDroplet size={15} />, 'Màu nền', 'bg')}
                {tb(<FiAlignLeft size={15} />, 'Căn trái', () => fmtSel('al', 'left'))}
                {tb(<FiAlignCenter size={15} />, 'Căn giữa', () => fmtSel('al', 'center'))}
                {tb(<FiAlignRight size={15} />, 'Căn phải', () => fmtSel('al', 'right'))}
                {sep}
                {tb(<FiPlus size={15} />, 'Thêm dòng', addRow)}
                {tb(<FiTrash2 size={15} />, 'Xoá dòng đã chọn', delRows)}
                {tb(<FiStar size={15} />, 'Đánh dấu ưu tiên', () => ctxItems[5][1]())}
            </div>

            {/* Thanh công thức */}
            <div className="flex items-center border-y border-gray-200 text-sm">
                <div className="w-28 px-3 py-1 border-r border-gray-200 text-gray-600 text-center font-medium">{nameBox || '—'}</div>
                <span className="px-3 text-gray-400 italic">fx</span>
                {activeCol?.type === 'select' ? (
                    <select value={fb} onChange={(e) => { setFb(e.target.value); fbApply(e.target.value); }} className="flex-1 py-1 outline-none bg-white">
                        <option value="">—</option>
                        {[...(activeCol.options ?? []), ...(fb && !activeCol.options?.includes(fb) ? [fb] : [])].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                ) : (
                    <input value={fb} disabled={!activeCol || activeCol.type === 'readonly'} list={activeCol?.type === 'suggest' ? `dl-${activeCol.key}` : undefined}
                        onChange={(e) => setFb(e.target.value)} onBlur={() => fb !== activeVal && fbApply(fb)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { fbApply(fb); gridRef.current?.focus(); } else if (e.key === 'Escape') { setFb(activeVal); gridRef.current?.focus(); } }}
                        className="flex-1 py-1 outline-none bg-transparent" placeholder={activeCol ? '' : 'Chọn một ô để xem / sửa nội dung'} />
                )}
            </div>

            {/* Thống kê + bộ lọc */}
            {showStats && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2 text-xs">
                    {([['Tổng', stats.total, 'bg-gray-100 text-gray-600'], ['Sẵn sàng', stats.ready, 'bg-[#E5F7ED] text-[#16A34A]'], ['Foster', stats.foster, 'bg-purple-50 text-purple-600'],
                    ['Đã nhận nuôi', stats.adopted, 'bg-gray-100 text-gray-500'], ['Chưa triệt sản', stats.unspayed, 'bg-amber-50 text-amber-600'],
                    ['Chưa tiêm đủ', stats.unvacc, 'bg-red-50 text-red-500'], ['Có đơn', stats.apps, 'bg-[#FFF3E0] text-[#E89B5A]']] as const).map(([l, n, c]) => (
                        <span key={l} className={`px-2.5 py-0.5 rounded-full font-medium ${c}`}>{l}: {n}</span>
                    ))}
                </div>
            )}
            {showFilter && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <div className="relative min-w-[220px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo ID, giống, khu, ghi chú..."
                            className="w-full border border-gray-200 rounded-full pl-8 pr-3 py-1 text-sm focus:border-[#E89B5A] focus:outline-none" />
                    </div>
                    <select value={fArea} onChange={(e) => setFArea(e.target.value)} className={selCls}>
                        <option value="">Tất cả khu</option>{areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selCls}>
                        <option value="">Mọi tình trạng</option>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {chipBtn('unspayed', 'Chưa triệt sản')}{chipBtn('unvacc', 'Chưa tiêm đủ')}{chipBtn('priority', '⭐ Ưu tiên')}{chipBtn('apps', 'Có đơn nhận nuôi')}
                    {hasFilter && <button type="button" onClick={() => { setQ(''); setFArea(''); setFStatus(''); setChips(FILTER0); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"><FiX size={12} /> Xoá lọc</button>}
                </div>
            )}

            {/* Tìm và thay thế */}
            {find.open && (
                <div className="flex flex-wrap items-center gap-2 mx-3 mb-2 px-3 py-2 bg-[#FFF9F2] border border-[#F8D2B0] rounded-xl text-sm">
                    <input autoFocus value={find.text} onChange={(e) => setFind({ ...find, text: e.target.value })} placeholder="Tìm" className="border border-gray-200 rounded px-2 py-1 w-44 focus:outline-none focus:border-[#E89B5A]" />
                    <input value={find.rep} onChange={(e) => setFind({ ...find, rep: e.target.value })} placeholder="Thay bằng" className="border border-gray-200 rounded px-2 py-1 w-44 focus:outline-none focus:border-[#E89B5A]" />
                    <span className="text-xs text-gray-500">{find.text ? `${hits} kết quả` : ''}</span>
                    <button type="button" onClick={replaceAll} className="px-3 py-1 rounded-full text-white text-xs font-medium" style={{ background: ACC }}>Thay thế tất cả</button>
                    <button type="button" onClick={() => setFind({ open: false, text: '', rep: '' })} className="ml-auto text-gray-400 hover:text-gray-700"><FiX size={14} /></button>
                </div>
            )}

            {/* Bảng */}
            {loading ? <div className="h-64 bg-gray-100 animate-pulse" /> : (
                <div ref={gridRef} tabIndex={0} onKeyDown={onGridKeyDown} onCopy={onCopy} onCut={onCut} onPaste={onPaste}
                    className="outline-none overflow-auto max-h-[calc(100vh-330px)] bg-white select-none border-t border-gray-200" style={{ zoom: zoom / 100 }}>
                    <table className="border-separate border-spacing-0 text-[13px]" style={{ tableLayout: 'fixed', width: totalWidth }}>
                        <colgroup>
                            <col style={{ width: GUT }} /><col style={{ width: COLA }} />
                            {cols.map((c) => <col key={c.key} style={{ width: W(c) }} />)}
                            <col style={{ width: 72 }} />
                        </colgroup>
                        <thead>
                            {/* Hàng chữ cái cột */}
                            <tr>
                                <th className="sticky top-0 left-0 z-30 bg-[#F8F9FA] border-b border-r border-gray-300" style={{ height: HDRH }} />
                                <th className="sticky top-0 z-30 bg-[#F8F9FA] border-b border-r border-gray-300 text-xs font-normal text-gray-500" style={{ left: GUT, height: HDRH }}>A</th>
                                {cols.map((c, ci) => {
                                    const on = !!rng && ci >= rng.c1 && ci <= rng.c2;
                                    return (
                                        <th key={c.key} onClick={() => { setActive({ r: 0, c: ci }); setExt({ r: Math.max(view.length - 1, 0), c: ci }); gridRef.current?.focus(); }}
                                            className={`sticky top-0 z-20 relative border-b border-r border-gray-300 text-xs font-normal cursor-pointer ${on ? 'bg-[#FFE4CC] text-[#B45F1A]' : 'bg-[#F8F9FA] text-gray-500'}`} style={{ height: HDRH }}>
                                            {letter(ci + 1)}
                                            <span onMouseDown={(e) => startResize(e, c)} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[#E89B5A]" />
                                        </th>
                                    );
                                })}
                                <th className="sticky top-0 z-20 bg-[#F8F9FA] border-b border-gray-300" style={{ height: HDRH }} />
                            </tr>
                            {/* Hàng tiêu đề (dòng 1) */}
                            <tr>
                                <th className="sticky left-0 z-30 bg-[#F8F9FA] border-b border-r border-gray-300 text-xs font-normal text-gray-500" style={{ top: HDRH, height: ROWH }}>1</th>
                                <th className="sticky z-30 bg-[#F3F4F6] border-b border-r border-gray-300 text-left px-2 font-semibold text-gray-700" style={{ top: HDRH, left: GUT, height: ROWH }}>STT</th>
                                {cols.map((c) => (
                                    <th key={c.key} onClick={() => c.type !== 'readonly' && setSort((s) => (s?.key !== c.key ? { key: c.key, dir: 1 } : s.dir === 1 ? { key: c.key, dir: -1 } : null))}
                                        className="sticky z-20 bg-[#F3F4F6] border-b border-r border-gray-300 text-left px-2 font-semibold text-gray-700 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis" style={{ top: HDRH, height: ROWH }}>
                                        {c.header}{sort?.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                                    </th>
                                ))}
                                <th className="sticky z-20 bg-[#F3F4F6] border-b border-gray-300" style={{ top: HDRH, height: ROWH }} />
                            </tr>
                        </thead>
                        <tbody>
                            {view.map((row, r) => {
                                const rowOn = !!rng && r >= rng.r1 && r <= rng.r2;
                                const star = isPriority(row);
                                return (
                                    <tr key={row.id} className="group bg-white">
                                        <td onClick={() => { setActive({ r, c: 0 }); setExt({ r, c: cols.length - 1 }); gridRef.current?.focus(); }}
                                            className={`sticky left-0 z-[5] border-b border-r border-gray-300 text-center text-xs cursor-pointer ${rowOn ? 'bg-[#FFE4CC] text-[#B45F1A]' : 'bg-[#F8F9FA] text-gray-500'}`} style={{ height: ROWH }}>{r + 2}</td>
                                        <td className="sticky z-[5] bg-white border-b border-r border-gray-200 px-1.5" style={{ left: GUT, height: ROWH }}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-400 w-7 text-right">{orig.get(row.id)}</span>
                                                {row.avatarUrl
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={row.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                    : <span className="w-6 h-6 rounded-full bg-gray-100 shrink-0" />}
                                                <button type="button" title="Đánh dấu ưu tiên" onClick={() => save([{ id: row.id, patch: { extra: togglePriority(row.f.extra ?? '') } }])}
                                                    className={star ? 'text-[#F5B301]' : 'text-gray-200 hover:text-gray-400'}><FiStar size={13} fill={star ? 'currentColor' : 'none'} /></button>
                                            </div>
                                        </td>
                                        {cols.map((col, c) => {
                                            const isActive = active?.r === r && active?.c === c;
                                            const isEditing = isActive && editing;
                                            const f = fmt[fk(row, col)];
                                            const hit = find.open && !!find.text && norm(val(row, col)).includes(norm(find.text));
                                            return (
                                                <td key={col.key} id={`pc-${r}-${c}`}
                                                    onMouseDown={(e) => {
                                                        if (isEditing) return;
                                                        if (e.button === 2 && inRng(r, c)) return;
                                                        if (editing) commit(draft, null);
                                                        if (e.shiftKey && active) setExt({ r, c }); else { setActive({ r, c }); setExt(null); }
                                                        drag.current = true; gridRef.current?.focus({ preventScroll: true });
                                                    }}
                                                    onMouseEnter={() => { if (drag.current && !editing) setExt({ r, c }); }}
                                                    onDoubleClick={() => { setActive({ r, c }); startEdit(undefined, { r, c }); }}
                                                    onContextMenu={(e) => { e.preventDefault(); if (!inRng(r, c)) { setActive({ r, c }); setExt(null); } setCtx({ x: e.clientX, y: e.clientY }); }}
                                                    className={`border-b border-r border-gray-200 px-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-800 ${isActive ? 'outline outline-2 -outline-offset-2' : ''}`}
                                                    style={{
                                                        height: ROWH, outlineColor: ACC, fontWeight: f?.b ? 700 : undefined, fontStyle: f?.i ? 'italic' : undefined, color: f?.c || undefined, textAlign: f?.al,
                                                        background: hit ? '#FFF59D' : inRng(r, c) && !isActive ? 'rgba(232,155,90,.16)' : f?.bg || (col.type === 'readonly' ? '#FAFAFA' : undefined),
                                                    }}>
                                                    {isEditing ? (
                                                        col.type === 'select' ? (
                                                            <select autoFocus value={draft}
                                                                ref={(el) => { if (el && !el.dataset.o) { el.dataset.o = '1'; try { (el as any).showPicker?.(); } catch { /* bỏ qua */ } } }}
                                                                onChange={(e) => commit(e.target.value, null, true)} onBlur={() => commit(draft, null)}
                                                                onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                                                                className="w-full h-6 bg-white border rounded px-1 text-sm focus:outline-none" style={{ borderColor: ACC }}>
                                                                <option value="">—</option>
                                                                {[...(col.options ?? []), ...(draft && !col.options?.includes(draft) ? [draft] : [])].map((o) => <option key={o} value={o}>{o}</option>)}
                                                            </select>
                                                        ) : (
                                                            <input autoFocus value={draft} list={col.type === 'suggest' ? `dl-${col.key}` : undefined}
                                                                onChange={(e) => setDraft(e.target.value)}
                                                                onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                                                                onBlur={() => commit(draft, null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') { e.preventDefault(); commit(draft, 'down', true); }
                                                                    else if (e.key === 'Tab') { e.preventDefault(); commit(draft, e.shiftKey ? 'left' : 'right', true); }
                                                                    else if (e.key === 'Escape') cancelEdit();
                                                                }}
                                                                className="w-full h-6 bg-white border rounded px-1.5 text-sm focus:outline-none select-text" style={{ borderColor: ACC }} />
                                                        )
                                                    ) : display(col, row)}
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-gray-200 px-2" style={{ height: ROWH }}>
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/shelter/pets/${row.id}`} title="Xem chi tiết" className="p-1 text-gray-400 hover:text-[#E89B5A]"><FiExternalLink size={13} /></Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!view.length && (
                                <tr><td colSpan={cols.length + 3} className="h-32 text-center text-gray-400">
                                    {hasFilter ? 'Không có dòng nào khớp bộ lọc.' : 'Chưa có pet nào. Bấm "+" hoặc menu Chèn để thêm dòng, hoặc nhập từ Excel.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {cols.filter((c) => c.type === 'suggest').map((c) => (
                <datalist key={c.key} id={`dl-${c.key}`}>{c.options?.map((o) => <option key={o} value={o} />)}</datalist>
            ))}

            {/* Tab sheet + thanh trạng thái */}
            <div className="flex items-center bg-[#F8F9FA] border-t border-gray-200 text-sm">
                <button type="button" onClick={addRow} title="Thêm dòng" className="p-2 text-gray-500 hover:bg-gray-200"><FiPlus size={16} /></button>
                {(['DOG', 'CAT'] as Species[]).map((sp) => (
                    <button key={sp} type="button" onClick={() => switchSpecies(sp)}
                        className={`px-5 py-2 font-medium border-b-[3px] ${species === sp ? 'bg-white text-[#B45F1A]' : 'text-gray-500 hover:bg-gray-100 border-transparent'}`}
                        style={species === sp ? { borderColor: ACC } : undefined}>
                        {sp === 'DOG' ? 'TT chó lụm' : 'TT mèo'} ({counts[sp]})
                    </button>
                ))}
                <div className="flex-1" />
                {selInfo && selInfo.n > 1 && (
                    <span className="px-3 text-xs text-gray-600">Đã chọn {selInfo.n} ô • Có dữ liệu: {selInfo.filled}{selInfo.nums > 0 ? ` • Tổng: ${selInfo.sum.toLocaleString('vi-VN')}` : ''}</span>
                )}
                <span className="px-3 text-xs text-gray-400 hidden md:block">Enter/F2 sửa • Shift+mũi tên chọn vùng • Ctrl+D điền xuống • Chuột phải để mở menu</span>
            </div>

            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />

            {ctx && (
                <div className="fixed z-50 min-w-[210px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm" style={{ left: ctx.x, top: ctx.y }}>
                    {ctxItems.map(([l, fn]) => (
                        <button key={l} type="button" onClick={() => { setCtx(null); fn(); }} className="w-full text-left px-4 py-1.5 hover:bg-[#FFF4EA]">{l}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PetSheetEditor;
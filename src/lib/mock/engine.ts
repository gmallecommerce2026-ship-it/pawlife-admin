// Engine mô phỏng Prisma client trong bộ nhớ (chỉ dùng cho FE mock).
// Hỗ trợ: where (equals, in, not, gte/lte/gt/lt, contains, AND/OR/NOT, some/none/every),
// orderBy, skip/take, select, include (kể cả _count), create/update/upsert/delete,
// count, aggregate (_avg, _count), groupBy (by, _count), $transaction.
import { REL, DEFAULTS, type Rel } from "./schema";
import { seedStore } from "./seed";

type Row = Record<string, any>;

function getStore(): Record<string, Row[]> {
  const g = globalThis as any;
  if (!g.__mockStore) g.__mockStore = seedStore();
  return g.__mockStore;
}

let idCounter = 0;
const newId = (model: string) => `${model.slice(0, 2).toLowerCase()}_${Date.now().toString(36)}${(idCounter++).toString(36)}`;

const isDate = (v: any) => v instanceof Date;
const norm = (v: any) => (isDate(v) ? v.getTime() : v);
const isNullish = (v: any) => v === null || v === undefined;
const eq = (a: any, b: any) => (isNullish(a) && isNullish(b)) || norm(a) === norm(b);

function matchValue(actual: any, cond: any): boolean {
  if (cond === null) return isNullish(actual);
  if (isDate(cond) || typeof cond !== "object") return eq(actual, cond);
  for (const [op, x] of Object.entries(cond)) {
    if (x === undefined) continue;
    switch (op) {
      case "in":
        if (!(x as any[]).some((y) => eq(actual, y))) return false;
        break;
      case "not":
        if (x === null) {
          if (isNullish(actual)) return false;
        } else if (typeof x === "object" && !isDate(x)) {
          if (matchValue(actual, x)) return false;
        } else if (eq(actual, x)) return false;
        break;
      case "gte":
        if (isNullish(actual) || !(norm(actual) >= norm(x))) return false;
        break;
      case "lte":
        if (isNullish(actual) || !(norm(actual) <= norm(x))) return false;
        break;
      case "gt":
        if (isNullish(actual) || !(norm(actual) > norm(x))) return false;
        break;
      case "lt":
        if (isNullish(actual) || !(norm(actual) < norm(x))) return false;
        break;
      case "contains":
        if (!String(actual ?? "").toLowerCase().includes(String(x).toLowerCase())) return false;
        break;
      case "equals":
        if (!eq(actual, x)) return false;
        break;
      default:
        throw new Error(`mock: toán tử chưa hỗ trợ: ${op}`);
    }
  }
  return true;
}

// userId_role: { userId, role } → phẳng ra userId, role (giống where khóa tổng hợp của Prisma)
function flatten(where: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(where ?? {})) {
    if (k.includes("_") && v && typeof v === "object" && !isDate(v) && !Array.isArray(v)) Object.assign(out, v);
    else out[k] = v;
  }
  return out;
}

function relatedRows(row: Row, model: string, relName: string): Row[] {
  const rel = REL[model][relName] as Rel;
  const target = getStore()[rel.model] ?? [];
  if (rel.kind === "one") {
    const id = row[rel.local];
    return id == null ? [] : target.filter((t) => t.id === id);
  }
  return target.filter((t) => t[rel.foreign] === row.id);
}

function matchWhere(row: Row, where: any, model: string): boolean {
  if (!where) return true;
  for (const [k, v] of Object.entries(flatten(where))) {
    if (v === undefined) continue;
    if (k === "AND") {
      if (!(Array.isArray(v) ? v : [v]).every((x) => matchWhere(row, x, model))) return false;
      continue;
    }
    if (k === "OR") {
      if (!v.some((x: any) => matchWhere(row, x, model))) return false;
      continue;
    }
    if (k === "NOT") {
      if ((Array.isArray(v) ? v : [v]).some((x: any) => matchWhere(row, x, model))) return false;
      continue;
    }
    const rel = REL[model]?.[k] as Rel | undefined;
    if (rel) {
      const related = relatedRows(row, model, k);
      if (v && typeof v === "object") {
        if (v.some !== undefined && !related.some((r) => matchWhere(r, v.some, rel.model))) return false;
        if (v.none !== undefined && related.some((r) => matchWhere(r, v.none, rel.model))) return false;
        if (v.every !== undefined && !related.every((r) => matchWhere(r, v.every, rel.model))) return false;
      }
      continue;
    }
    if (!matchValue(row[k], v)) return false;
  }
  return true;
}

function sortRows(list: Row[], orderBy: any): Row[] {
  if (!orderBy) return list;
  const specs: [string, string][] = (Array.isArray(orderBy) ? orderBy : [orderBy]).flatMap((o: any) =>
    Object.entries(o) as [string, string][]
  );
  return [...list].sort((a, b) => {
    for (const [f, dir] of specs) {
      const av = norm(a[f]);
      const bv = norm(b[f]);
      if (av === bv) continue;
      const c = isNullish(av) ? -1 : isNullish(bv) ? 1 : av < bv ? -1 : 1;
      return dir === "desc" ? -c : c;
    }
    return 0;
  });
}

function countOf(model: string, row: Row, sel: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(sel ?? {})) if (v) out[k] = relatedRows(row, model, k).length;
  return out;
}

function resolveRel(model: string, row: Row, k: string, v: any): any {
  const rel = REL[model][k] as Rel;
  const list = relatedRows(row, model, k).map((r) => (v === true ? { ...r } : project(rel.model, r, v.select, v.include)));
  return rel.kind === "one" ? list[0] ?? null : list;
}

function project(model: string, row: Row, select?: any, include?: any): Row {
  if (!select && !include) return { ...row };
  if (select) {
    const out: Row = {};
    for (const [k, v] of Object.entries(select)) {
      if (!v) continue;
      if (k === "_count") out._count = countOf(model, row, (v as any).select);
      else if (REL[model]?.[k]) out[k] = resolveRel(model, row, k, v);
      else out[k] = row[k];
    }
    return out;
  }
  const out: Row = { ...row };
  for (const [k, v] of Object.entries(include)) {
    if (!v) continue;
    if (k === "_count") out._count = countOf(model, row, (v as any).select);
    else out[k] = resolveRel(model, row, k, v);
  }
  return out;
}

const clean = (data: any) => Object.fromEntries(Object.entries(data ?? {}).filter(([, v]) => v !== undefined));

function delegate(model: string) {
  const list = () => (getStore()[model] ??= []);
  const filter = (where: any) => list().filter((r) => matchWhere(r, where, model));
  const find = (where: any) => list().find((r) => matchWhere(r, where, model));

  const d: any = {
    findMany: async (args: any = {}) => {
      let rows = sortRows(filter(args.where), args.orderBy);
      if (args.skip) rows = rows.slice(args.skip);
      if (args.take !== undefined) rows = rows.slice(0, args.take);
      return rows.map((r) => project(model, r, args.select, args.include));
    },
    findFirst: async (args: any = {}) => (await d.findMany({ ...args, take: 1 }))[0] ?? null,
    findUnique: async (args: any) => {
      const r = find(args.where);
      return r ? project(model, r, args.select, args.include) : null;
    },
    count: async (args: any = {}) => filter(args.where).length,
    create: async (args: any) => {
      const now = new Date();
      const row = { ...(DEFAULTS[model]?.() ?? {}), id: newId(model), createdAt: now, updatedAt: now, ...clean(args.data) };
      list().push(row);
      return project(model, row, args.select, args.include);
    },
    createMany: async (args: any) => {
      const now = new Date();
      for (const data of args.data) {
        list().push({ ...(DEFAULTS[model]?.() ?? {}), id: newId(model), createdAt: now, updatedAt: now, ...clean(data) });
      }
      return { count: args.data.length };
    },
    update: async (args: any) => {
      const r = find(args.where);
      if (!r) throw new Error(`${model} không tồn tại`);
      Object.assign(r, clean(args.data), { updatedAt: new Date() });
      return project(model, r, args.select, args.include);
    },
    updateMany: async (args: any) => {
      const rows = filter(args.where);
      rows.forEach((r) => Object.assign(r, clean(args.data), { updatedAt: new Date() }));
      return { count: rows.length };
    },
    upsert: async (args: any) => {
      const r = find(args.where);
      if (r) {
        Object.assign(r, clean(args.update), { updatedAt: new Date() });
        return project(model, r, args.select, args.include);
      }
      return d.create({ data: args.create, select: args.select, include: args.include });
    },
    delete: async (args: any) => {
      const r = find(args.where);
      if (!r) throw new Error(`${model} không tồn tại`);
      list().splice(list().indexOf(r), 1);
      return { ...r };
    },
    deleteMany: async (args: any) => {
      const rows = new Set(filter(args.where));
      getStore()[model] = list().filter((r) => !rows.has(r));
      return { count: rows.size };
    },
    aggregate: async (args: any) => {
      const rows = filter(args.where);
      const out: Row = {};
      if (args._avg) {
        out._avg = {};
        for (const f of Object.keys(args._avg)) {
          const vals = rows.map((r) => r[f]).filter((v) => typeof v === "number");
          out._avg[f] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        }
      }
      if (args._count) out._count = { _all: rows.length };
      return out;
    },
    groupBy: async (args: any) => {
      const rows = filter(args.where);
      const groups = new Map<string, Row>();
      for (const r of rows) {
        const key = JSON.stringify(args.by.map((f: string) => r[f]));
        if (!groups.has(key)) {
          const g: Row = {};
          args.by.forEach((f: string) => (g[f] = r[f]));
          g._count = { _all: 0 };
          groups.set(key, g);
        }
        groups.get(key)!._count._all++;
      }
      return [...groups.values()];
    },
  };
  return d;
}

/** Trả về object có cùng dạng với PrismaClient: db.shelter.findMany(...), db.$transaction(...) */
export function createMockDb() {
  const delegates = new Map<string, any>();
  const tx = async (arg: any) => (typeof arg === "function" ? arg(db) : Promise.all(arg));
  const db: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "$transaction") return tx;
        if (prop === "$disconnect") return async () => {};
        if (typeof prop !== "string") return undefined;
        const model = prop[0].toUpperCase() + prop.slice(1);
        if (!delegates.has(model)) delegates.set(model, delegate(model));
        return delegates.get(model);
      },
    }
  );
  return db;
}

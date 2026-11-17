/**
 * In-memory Firestore for local development and tests ONLY (FIRESTORE_MODE=memory).
 *
 * Implements the subset of the Admin SDK API this codebase uses: documents, sub-collections,
 * where/orderBy/limit, count(), findNearest(), batches, getAll and FieldValue transforms.
 * Production always uses real Cloud Firestore — see docs/DECISIONS.md (D-012).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type Data = Record<string, any>;

const isTransform = (v: any, name: string) => v && typeof v === 'object' && v.methodName === name;
const isVector = (v: any) => v && typeof v === 'object' && v.constructor?.name === 'VectorValue';

function clone(v: any): any {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Timestamp) return v;
  if (isVector(v)) return FieldValue.vector(v.toArray());
  if (Array.isArray(v)) return v.map(clone);
  const out: Data = {};
  for (const [k, x] of Object.entries(v)) out[k] = clone(x);
  return out;
}

function getPath(obj: Data | undefined, path: string) {
  return path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
}

function applyValue(existing: any, value: any): any {
  if (value === undefined) return undefined;
  if (isTransform(value, 'FieldValue.serverTimestamp')) return Timestamp.now();
  if (isTransform(value, 'FieldValue.increment')) return (typeof existing === 'number' ? existing : 0) + value.operand;
  if (isTransform(value, 'FieldValue.arrayUnion')) return [...new Set([...(Array.isArray(existing) ? existing : []), ...value.elements])];
  if (isTransform(value, 'FieldValue.arrayRemove')) return (Array.isArray(existing) ? existing : []).filter((x: any) => !value.elements.includes(x));
  if (value instanceof Timestamp || isVector(value) || value === null || typeof value !== 'object' || Array.isArray(value)) return clone(value);
  const out: Data = {};
  for (const [k, x] of Object.entries(value)) {
    if (isTransform(x, 'FieldValue.delete')) continue;
    const v = applyValue(undefined, x);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function mergeDeep(target: Data, src: Data): Data {
  const out = { ...target };
  for (const [k, v] of Object.entries(src)) {
    if (v === undefined) continue;
    if (isTransform(v, 'FieldValue.delete')) {
      delete out[k];
    } else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Timestamp) && !isVector(v) && !v.methodName && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = mergeDeep(out[k], v);
    } else {
      out[k] = applyValue(out[k], v);
    }
  }
  return out;
}

function setPath(obj: Data, path: string, value: any) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (!o[k] || typeof o[k] !== 'object') o[k] = {};
    o = o[k];
  }
  const last = keys[keys.length - 1];
  if (isTransform(value, 'FieldValue.delete')) delete o[last];
  else o[last] = applyValue(o[last], value);
}

function cmp(a: any, b: any): number {
  const norm = (v: any) => (v instanceof Timestamp ? v.toMillis() : v);
  const x = norm(a);
  const y = norm(b);
  if (x === y) return 0;
  if (x === undefined || x === null) return -1;
  if (y === undefined || y === null) return 1;
  return x < y ? -1 : 1;
}

class Snapshot {
  constructor(public ref: DocRef, private _data: Data | undefined) {}
  get id() {
    return this.ref.id;
  }
  get exists() {
    return this._data !== undefined;
  }
  data() {
    return this._data === undefined ? undefined : clone(this._data);
  }
  get(field: string) {
    return clone(getPath(this._data, field));
  }
}

class Store {
  docs = new Map<string, Data>();
  private timer: NodeJS.Timeout | null = null;
  constructor(private file?: string) {
    if (file && existsSync(file)) {
      const raw = JSON.parse(readFileSync(file, 'utf8'), (_k, v) => {
        if (v && typeof v === 'object' && '__ts' in v) return Timestamp.fromMillis(v.__ts);
        if (v && typeof v === 'object' && '__vec' in v) return FieldValue.vector(v.__vec);
        return v;
      });
      for (const [k, v] of Object.entries(raw)) this.docs.set(k, v as Data);
    }
  }
  changed() {
    if (!this.file || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      mkdirSync(dirname(this.file!), { recursive: true });
      const obj = Object.fromEntries(this.docs);
      writeFileSync(
        this.file!,
        JSON.stringify(obj, function (k, v) {
          const raw = (this as any)[k];
          if (raw instanceof Timestamp) return { __ts: raw.toMillis() };
          if (isVector(raw)) return { __vec: raw.toArray() };
          return v;
        })
      );
    }, 300);
  }
}

class DocRef {
  constructor(private store: Store, public path: string) {}
  get id() {
    return this.path.split('/').pop()!;
  }
  collection(name: string) {
    return new CollRef(this.store, `${this.path}/${name}`);
  }
  async get() {
    return new Snapshot(this, this.store.docs.get(this.path));
  }
  async set(data: Data, opts?: { merge?: boolean }) {
    const prev = this.store.docs.get(this.path);
    this.store.docs.set(this.path, opts?.merge && prev ? mergeDeep(prev, data) : applyValue(undefined, data));
    this.store.changed();
  }
  async update(data: Data) {
    const prev = this.store.docs.get(this.path);
    if (!prev) throw Object.assign(new Error(`5 NOT_FOUND: No document to update: ${this.path}`), { code: 5 });
    const next = clone(prev);
    for (const [k, v] of Object.entries(data)) if (v !== undefined) setPath(next, k, v);
    this.store.docs.set(this.path, next);
    this.store.changed();
  }
  async delete() {
    this.store.docs.delete(this.path);
    this.store.changed();
  }
}

type Filter = { field: string; op: string; value: any };

class Query {
  constructor(
    protected store: Store,
    public path: string,
    protected filters: Filter[] = [],
    protected orders: { field: string; dir: 'asc' | 'desc' }[] = [],
    protected max?: number
  ) {}
  where(field: string, op: string, value: any) {
    return new Query(this.store, this.path, [...this.filters, { field, op, value }], this.orders, this.max);
  }
  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return new Query(this.store, this.path, this.filters, [...this.orders, { field, dir }], this.max);
  }
  limit(n: number) {
    return new Query(this.store, this.path, this.filters, this.orders, n);
  }
  protected matches(): Snapshot[] {
    const depth = this.path.split('/').length + 1;
    let rows: Snapshot[] = [];
    for (const [p, data] of this.store.docs) {
      if (!p.startsWith(this.path + '/') || p.split('/').length !== depth) continue;
      const ok = this.filters.every(({ field, op, value }) => {
        const v = getPath(data, field);
        switch (op) {
          case '==': return cmp(v, value) === 0;
          case '!=': return cmp(v, value) !== 0;
          case '<': return v != null && cmp(v, value) < 0;
          case '<=': return v != null && cmp(v, value) <= 0;
          case '>': return v != null && cmp(v, value) > 0;
          case '>=': return v != null && cmp(v, value) >= 0;
          case 'in': return (value as any[]).some((x) => cmp(v, x) === 0);
          case 'array-contains': return Array.isArray(v) && v.includes(value);
          default: throw new Error(`memory-firestore: unsupported operator ${op}`);
        }
      });
      if (ok) rows.push(new Snapshot(new DocRef(this.store, p), data));
    }
    for (const o of this.orders) rows = rows.filter((r) => getPath(r.data(), o.field) !== undefined);
    rows.sort((a, b) => {
      for (const o of this.orders) {
        const c = cmp(getPath(a.data(), o.field), getPath(b.data(), o.field));
        if (c) return o.dir === 'desc' ? -c : c;
      }
      return a.id < b.id ? -1 : 1;
    });
    return this.max !== undefined ? rows.slice(0, this.max) : rows;
  }
  async get() {
    const docs = this.matches();
    return { docs, empty: docs.length === 0, size: docs.length, forEach: (fn: (d: Snapshot) => void) => docs.forEach(fn) };
  }
  count() {
    return { get: async () => ({ data: () => ({ count: this.matches().length }) }) };
  }
  findNearest(opts: { vectorField: string; queryVector: any; limit: number; distanceMeasure: string; distanceResultField?: string }) {
    const q = opts.queryVector?.toArray ? opts.queryVector.toArray() : opts.queryVector;
    return {
      get: async () => {
        const docs = this.matches()
          .map((s) => {
            const v = getPath(s.data(), opts.vectorField);
            const arr: number[] = v?.toArray ? v.toArray() : [];
            let dot = 0, na = 0, nb = 0;
            for (let i = 0; i < arr.length; i++) (dot += arr[i] * q[i]), (na += arr[i] ** 2), (nb += q[i] ** 2);
            const distance = arr.length ? 1 - dot / (Math.sqrt(na * nb) || 1) : 2;
            const data = { ...s.data(), ...(opts.distanceResultField ? { [opts.distanceResultField]: distance } : {}) };
            return { distance, snap: new Snapshot(s.ref, data) };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, opts.limit)
          .map((x) => x.snap);
        return { docs, empty: !docs.length, size: docs.length };
      },
    };
  }
}

class CollRef extends Query {
  constructor(store: Store, path: string) {
    super(store, path);
  }
  get id() {
    return this.path.split('/').pop()!;
  }
  doc(id?: string) {
    return new DocRef(this.store, `${this.path}/${id || randomBytes(10).toString('base64url')}`);
  }
  async add(data: Data) {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

export class MemoryFirestore {
  private store: Store;
  constructor(file?: string) {
    this.store = new Store(file);
  }
  settings() {}
  collection(path: string) {
    return new CollRef(this.store, path);
  }
  doc(path: string) {
    return new DocRef(this.store, path);
  }
  async getAll(...refs: DocRef[]) {
    return Promise.all(refs.map((r) => r.get()));
  }
  batch() {
    const ops: (() => Promise<void>)[] = [];
    const b = {
      set: (ref: DocRef, data: Data, opts?: { merge?: boolean }) => (ops.push(() => ref.set(data, opts)), b),
      update: (ref: DocRef, data: Data) => (ops.push(() => ref.update(data)), b),
      delete: (ref: DocRef) => (ops.push(() => ref.delete()), b),
      commit: async () => {
        for (const op of ops) await op();
      },
    };
    return b;
  }
  /** Test helper */
  reset() {
    this.store.docs.clear();
  }
}

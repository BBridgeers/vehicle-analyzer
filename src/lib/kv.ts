/**
 * Local SQLite-backed key/value store — replacement for the retired Upstash Redis.
 * Single file, zero daemons, zero cloud (node:sqlite, built into Node >= 22.5).
 * Implements the subset of the Upstash/Redis API this app uses.
 */
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Redis } from '@upstash/redis';

const NOW = () => Date.now();

function resolveDbPath(): string {
  const candidates = [
    process.env.VERACAR_KV_DB,
    process.env.VERACAR_DB_DIR ? path.join(process.env.VERACAR_DB_DIR, 'veracar.db') : null,
    '/var/lib/veracar/veracar.db',
    path.join(process.cwd(), '.veracar-data', 'veracar.db'),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.accessSync(path.dirname(p), fs.constants.W_OK);
      return p;
    } catch { /* next candidate */ }
  }
  throw new Error('No writable path available for the local KV database');
}

type Row = { t: string; v: string; exp: number | null };

class SqliteKV {
  private db: DatabaseSync;
  private ops = 0;
  private filePath: string;
  constructor(p: string) {
    this.filePath = p;
    this.db = new DatabaseSync(p);
    this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec('PRAGMA synchronous=NORMAL;');
    this.db.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, t TEXT NOT NULL, v TEXT NOT NULL, exp INTEGER);');
  }
  private live(k: string): Row | null {
    const row = this.db.prepare('SELECT t, v, exp FROM kv WHERE k = ?').get(k) as Row | undefined;
    if (!row) return null;
    if (row.exp && row.exp <= NOW()) { this.db.prepare('DELETE FROM kv WHERE k = ?').run(k); return null; }
    return row;
  }
  private put(k: string, t: string, v: string, exp: number | null) {
    this.db.prepare('INSERT INTO kv (k, t, v, exp) VALUES (?, ?, ?, ?) ON CONFLICT(k) DO UPDATE SET t=excluded.t, v=excluded.v, exp=excluded.exp').run(k, t, v, exp);
    if (++this.ops % 200 === 0) this.db.prepare('DELETE FROM kv WHERE exp IS NOT NULL AND exp <= ?').run(NOW());
  }
  async get(key: string): Promise<any> {
    const r = this.live(key);
    if (!r || r.t !== 'str') return null;
    try { return JSON.parse(r.v); } catch { return r.v; }
  }
  async set(key: string, value: any, opts?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }): Promise<'OK'> {
    const cur = this.live(key);
    if (opts?.nx && cur) return 'OK';
    if (opts?.xx && !cur) return 'OK';
    const exp = opts?.ex ? NOW() + opts.ex * 1000 : opts?.px ? NOW() + opts.px : null;
    this.put(key, 'str', JSON.stringify(value === undefined ? null : value), exp);
    return 'OK';
  }
  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys.flat()) n += Number(((this.db.prepare('DELETE FROM kv WHERE k = ?').run(k) as any).changes) || 0);
    return n;
  }
  async incr(key: string): Promise<number> { return this.incrby(key, 1); }
  async incrby(key: string, by: number): Promise<number> {
    const r = this.live(key);
    const cur = r && r.t === 'str' ? (Number(JSON.parse(r.v)) || 0) : 0;
    const next = cur + by;
    this.put(key, 'str', JSON.stringify(next), r ? r.exp : null);
    return next;
  }
  async expire(key: string, seconds: number): Promise<number> {
    const r = this.live(key); if (!r) return 0;
    this.db.prepare('UPDATE kv SET exp = ? WHERE k = ?').run(NOW() + seconds * 1000, key);
    return 1;
  }
  async ttl(key: string): Promise<number> {
    const row = this.db.prepare('SELECT exp FROM kv WHERE k = ?').get(key) as { exp: number | null } | undefined;
    if (!row) return -2;
    if (!row.exp) return -1;
    const s = Math.ceil((row.exp - NOW()) / 1000);
    return s > 0 ? s : -2;
  }
  async hset(key: string, data: Record<string, any>): Promise<number> {
    const r = this.live(key);
    const h: Record<string, any> = r && r.t === 'hash' ? JSON.parse(r.v) : {};
    let added = 0;
    for (const [f, v] of Object.entries(data || {})) { if (!(f in h)) added++; h[f] = v; }
    this.put(key, 'hash', JSON.stringify(h), r ? r.exp : null);
    return added;
  }
  async hget(key: string, field: string): Promise<any> {
    const r = this.live(key); if (!r || r.t !== 'hash') return null;
    const h = JSON.parse(r.v);
    return field in h ? h[field] : null;
  }
  async hgetall(key: string): Promise<Record<string, any> | null> {
    const r = this.live(key); if (!r || r.t !== 'hash') return null;
    return JSON.parse(r.v);
  }
  async zadd(key: string, data: Record<string, number>): Promise<number> {
    const r = this.live(key);
    const z: Record<string, number> = r && r.t === 'zset' ? JSON.parse(r.v) : {};
    let added = 0;
    for (const [m, s] of Object.entries(data || {})) { if (!(m in z)) added++; z[m] = Number(s); }
    this.put(key, 'zset', JSON.stringify(z), r ? r.exp : null);
    return added;
  }
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const r = this.live(key); if (!r || r.t !== 'zset') return [];
    const ents = Object.entries(JSON.parse(r.v) as Record<string, number>).sort((a, b) => a[1] - b[1]);
    const members = ents.map((e) => e[0]);
    const n = members.length;
    const s = start < 0 ? Math.max(n + start, 0) : Math.min(start, n);
    const e = stop < 0 ? n + stop + 1 : Math.min(stop + 1, n);
    return members.slice(s, e);
  }
  async exists(key: string): Promise<number> { return this.live(key) ? 1 : 0; }
  dbPath(): string { return this.filePath; }
}

const g = globalThis as any;
function inst(): SqliteKV {
  if (!g.__veracarKv) g.__veracarKv = new SqliteKV(resolveDbPath());
  return g.__veracarKv;
}

export const kv = new Proxy({} as Redis, {
  get(_t, prop) {
    const target: any = inst();
    const v = target[prop];
    return typeof v === 'function' ? v.bind(target) : v;
  },
}) as Redis;

export const kvDbPath = () => inst().dbPath();
export default kv;

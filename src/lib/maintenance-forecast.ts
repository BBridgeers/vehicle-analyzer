/**
 * Inferred maintenance forecast.
 * Deterministic — no LLM. Derives "what needs attention first" from age, mileage,
 * powertrain, model-specific known-issue patterns, and any available history
 * (CARFAX service records / gaps) or NHTSA enrichment.
 */
import type { Vehicle } from './types';

export interface MaintenanceItem {
  urgency: 'now' | 'soon' | 'watch';
  item: string;
  why: string;
  estCost: [number, number];
  source: 'age' | 'mileage' | 'history' | 'powertrain' | 'model-pattern';
}

export interface MaintenanceForecast {
  items: MaintenanceItem[];
  nearTermCost: { low: number; high: number };
  nextServiceDue: string;
  dataQuality: 'history-backed' | 'partial' | 'assumption-based';
  notes: string[];
}

type HistoryCtx = {
  serviceRecordCount?: number;
  lastServiceDate?: string | null;
  lastServiceMileage?: number | null;
  serviceGaps?: string[];
  odometerRollback?: boolean;
  openRecalls?: number;
  complaintCount?: number;
} | null | undefined;

const monthsSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(String(iso).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
};

const isElectric = (v: Vehicle) => /electric|bev|ev\b/i.test(`${v.fuelType || ''}`) && !/hybrid/i.test(`${v.fuelType || ''}`);
const isHybrid = (v: Vehicle) => /hybrid|phev|plug/i.test(`${v.fuelType || ''}`);

/** Model-specific patterns worth flagging before a purchase. Short, honest, extensible. */
function modelPatterns(v: Vehicle): MaintenanceItem[] {
  const key = `${v.make} ${v.model}`.toLowerCase();
  const out: MaintenanceItem[] = [];
  const add = (item: string, why: string, estCost: [number, number]) =>
    out.push({ urgency: 'soon', item, why, estCost, source: 'model-pattern' });

  if (/volt/.test(key)) {
    add('High-voltage battery cell balance check',
      '1st-gen Volt packs drift over time; dealer can read cell deltas — cheap now, expensive if a module fails.',
      [150, 400]);
    add('BECM / shift-to-park module history check',
      'Known Volt failure that leaves the car unable to start; confirm any warranty repair history.',
      [0, 1200]);
    add('12V battery load test',
      'The Volt is unusually sensitive to a weak 12V battery (fails to start / spurious codes).',
      [150, 300]);
  }
  if (/prius/.test(key)) add('Hybrid battery health scan', 'Age-related capacity loss is measurable before it strands you.', [100, 6000]);
  if (/cvt/i.test(`${v.transmission || ''}`)) add('CVT fluid service', 'CVTs that skip fluid changes are the single biggest failure risk on these cars.', [200, 400]);
  if (/turbo/i.test(`${v.engine || ''}`)) add('Carbon build-up inspection', 'Direct-injection turbo engines coke the intake valves.', [200, 900]);
  return out;
}

export function forecastMaintenance(v: Vehicle, history?: HistoryCtx): MaintenanceForecast {
  const year = Number(v.year) || new Date().getFullYear();
  const age = Math.max(0, new Date().getFullYear() - year);
  const miles = Number(v.mileage) || 0;
  const items: MaintenanceItem[] = [];
  const notes: string[] = [];
  const push = (i: MaintenanceItem) => items.push(i);

  // ── History-driven (highest confidence) ────────────────────────────────────
  const months = monthsSince(history?.lastServiceDate);
  if (history?.serviceGaps?.length) {
    push({
      urgency: 'now',
      item: 'Baseline service after documented gap(s)',
      why: `History shows ${history.serviceGaps.length} service gap(s): ${history.serviceGaps.slice(0, 2).join('; ')}`,
      estCost: [250, 800], source: 'history',
    });
  }
  if (months !== null && months >= 12) {
    push({
      urgency: months >= 18 ? 'now' : 'soon',
      item: 'Oil / fluids service',
      why: `Last recorded service was ~${months} months ago.`,
      estCost: [80, 250], source: 'history',
    });
  }
  if (history?.odometerRollback) {
    push({ urgency: 'now', item: 'Odometer verification', why: 'Rollback flag in the history report — verify true mileage before any money moves.', estCost: [0, 150], source: 'history' });
  }
  if (history?.openRecalls && history.openRecalls > 0) {
    push({ urgency: 'now', item: `Clear ${history.openRecalls} open recall(s)`, why: 'Manufacturer remedies are usually free at a franchised dealer — do this first.', estCost: [0, 0], source: 'history' });
  }

  // ── Age-based ─────────────────────────────────────────────────────────────
  if (age >= 4) push({ urgency: age >= 7 ? 'soon' : 'watch', item: '12V battery', why: `${age}-year-old battery is near end of life.`, estCost: [150, 320], source: 'age' });
  if (age >= 5) push({ urgency: 'watch', item: 'Coolant flush', why: 'Coolant degrades with age regardless of mileage.', estCost: [120, 300], source: 'age' });
  if (age >= 3 && miles > 30000) push({ urgency: 'soon', item: 'Brake fluid flush', why: 'Every ~3 years / 30k miles.', estCost: [100, 220], source: 'age' });

  // ── Mileage-based ─────────────────────────────────────────────────────────
  if (!isElectric(v)) {
    if (miles >= 60000) push({ urgency: miles >= 100000 ? 'soon' : 'watch', item: 'Spark plugs', why: `${miles.toLocaleString()} mi — typical 60–100k interval.`, estCost: [120, 450], source: 'mileage' });
    if (miles >= 60000 && v.transmission) push({ urgency: miles >= 90000 ? 'soon' : 'watch', item: 'Transmission fluid service', why: 'Most automatics benefit at 60–100k; ignoring it is the expensive path.', estCost: [180, 450], source: 'mileage' });
  }
  if (miles >= 75000) push({ urgency: 'soon', item: 'Timing belt/chain inspection', why: 'Belt engines: overdue risk; chain engines: check for stretch/rattle.', estCost: [0, 1300], source: 'mileage' });
  if (miles >= 50000) push({ urgency: 'watch', item: 'Suspension & bushings inspection', why: 'Struts, control-arm bushings and end links at this mileage on most platforms.', estCost: [0, 1500], source: 'mileage' });
  if (miles > 0 && miles % 50000 < 15000) push({ urgency: 'soon', item: 'Tires (set)', why: `Odometer near a typical tire replacement cycle (~${Math.round(miles / 50000) * 50000} mi).`, estCost: [500, 1200], source: 'mileage' });

  // ── Powertrain-specific ───────────────────────────────────────────────────
  if (isHybrid(v) && miles >= 80000) push({ urgency: 'soon', item: 'Hybrid/EV battery capacity test', why: 'Capacity loss is measurable and negotiable before purchase.', estCost: [120, 500], source: 'powertrain' });
  if (isElectric(v) && miles >= 100000) push({ urgency: 'soon', item: 'HV battery state-of-health + cooling service', why: 'High-mileage EV pack health is the whole car.', estCost: [0, 900], source: 'powertrain' });

  // ── Model patterns ────────────────────────────────────────────────────────
  items.push(...modelPatterns(v));

  if (history?.complaintCount && history.complaintCount >= 100) {
    notes.push(`NHTSA shows ${history.complaintCount} owner complaints for this year/make/model — read the top components before buying.`);
  }
  if (!history?.serviceRecordCount) notes.push('No service history available — this forecast assumes deferred maintenance.');

  const rank = { now: 0, soon: 1, watch: 2 } as const;
  items.sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.estCost[0] - b.estCost[0]);

  const nearTerm = items.filter(i => i.urgency !== 'watch');
  const nearTermCost = {
    low: nearTerm.reduce((s, i) => s + i.estCost[0], 0),
    high: nearTerm.reduce((s, i) => s + i.estCost[1], 0),
  };

  const dataQuality: MaintenanceForecast['dataQuality'] =
    history?.serviceRecordCount ? 'history-backed' : (history ? 'partial' : 'assumption-based');

  return {
    items,
    nearTermCost,
    nextServiceDue: miles > 0 ? `${Math.ceil((miles + 5000) / 5000) * 5000} mi (or ${months !== null && months >= 6 ? 'now' : 'within 6 months'})` : 'unknown mileage',
    dataQuality,
    notes,
  };
}

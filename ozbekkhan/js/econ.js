// Iqtisod: Buyuk Ipak yo'li savdosi. Har viloyat o'z mahsulotini arzon sotadi, boshqalarnikini qimmat oladi.
import { REGIONS, regionById } from './regions.js';

export const GOODS = {
  atlas: { n: 'Marg\'ilon atlasi', base: 22, from: ['fargona'] },
  lagan: { n: 'Rishton lagani', base: 14, from: ['fargona'] },
  gilam: { n: 'Qashqadaryo gilami', base: 32, from: ['qashqadaryo'] },
  pichoq: { n: 'Chust pichog\'i', base: 16, from: ['namangan'] },
  zardozi: { n: 'Zardo\'zi do\'ppi', base: 38, from: ['buxoro'] },
  mis: { n: 'Mis lagan', base: 18, from: ['buxoro'] },
  qogoz: { n: 'Samarqand qog\'ozi', base: 11, from: ['samarqand'] },
  mayiz: { n: 'Mayiz', base: 6, from: ['samarqand', 'surxondaryo'] },
  anor: { n: 'Anor', base: 4, from: ['surxondaryo'] },
  tuz: { n: 'Tuz', base: 3, from: ['navoiy'] },
  jun: { n: 'Tuya juni', base: 12, from: ['navoiy'] },
  qovun: { n: 'Xorazm qovuni', base: 4, from: ['xorazm'] },
  paxta: { n: 'Paxta', base: 5, from: ['sirdaryo'] },
  baliq: { n: 'Quritilgan baliq', base: 6, from: ['sirdaryo', 'xorazm'] },
  egar: { n: 'Jizzax egari', base: 26, from: ['jizzax'] },
  doppi: { n: 'Andijon do\'ppisi', base: 10, from: ['andijon'] },
  guruch: { n: 'Guruch', base: 5, from: ['toshkent'] },
  qand: { n: 'Qand-novvot', base: 7, from: ['toshkent'] },
};
// kunlik tebranish (bir xil kun — bir xil narx)
const wob = (k, day) => { const h = Math.sin(k.length * 12.9898 + day * 78.233 + k.charCodeAt(0)) * 43758.5453; return (h - Math.floor(h)) * 0.3 - 0.15; };
const dist = (a, b) => Math.hypot((a.lon - b.lon) * 85, (a.lat - b.lat) * 111); // km
export function priceAt(good, regionId, day = 0) {
  const G = GOODS[good], R = regionById(regionId); if (!G) return 0;
  if (G.from.includes(regionId)) return Math.max(1, Math.round(G.base * (0.55 + wob(good, day) * 0.5)));
  const near = Math.min(...G.from.map((f) => dist(regionById(f), R)));
  return Math.max(2, Math.round(G.base * (1.05 + near / 900 + wob(good, day))));
}
export const localGoods = (regionId) => Object.keys(GOODS).filter((k) => GOODS[k].from.includes(regionId));
export const capacity = (mount) => (mount ? (mount.kind === 'tuya' ? 30 : mount.kind === 'arava' ? 26 : mount.pack ? 22 : 14) : 6);
export const invCount = (inv) => Object.values(inv || {}).reduce((a, b) => a + b, 0);
// viloyat hunari: qaysi ish qaysi mahsulot beradi
export const CRAFT = {
  fargona: { job: 'Rishtonda lagan yasash', good: 'lagan' }, namangan: { job: 'Chustda pichoq charxlash', good: 'pichoq' }, andijon: { job: 'Do\'ppi tikish', good: 'doppi' },
  buxoro: { job: 'Zardo\'zi kashta tikish', good: 'zardozi' }, samarqand: { job: 'Qog\'oz quyish', good: 'qogoz' }, qashqadaryo: { job: 'Gilam to\'qish', good: 'gilam' },
  surxondaryo: { job: 'Anor terish', good: 'anor' }, navoiy: { job: 'Tuya junini titish', good: 'jun' }, xorazm: { job: 'Qovun terish', good: 'qovun' },
  sirdaryo: { job: 'Paxta terish', good: 'paxta' }, jizzax: { job: 'Egar yasash', good: 'egar' }, toshkent: { job: 'Qand quyish', good: 'qand' },
};

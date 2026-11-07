/* ============================================================
   DEREFSHIELD — modèle de données & artefacts
   Console de protection active : déréférencement direct chez
   l'hébergeur, sans dépendre des API des moteurs de recherche.
   ============================================================ */

export type ViewState =
  | 'overview'
  | 'cognitif'
  | 'depot'
  | 'maillage'
  | 'backlinks'
  | 'deref'
  | 'stopnet'
  | 'hebergeur'
  | 'forensics'
  | 'audit';

export type PageStatus = 'indexee' | 'candidate' | 'deref';
export type Decision = 'noindex' | 'http-410' | 'canonical' | 'purge-cache' | 'conserver';
export type ToastKind = 'ok' | 'warn' | 'crit' | 'info';
export type Tone = 'mint' | 'amber' | 'coral' | 'sky' | 'mute';
export type Level = 'L1' | 'L2' | 'L3';
export type TokenStatus = 'genere' | 'pousse' | 'applique' | 'ignore' | 'confirme';
export type RiskKind = 'phishing' | 'spam' | 'page-hackee' | 'faux-profil' | 'obsolescence' | 'duplicata';
export type CompRole = 'superviseur' | 'llm' | 'memoire' | 'mem0';
export type CompProvider = 'hf' | 'nvidia';

/* ---------------- entités ---------------- */

export interface PageNode {
  id: string;
  slug: string;
  title: string;
  depth: number;
  status: PageStatus;
  score: number;
  trafic: number;
  duplicate: number;
  obsolete: number;
  decision: Decision;
  confidence: number;
  applied: boolean;
  canonicalTarget?: string;
  level: Level;
  risk: RiskKind;
  toxic?: boolean;
}

export interface Suggestion {
  id: string;
  from: string;
  to: string;
  anchor: string;
  gain: number;
  reason: string;
  applied: boolean;
}

export interface Backlink {
  id: string;
  domain: string;
  target: string;
  follow: boolean;
  trust: number;
  toxic: boolean;
  disavowed: boolean;
}

export interface AuditEvent {
  id: number;
  time: string;
  actor: 'IA-COG' | 'OPS' | 'CANAL' | 'SEC';
  level: 'ok' | 'info' | 'warn' | 'crit';
  message: string;
  hash: string;
}

export interface FeedEvent {
  id: number;
  time: string;
  kind: 'scan' | 'ia' | 'sec' | 'canal';
  text: string;
}

export interface HostPush {
  id: string;
  file: string;
  time: string;
  status: 'ok' | 'pending' | 'echec';
  checksum: string;
  latency: number;
}

export interface Directive {
  id: string;
  page: string;
  type: string;
  value: string;
  origin: string;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export interface ContractCheck {
  id: string;
  rule: string;
  detail: string;
  ok: boolean | null;
}

export interface StopToken {
  id: string;
  targetSlug: string;
  hostId: string;
  level: Level;
  risk: RiskKind;
  status: TokenStatus;
  progress: number;
  ttl: number;
  createdAt: string;
  signature: string;
  evidenceHash: string;
  override: { dns: boolean; cdn: boolean; shield: boolean };
  contract: ContractCheck[];
  signalsSent: number;
}

export interface HostConn {
  id: string;
  panel: string;
  name: string;
  domain: string;
  protocol: string;
  docRoot: string;
  status: 'en-ligne' | 'degrade' | 'hors-ligne';
  latency: number;
  mtls: boolean;
  pushes: number;
  lastPush: string;
}

export interface Evidence {
  id: string;
  target: string;
  tokenId?: string;
  at: string;
  htmlHash: string;
  tlsFp: string;
  size: string;
  headers: string[];
  shot: boolean;
}

export interface VictimAlert {
  id: string;
  time: string;
  kind: 'redirect' | 'blocage' | 'bookmark';
  who: string;
  target: string;
  action: string;
  resolved: boolean;
}

export interface RegistryEntry {
  id: string;
  domain: string;
  txt: string;
  level: Level;
  since: string;
  checks: number;
}

export interface CogComponent {
  id: string;
  name: string;
  model: string;
  role: CompRole;
  provider: CompProvider;
  endpoint: string;
  desc: string;
  load: number;
  tokens: number;
  latency: number;
  status: 'actif' | 'repos';
}

export interface RouteEntry {
  id: number;
  time: string;
  task: string;
  to: string;
  reason: string;
}

export interface MemOp {
  id: number;
  time: string;
  mem: string;
  op: 'lecture' | 'écriture' | 'consolidation';
  key: string;
  size: string;
}

export type IntakeType = 'url' | 'site' | 'motcle';
export type IntakeStatus = 'attente' | 'ingeree' | 'analysee' | 'signalee' | 'neutralisee' | 'bloquee';
export type IntakeMode = 'analyser' | 'bloquer' | 'deref';

export interface IntakeTarget {
  id: string;
  type: IntakeType;
  value: string;
  priority: 'auto' | 'haute';
  mode: IntakeMode;
  at: string;
  status: IntakeStatus;
  score: number | null;
  pageId?: string;
}

export interface BlockEntry {
  id: string;
  url: string;
  scope: 'WAF' | 'edge CDN' | 'DNS';
  at: string;
  source: string;
}

/* ---------------- libellés & tonalités ---------------- */

export const SITE = 'https://cortex-lab.fr';
export const SHIELD_HOST = 'shield.derefshield.net';

export const decisionLabel: Record<Decision, string> = {
  noindex: 'noindex + nofollow',
  'http-410': 'HTTP 410 Gone',
  canonical: 'canonicalisation',
  'purge-cache': 'purge cache + headers',
  conserver: 'conservée',
};

export const decisionTone: Record<Decision, Tone> = {
  noindex: 'amber',
  'http-410': 'coral',
  canonical: 'sky',
  'purge-cache': 'amber',
  conserver: 'mint',
};

export const statusMeta: Record<PageStatus, { label: string; tone: Tone }> = {
  indexee: { label: 'indexée', tone: 'mint' },
  candidate: { label: 'candidate', tone: 'amber' },
  deref: { label: 'déréférencée', tone: 'coral' },
};

export const levelTone: Record<AuditEvent['level'], Tone> = {
  ok: 'mint',
  info: 'sky',
  warn: 'amber',
  crit: 'coral',
};

export const riskLabel: Record<RiskKind, string> = {
  phishing: 'hameçonnage',
  spam: 'réseau de spam',
  'page-hackee': 'page compromise',
  'faux-profil': 'faux profil',
  obsolescence: 'contenu obsolète',
  duplicata: 'duplicata massif',
};

export const riskTone: Record<RiskKind, Tone> = {
  phishing: 'coral',
  spam: 'coral',
  'page-hackee': 'coral',
  'faux-profil': 'amber',
  obsolescence: 'amber',
  duplicata: 'sky',
};

export const LEVEL_META: Record<Level, { label: string; tone: Tone; action: string; status: number; desc: string }> = {
  L1: { label: 'L1 · NOINDEX', tone: 'amber', action: 'noindex, nofollow', status: 200, desc: 'signal robots + headers, page conservée' },
  L2: { label: 'L2 · GONE', tone: 'coral', action: 'noindex, noarchive', status: 410, desc: '410 Gone définitif + retrait sitemap' },
  L3: { label: 'L3 · STOP NET', tone: 'coral', action: 'noindex, nofollow, noarchive', status: 410, desc: 'arrêt réseau complet : override DNS/CDN + bouclier' },
};

export const TOKEN_STATUS: Record<TokenStatus, { label: string; tone: Tone }> = {
  genere: { label: 'signé', tone: 'mute' },
  pousse: { label: 'poussé', tone: 'sky' },
  applique: { label: 'appliqué', tone: 'amber' },
  ignore: { label: 'ignoré', tone: 'coral' },
  confirme: { label: 'confirmé', tone: 'mint' },
};

export const ROLE_META: Record<CompRole, { label: string; tone: Tone }> = {
  superviseur: { label: 'superviseur', tone: 'coral' },
  llm: { label: 'LLM', tone: 'sky' },
  memoire: { label: 'mémoire', tone: 'amber' },
  mem0: { label: 'mem0', tone: 'mint' },
};

export const PROVIDER_META: Record<CompProvider, { label: string; tone: Tone }> = {
  hf: { label: 'Hugging Face', tone: 'amber' },
  nvidia: { label: 'NVIDIA NIM', tone: 'mint' },
};

export const INTAKE_TYPE: Record<IntakeType, { label: string; tone: Tone }> = {
  url: { label: 'URL', tone: 'sky' },
  site: { label: 'site', tone: 'mint' },
  motcle: { label: 'mot-clé', tone: 'amber' },
};

export const INTAKE_STATUS: Record<IntakeStatus, { label: string; tone: Tone }> = {
  attente: { label: 'en attente', tone: 'mute' },
  ingeree: { label: 'ingérée', tone: 'sky' },
  analysee: { label: 'analysée', tone: 'amber' },
  signalee: { label: 'signalée → file', tone: 'coral' },
  neutralisee: { label: 'neutralisée', tone: 'mint' },
  bloquee: { label: 'bloquée WAF', tone: 'coral' },
};

export const INTAKE_MODE: Record<IntakeMode, { label: string; tone: Tone }> = {
  analyser: { label: 'analyser', tone: 'sky' },
  bloquer: { label: 'bloquer', tone: 'coral' },
  deref: { label: 'déréférencer', tone: 'amber' },
};

export const SHORT_COMP: Record<string, string> = {
  qwen: 'QWEN',
  llama: 'LLM-1',
  deepseek: 'LLM-2',
  gemma: 'MEM-1',
  oxalpha: 'MEM-2',
  mem0nv1: 'NV-1',
  mem0nv2: 'NV-2',
};

/* ---------------- utilitaires ---------------- */

export function hash8(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return ('00000000' + h.toString(16)).slice(-8);
}

export function nowTime(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour12: false });
}

export function wave(tick: number, seed: number, len = 14): number[] {
  return Array.from({ length: len }, (_, i) => {
    const v =
      52 +
      30 * Math.sin((tick + i * 3) / 4 + seed) +
      12 * Math.sin((tick + i) / 2.3 + seed * 2);
    return Math.min(98, Math.max(6, v));
  });
}

function contractFor(level: Level): ContractCheck[] {
  const c = (id: string, rule: string, detail: string): ContractCheck => ({ id, rule, detail, ok: null });
  if (level === 'L1') {
    return [
      c('c1', 'Headers X-Robots-Tag injectés', 'noindex, nofollow servis sur la cible'),
      c('c2', 'Maillage interne neutralisé', 'liens entrants passés en rel="nofollow"'),
      c('c3', 'Preuve d\u2019exécution SHA-256', 'hash renvoyé par l\u2019hébergeur'),
    ];
  }
  const base = [
    c('c1', 'Statut HTTP 410 Gone', 'réponse forcée côté serveur'),
    c('c2', 'Purge cache < 60 s', 'invalidation edge + origine'),
    c('c3', 'Retrait maillage + sitemap.xml', 'liens internes supprimés, entrée ôtée'),
  ];
  if (level === 'L2') return base;
  return [...base, c('c4', 'Signal nofollow externe (webhook)', 'réseau notifié pour les liens sortants')];
}

/* ---------------- graphe interne ---------------- */

export const INTERNAL_LINKS: { from: string; to: string }[] = [
  { from: 'p1', to: 'p2' }, { from: 'p1', to: 'p3' }, { from: 'p1', to: 'p6' },
  { from: 'p1', to: 'p7' }, { from: 'p1', to: 'c6' },
  { from: 'p2', to: 'p4' }, { from: 'p2', to: 'p6' }, { from: 'p2', to: 'c5' },
  { from: 'p2', to: 'c2' }, { from: 'p2', to: 'd1' },
  { from: 'p3', to: 'c1' }, { from: 'p3', to: 'c3' }, { from: 'p3', to: 'c7' },
  { from: 'p3', to: 'd2' },
  { from: 'p4', to: 'p5' }, { from: 'p4', to: 'c4' }, { from: 'p4', to: 'p3' },
  { from: 'p5', to: 'p4' }, { from: 'p5', to: 'p3' },
  { from: 'p6', to: 'p7' },
  { from: 'p7', to: 'p3' },
  { from: 'p8', to: 'p3' }, { from: 'p8', to: 'p4' },
  { from: 'c3', to: 'p3' },
  { from: 'c7', to: 'p6' },
  { from: 'p6', to: 'x1' }, { from: 'p2', to: 'x1' },
  { from: 'p4', to: 'x2' }, { from: 'p3', to: 'x2' }, { from: 'p7', to: 'x2' },
  { from: 'p3', to: 'x3' },
  { from: 'p5', to: 'x4' },
];

export function effectiveInlinks(pages: PageNode[], sugs: Suggestion[]): Map<string, number> {
  const ids = new Set(pages.map((p) => p.id));
  const m = new Map<string, number>();
  INTERNAL_LINKS.forEach((l) => {
    if (ids.has(l.from) && ids.has(l.to)) m.set(l.to, (m.get(l.to) ?? 0) + 1);
  });
  sugs.filter((s) => s.applied).forEach((s) => {
    if (ids.has(s.from) && ids.has(s.to)) m.set(s.to, (m.get(s.to) ?? 0) + 1);
  });
  return m;
}

export function orphelines(pages: PageNode[], sugs: Suggestion[]): PageNode[] {
  const inl = effectiveInlinks(pages, sugs);
  return pages.filter((p) => p.status !== 'deref' && (inl.get(p.id) ?? 0) === 0);
}

/* ---------------- seeds : pages ---------------- */

export const SEED_PAGES: PageNode[] = [
  { id: 'p1', slug: '/', title: 'Accueil — Cortex Lab', depth: 0, status: 'indexee', score: 92, trafic: 8210, duplicate: 2, obsolete: 4, decision: 'conserver', confidence: 99, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p2', slug: '/services', title: 'Services & expertise', depth: 1, status: 'indexee', score: 88, trafic: 3120, duplicate: 4, obsolete: 8, decision: 'conserver', confidence: 97, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p3', slug: '/blog', title: 'Blog — analyses IA & sécurité', depth: 1, status: 'indexee', score: 85, trafic: 2870, duplicate: 6, obsolete: 5, decision: 'conserver', confidence: 96, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p6', slug: '/contact', title: 'Contact', depth: 1, status: 'indexee', score: 77, trafic: 610, duplicate: 3, obsolete: 6, decision: 'conserver', confidence: 94, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p7', slug: '/a-propos', title: 'À propos du labo', depth: 1, status: 'indexee', score: 74, trafic: 450, duplicate: 9, obsolete: 18, decision: 'conserver', confidence: 91, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p4', slug: '/blog/ia-cognitive', title: 'IA cognitive : architectures 2026', depth: 2, status: 'indexee', score: 81, trafic: 1240, duplicate: 7, obsolete: 3, decision: 'conserver', confidence: 95, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p5', slug: '/blog/zero-trust', title: 'Sécurité zero-trust en pratique', depth: 2, status: 'indexee', score: 79, trafic: 980, duplicate: 5, obsolete: 6, decision: 'conserver', confidence: 93, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p8', slug: '/blog/maillage-semantique', title: 'Maillage sémantique avancé', depth: 2, status: 'indexee', score: 76, trafic: 720, duplicate: 4, obsolete: 9, decision: 'conserver', confidence: 92, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'p9', slug: '/mentions-legales', title: 'Mentions légales', depth: 2, status: 'indexee', score: 70, trafic: 180, duplicate: 12, obsolete: 10, decision: 'conserver', confidence: 90, applied: false, level: 'L1', risk: 'obsolescence' },

  { id: 'c1', slug: '/blog/seo-2019', title: 'Tendances SEO 2019', depth: 2, status: 'candidate', score: 22, trafic: 45, duplicate: 12, obsolete: 88, decision: 'http-410', confidence: 96, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'c2', slug: '/promos/noel-2021', title: 'Promotions Noël 2021', depth: 3, status: 'candidate', score: 18, trafic: 12, duplicate: 8, obsolete: 95, decision: 'http-410', confidence: 98, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'c3', slug: '/tag/actualites', title: 'Tag actualités (pages minces)', depth: 2, status: 'candidate', score: 31, trafic: 90, duplicate: 84, obsolete: 41, decision: 'noindex', confidence: 91, applied: false, level: 'L1', risk: 'duplicata' },
  { id: 'c4', slug: '/blog/copie-whitepaper', title: 'Whitepaper IA (duplicata)', depth: 3, status: 'candidate', score: 27, trafic: 65, duplicate: 93, obsolete: 12, decision: 'canonical', confidence: 94, applied: false, canonicalTarget: '/ressources/whitepaper-ia', level: 'L1', risk: 'duplicata' },
  { id: 'c5', slug: '/ancien/checkout-v1', title: 'Ancien tunnel de commande', depth: 3, status: 'candidate', score: 15, trafic: 8, duplicate: 6, obsolete: 92, decision: 'http-410', confidence: 97, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'c6', slug: '/lp/webinar-expired', title: 'Landing webinar 2022', depth: 2, status: 'candidate', score: 25, trafic: 30, duplicate: 15, obsolete: 90, decision: 'purge-cache', confidence: 89, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'c7', slug: '/parametres', title: 'Paramètres utilisateur', depth: 2, status: 'candidate', score: 38, trafic: 210, duplicate: 45, obsolete: 8, decision: 'noindex', confidence: 87, applied: false, level: 'L1', risk: 'duplicata' },

  { id: 'x1', slug: '/compte/verification-gain', title: 'Page d\u2019hameçonnage détectée', depth: 2, status: 'candidate', score: 4, trafic: 1490, duplicate: 61, obsolete: 2, decision: 'http-410', confidence: 99, applied: false, level: 'L3', risk: 'phishing', toxic: true },
  { id: 'x2', slug: '/user/k3vin-trading', title: 'Faux profil influenceur', depth: 2, status: 'candidate', score: 6, trafic: 830, duplicate: 37, obsolete: 1, decision: 'http-410', confidence: 97, applied: false, level: 'L2', risk: 'faux-profil', toxic: true },
  { id: 'x3', slug: '/promo/casino-vip', title: 'Réseau de liens injectés', depth: 3, status: 'candidate', score: 3, trafic: 420, duplicate: 88, obsolete: 5, decision: 'purge-cache', confidence: 98, applied: false, level: 'L2', risk: 'spam', toxic: true },
  { id: 'x4', slug: '/assets/js/widget-tag.js', title: 'Script tiers compromis', depth: 3, status: 'candidate', score: 2, trafic: 5010, duplicate: 12, obsolete: 0, decision: 'purge-cache', confidence: 99, applied: false, level: 'L2', risk: 'page-hackee', toxic: true },

  { id: 'd1', slug: '/tmp/export-debug', title: 'Export de debug temporaire', depth: 3, status: 'deref', score: 9, trafic: 2, duplicate: 40, obsolete: 99, decision: 'purge-cache', confidence: 99, applied: true, level: 'L1', risk: 'obsolescence' },
  { id: 'd2', slug: '/presse/communique-2018', title: 'Communiqué de presse 2018', depth: 3, status: 'deref', score: 12, trafic: 5, duplicate: 22, obsolete: 96, decision: 'http-410', confidence: 97, applied: true, level: 'L1', risk: 'obsolescence' },
];

export const RESERVE_CANDIDATES: PageNode[] = [
  { id: 'r1', slug: '/blog/concours-2020', title: 'Concours 2020 (clos)', depth: 2, status: 'candidate', score: 24, trafic: 18, duplicate: 10, obsolete: 91, decision: 'http-410', confidence: 95, applied: false, level: 'L1', risk: 'obsolescence' },
  { id: 'r2', slug: '/double/faq-legacy', title: 'FAQ legacy dupliquée', depth: 3, status: 'candidate', score: 29, trafic: 40, duplicate: 90, obsolete: 33, decision: 'canonical', confidence: 92, applied: false, canonicalTarget: '/faq', level: 'L1', risk: 'duplicata' },
  { id: 'r3', slug: '/session/panier-orphelin', title: 'Panier de session orphelin', depth: 3, status: 'candidate', score: 33, trafic: 26, duplicate: 18, obsolete: 22, decision: 'noindex', confidence: 88, applied: false, level: 'L1', risk: 'duplicata' },
  { id: 'r4', slug: '/user/support-fr-officiel', title: 'Faux support « officiel »', depth: 2, status: 'candidate', score: 5, trafic: 260, duplicate: 44, obsolete: 0, decision: 'http-410', confidence: 96, applied: false, level: 'L2', risk: 'faux-profil', toxic: true },
  { id: 'r5', slug: '/promo/richesse-rapide', title: 'Réseau de pages indésirables', depth: 3, status: 'candidate', score: 2, trafic: 310, duplicate: 96, obsolete: 3, decision: 'http-410', confidence: 99, applied: false, level: 'L2', risk: 'spam', toxic: true },
];

export const SEED_SUGGESTIONS: Suggestion[] = [
  { id: 's1', from: 'p3', to: 'p8', anchor: 'maillage sémantique', gain: 14, reason: 'co-occurrence lexicale 0.82 — même champ sémantique', applied: false },
  { id: 's2', from: 'p4', to: 'p8', anchor: 'graphes de liens internes', gain: 11, reason: 'similarité cosinus 0.79 avec le corpus IA cognitive', applied: false },
  { id: 's3', from: 'p2', to: 'p8', anchor: 'stratégie de maillage', gain: 8, reason: 'intention informationnelle détectée côté services', applied: false },
  { id: 's4', from: 'p5', to: 'p4', anchor: 'architectures cognitives', gain: 9, reason: 'pont sémantique sécurité ↔ modèles décisionnels', applied: false },
  { id: 's5', from: 'p7', to: 'p3', anchor: 'dernières analyses du labo', gain: 6, reason: 'renforcement du cocon éditorial depuis la page corporate', applied: false },
];

export const SEED_BACKLINKS: Backlink[] = [
  { id: 'b1', domain: 'wikipedia.org', target: '/a-propos', follow: false, trust: 97, toxic: false, disavowed: false },
  { id: 'b2', domain: 'arxiv.org', target: '/blog/ia-cognitive', follow: true, trust: 95, toxic: false, disavowed: false },
  { id: 'b3', domain: 'lemonde.fr', target: '/blog/ia-cognitive', follow: true, trust: 92, toxic: false, disavowed: false },
  { id: 'b4', domain: 'github.com', target: '/ressources', follow: true, trust: 90, toxic: false, disavowed: false },
  { id: 'b5', domain: 'stackoverflow.com', target: '/blog/zero-trust', follow: true, trust: 88, toxic: false, disavowed: false },
  { id: 'b6', domain: 'nextinpact.com', target: '/blog/maillage-semantique', follow: true, trust: 78, toxic: false, disavowed: false },
  { id: 'b7', domain: 'korben.info', target: '/blog/seo-2019', follow: true, trust: 76, toxic: false, disavowed: false },
  { id: 'b8', domain: 'reddit.com', target: '/blog/zero-trust', follow: false, trust: 74, toxic: false, disavowed: false },
  { id: 'b9', domain: 'medium.com', target: '/blog/ia-cognitive', follow: false, trust: 70, toxic: false, disavowed: false },
  { id: 'b10', domain: 'annuaire-express.net', target: '/promos/noel-2021', follow: true, trust: 8, toxic: true, disavowed: false },
  { id: 'b11', domain: 'casino-deals.io', target: '/', follow: true, trust: 4, toxic: true, disavowed: false },
  { id: 'b12', domain: 'spam-directory.top', target: '/ancien/checkout-v1', follow: true, trust: 6, toxic: true, disavowed: false },
];

export const SEED_AUDIT: AuditEvent[] = [
  { id: 32, time: '10:24:31', actor: 'SEC', level: 'ok', message: 'Intégrité de la chaîne d\u2019audit vérifiée — 12/12 maillons', hash: hash8('12|SEC|chain') },
  { id: 31, time: '10:22:47', actor: 'IA-COG', level: 'crit', message: 'Menace détectée sur /compte/verification-gain — niveau L3 recommandé (99 %)', hash: hash8('31|IA-COG|x1') },
  { id: 30, time: '10:21:02', actor: 'CANAL', level: 'ok', message: 'Ordre ST-a8f91234 confirmé par h-ovh — preuve sha256:45cd21aa reçue', hash: hash8('30|CANAL|tok1') },
  { id: 29, time: '10:19:36', actor: 'SEC', level: 'crit', message: 'Script compromis détecté sur /assets/js/widget-tag.js — forensics capturée', hash: hash8('29|SEC|x4') },
  { id: 28, time: '10:17:58', actor: 'CANAL', level: 'ok', message: 'Bouclier actif : CNAME redirigé vers shield.derefshield.net', hash: hash8('28|CANAL|shield') },
  { id: 27, time: '10:16:12', actor: 'SEC', level: 'warn', message: 'Redirection sûre 302 servie à 12 visiteurs (page de sécurité)', hash: hash8('27|SEC|302') },
  { id: 22, time: '09:42:10', actor: 'OPS', level: 'info', message: 'Analyse hebdomadaire planifiée — fenêtre 02:00-04:00 UTC', hash: hash8('22|OPS|plan') },
  { id: 21, time: '09:42:11', actor: 'IA-COG', level: 'ok', message: 'Décision « HTTP 410 Gone » appliquée à /presse/communique-2018', hash: hash8('21|IA-COG|d2') },
  { id: 20, time: '09:42:13', actor: 'CANAL', level: 'ok', message: 'robots.txt synchronisé via API REST hébergeur · 38 ms', hash: hash8('20|CANAL|robots') },
  { id: 19, time: '09:42:14', actor: 'CANAL', level: 'ok', message: 'sitemap.xml synchronisé via API REST hébergeur · 41 ms', hash: hash8('19|CANAL|sitemap') },
  { id: 18, time: '09:47:02', actor: 'SEC', level: 'crit', message: 'Requête malveillante bloquée (WAF) — 185.220.101.34', hash: hash8('18|SEC|waf') },
  { id: 17, time: '09:51:40', actor: 'IA-COG', level: 'warn', message: '7 candidates en file d\u2019attente — confiance moyenne 93 %', hash: hash8('17|IA-COG|file') },
  { id: 16, time: '10:03:27', actor: 'SEC', level: 'warn', message: 'Certificat mTLS hébergeur expire dans 21 jours — rotation planifiée', hash: hash8('16|SEC|mtls') },
];

export const SEED_FEED: FeedEvent[] = [
  { id: 8, time: '10:31:02', kind: 'scan', text: 'sonde TCP cortex-lab.fr — 200 OK · 41 ms' },
  { id: 7, time: '10:31:06', kind: 'ia', text: 'analyse sémantique /blog/ia-cognitive — vecteur 768d · score 81' },
  { id: 6, time: '10:31:11', kind: 'sec', text: 'vérification X-Robots-Tag /tag/actualites — signal conforme' },
  { id: 5, time: '10:31:15', kind: 'scan', text: 'crawl depth-2 : 5 ressources extraites, 0 lien mort' },
  { id: 4, time: '10:31:19', kind: 'canal', text: 'heartbeat mTLS hébergeur — certificat valide 21 j' },
  { id: 3, time: '10:31:24', kind: 'ia', text: 'scrutin backlinks : 12 domaines sondés en direct' },
  { id: 2, time: '10:31:28', kind: 'scan', text: 'empreinte SHA-256 /services recalculée — ' + hash8('svc') },
  { id: 1, time: '10:31:33', kind: 'canal', text: 'index local mis à jour — 542 URLs · Δ +3' },
];

export const SEED_PUSHES: HostPush[] = [
  { id: 'push-seed-7', file: 'stopnet/a8f91234.json', time: '10:20:41', status: 'ok', checksum: hash8('tok1-json'), latency: 31 },
  { id: 'push-seed-6', file: 'robots.txt', time: '10:20:09', status: 'ok', checksum: hash8('robots-seed6'), latency: 35 },
  { id: 'push-seed-5', file: 'headers-bulk.json', time: '10:14:52', status: 'echec', checksum: hash8('headers-seed5'), latency: 0 },
  { id: 'push-seed-4', file: 'sitemap.xml', time: '09:58:17', status: 'ok', checksum: hash8('sitemap-seed4'), latency: 41 },
  { id: 'push-seed-3', file: '.htaccess', time: '09:52:44', status: 'ok', checksum: hash8('htaccess-seed3'), latency: 52 },
  { id: 'push-seed-2', file: 'disavow.txt', time: '09:31:05', status: 'ok', checksum: hash8('disavow-seed2'), latency: 47 },
];

const mkTok = (
  id: string,
  targetSlug: string,
  hostId: string,
  level: Level,
  risk: RiskKind,
  status: TokenStatus,
  progress: number,
  createdAt: string,
  checksDone: number,
  override: StopToken['override'],
  signalsSent: number
): StopToken => ({
  id,
  targetSlug,
  hostId,
  level,
  risk,
  status,
  progress,
  ttl: 86400,
  createdAt,
  signature: hash8(id + '|ed25519|sig') + hash8(id + '|ed25519|sig2'),
  evidenceHash: 'sha256:' + hash8(id + '|ev1') + hash8(id + '|ev2') + hash8(id + '|ev3') + hash8(id + '|ev4'),
  override,
  contract: contractFor(level).map((c, i) => ({ ...c, ok: i < checksDone })),
  signalsSent,
});

export const SEED_TOKENS: StopToken[] = [
  mkTok('ST-a8f91234', '/promo/casino-vip', 'h-ovh', 'L2', 'spam', 'confirme', 100, '09:58:12', 3, { dns: false, cdn: true, shield: false }, 9),
  mkTok('ST-77be09cd', '/compte/verification-gain', 'h-cpanel', 'L3', 'phishing', 'ignore', 72, '10:02:47', 1, { dns: false, cdn: false, shield: false }, 0),
  mkTok('ST-c3d14f02', '/user/k3vin-trading', 'h-plesk', 'L2', 'faux-profil', 'pousse', 34, '10:21:05', 0, { dns: false, cdn: false, shield: false }, 0),
];

export const SEED_HOSTS: HostConn[] = [
  { id: 'h-cpanel', panel: 'cPanel', name: 'client-alpha', domain: 'cortex-lab.fr', protocol: 'REST UAPI', docRoot: '/home/alpha/public_html', status: 'degrade', latency: 41, mtls: true, pushes: 38, lastPush: '10:20:41' },
  { id: 'h-plesk', panel: 'Plesk', name: 'client-beta', domain: 'labo-beta.io', protocol: 'REST Obsidian', docRoot: '/var/www/vhosts/beta', status: 'en-ligne', latency: 37, mtls: true, pushes: 21, lastPush: '10:14:02' },
  { id: 'h-da', panel: 'DirectAdmin', name: 'client-gamma', domain: 'gamma-shop.fr', protocol: 'REST v2', docRoot: '/home/gamma/domains/public', status: 'en-ligne', latency: 44, mtls: true, pushes: 12, lastPush: '09:47:55' },
  { id: 'h-sftp', panel: 'SFTP/SSH', name: 'client-delta', domain: 'delta-corp.net', protocol: 'SFTP chroot', docRoot: '/srv/www/delta', status: 'en-ligne', latency: 52, mtls: false, pushes: 9, lastPush: '09:31:18' },
  { id: 'h-cf', panel: 'Cloudflare', name: 'edge-réseau', domain: '14 zones', protocol: 'Workers API', docRoot: '— (edge)', status: 'en-ligne', latency: 23, mtls: true, pushes: 64, lastPush: '10:24:03' },
  { id: 'h-ovh', panel: 'OVHcloud', name: 'DNS + SSL', domain: '6 domaines', protocol: 'REST v6', docRoot: '— (DNS)', status: 'en-ligne', latency: 33, mtls: true, pushes: 27, lastPush: '10:18:40' },
];

export const SEED_EVIDENCES: Evidence[] = [
  {
    id: 'ev-3', target: '/compte/verification-gain', tokenId: 'ST-77be09cd', at: '10:01:33',
    htmlHash: hash8('x1-html') + hash8('x1-html2') + hash8('x1-html3') + hash8('x1-html4'),
    tlsFp: hash8('x1-tls') + hash8('x1-tls2'),
    size: '1,4 Mo', shot: true,
    headers: ['HTTP/2 200', 'server: nginx/1.24.0', 'x-powered-by: PHP/7.2.34', 'set-cookie: sess=…; Secure'],
  },
  {
    id: 'ev-4', target: '/assets/js/widget-tag.js', tokenId: 'ST-90aa51be', at: '10:19:28',
    htmlHash: hash8('x4-html') + hash8('x4-html2') + hash8('x4-html3') + hash8('x4-html4'),
    tlsFp: hash8('x4-tls') + hash8('x4-tls2'),
    size: '96 Ko', shot: false,
    headers: ['HTTP/2 200', 'content-type: application/javascript', 'last-modified: il y a 2 h (anormal)'],
  },
];

export const SEED_ALERTS: VictimAlert[] = [
  { id: 'al-1', time: '10:26:14', kind: 'redirect', who: '185.24.••.17', target: '/compte/verification-gain', action: '302 → page de sécurité DerefShield', resolved: false },
  { id: 'al-2', time: '10:24:51', kind: 'blocage', who: '91.108.••.4', target: '/promo/casino-vip', action: 'WAF — requête bloquée au edge', resolved: false },
  { id: 'al-3', time: '10:19:07', kind: 'bookmark', who: 'utilisateur #4821', target: '/user/k3vin-trading', action: 'notification push envoyée au navigateur', resolved: false },
  { id: 'al-4', time: '10:05:33', kind: 'redirect', who: '77.154.••.92', target: '/promo/casino-vip', action: '302 → page de sécurité DerefShield', resolved: true },
];

export const SEED_REGISTRY: RegistryEntry[] = [
  { id: 'rg-1', domain: 'site-fictif-toxique.example', txt: 'v=ds1; a=stop; l=3; t=a8f91234', level: 'L3', since: '10:17:58', checks: 148 },
];

/* ---------------- OS cognitif ---------------- */

export const SEED_COMPONENTS: CogComponent[] = [
  { id: 'qwen', name: 'SUPERVISEUR', model: 'qwen2.5-72b-instruct', role: 'superviseur', provider: 'nvidia', endpoint: 'nvidia/qwen2.5-72b', desc: 'Orchestre le noyau : route chaque tâche vers le bon organe, arbitre le niveau StopNet final et valide les ordres avant signature.', load: 42, tokens: 128400, latency: 61, status: 'actif' },
  { id: 'llama', name: 'LLM-1 · RAPIDE', model: 'meta-llama/Llama-3.3-70B', role: 'llm', provider: 'hf', endpoint: 'hf/meta-llama-3.3-70b', desc: 'Voie rapide du noyau : tri du dépôt, scoring de risque et génération d\u2019ancres de maillage à basse latence.', load: 66, tokens: 402100, latency: 34, status: 'actif' },
  { id: 'deepseek', name: 'LLM-2 · PROFOND', model: 'deepseek-ai/DeepSeek-R1', role: 'llm', provider: 'nvidia', endpoint: 'nvidia/deepseek-r1', desc: 'Raisonnement profond : cas ambigus, chaînes de décision L1→L3 et vérification sémantique avant neutralisation.', load: 28, tokens: 96400, latency: 142, status: 'repos' },
  { id: 'gemma', name: 'MÉMOIRE-1', model: 'google/gemma-embed-2b', role: 'memoire', provider: 'hf', endpoint: 'hf/gemma-embed-2b', desc: 'Mémoire court terme : embeddings 768d des cibles déposées, similarité cosinus pour le maillage contextuel.', load: 51, tokens: 218700, latency: 22, status: 'actif' },
  { id: 'oxalpha', name: 'MÉMOIRE-2', model: 'ox-alpha/graph-mem', role: 'memoire', provider: 'nvidia', endpoint: 'nvidia/ox-alpha-mem', desc: 'Mémoire long terme : graphe des menaces déjà neutralisées, récidives et signatures de campagnes.', load: 37, tokens: 154900, latency: 48, status: 'actif' },
  { id: 'mem0nv1', name: 'MEM0 · AGENT', model: 'mem0-agent-layer', role: 'mem0', provider: 'nvidia', endpoint: 'nvidia/mem0-agent', desc: 'Couche mem0 agent : contexte de session du superviseur et préférences opérationnelles persistées.', load: 24, tokens: 60100, latency: 18, status: 'actif' },
  { id: 'mem0nv2', name: 'MEM0 · RÉSEAU', model: 'mem0-network-layer', role: 'mem0', provider: 'nvidia', endpoint: 'nvidia/mem0-network', desc: 'Couche mem0 réseau : état partagé des nœuds, contrats hébergeurs et historique d\u2019ordres StopNet.', load: 31, tokens: 87300, latency: 20, status: 'repos' },
];

export const SEED_ROUTES: RouteEntry[] = [
  { id: 9, time: '10:30:41', task: 'scorer la cible déposée /compte/verification-gain', to: 'llama-3.3-70b', reason: 'tâche courte · latence prioritaire' },
  { id: 8, time: '10:30:12', task: 'trancher le niveau L2 vs L3 (faux profil ambigu)', to: 'deepseek-r1', reason: 'ambiguïté 0.41 · raisonnement requis' },
  { id: 7, time: '10:29:47', task: 'ancrer la signature de campagne #A7', to: 'MEM0 · RÉSEAU', reason: 'consolidation long terme' },
  { id: 6, time: '10:29:20', task: 'embedding du mot-clé « support officiel »', to: 'gemma-embed-2b', reason: 'similarité cosinus vs corpus' },
];

export const SEED_MEMOPS: MemOp[] = [
  { id: 9, time: '10:30:55', mem: 'MEM-2 ox-alpha', op: 'écriture', key: 'campagne/A7/signature', size: '2,1 Ko' },
  { id: 8, time: '10:30:30', mem: 'MEM-1 gemma', op: 'lecture', key: 'embed/url/c3d14f02', size: '768d' },
  { id: 7, time: '10:30:05', mem: 'MEM0 agent', op: 'consolidation', key: 'session/contexte-ops', size: '4,8 Ko' },
  { id: 6, time: '10:29:41', mem: 'MEM0 réseau', op: 'écriture', key: 'ordres/ST-77be09cd', size: '1,2 Ko' },
];

/* ---------------- dépôt ---------------- */

export const SEED_INTAKE: IntakeTarget[] = [
  { id: 'it-s1', type: 'url', value: 'https://secure-verif-bancaire.example/login', priority: 'haute', mode: 'analyser', at: '10:12:44', status: 'signalee', score: 94, pageId: 'x1' },
  { id: 'it-s2', type: 'site', value: 'casino-deals.io', priority: 'auto', mode: 'bloquer', at: '10:15:02', status: 'bloquee', score: 91, pageId: 'x3' },
  { id: 'it-s3', type: 'motcle', value: 'gagner iphone gratuitement', priority: 'auto', mode: 'analyser', at: '10:18:37', status: 'analysee', score: 71 },
  { id: 'it-s4', type: 'url', value: 'https://promo-flash-24h.example/claim', priority: 'auto', mode: 'deref', at: '10:25:11', status: 'ingeree', score: null },
  { id: 'it-s5', type: 'site', value: 'annuaire-express.net', priority: 'auto', mode: 'analyser', at: '10:28:49', status: 'attente', score: null },
];

export const SEED_BLOCKS: BlockEntry[] = [
  { id: 'bk-s1', url: 'https://casino-deals.io/*', scope: 'WAF', at: '10:15:02', source: 'dépôt direct (mode bloquer)' },
  { id: 'bk-s2', url: 'https://spam-directory.top/*', scope: 'edge CDN', at: '09:52:17', source: 'ordre ST-a8f91234' },
];

/* ---------------- flux crawl ---------------- */

export const CRAWL_FEED: { kind: FeedEvent['kind']; text: (t: number) => string }[] = [
  { kind: 'scan', text: (t) => `sonde TCP cortex-lab.fr — 200 OK · ${34 + ((t * 7) % 21)} ms` },
  { kind: 'ia', text: (t) => `analyse sémantique /blog/ia-cognitive — vecteur 768d · score ${81 + (t % 4)}` },
  { kind: 'scan', text: (t) => `crawl depth-${2 + (t % 3)} : ${3 + (t % 5)} ressources extraites, 0 lien mort` },
  { kind: 'sec', text: () => 'vérification X-Robots-Tag /tag/actualites — signal conforme' },
  { kind: 'scan', text: (t) => `empreinte SHA-256 /services recalculée — ${hash8('svc' + t)}` },
  { kind: 'ia', text: () => 'scrutin backlinks : 12 domaines sondés en direct' },
  { kind: 'canal', text: (t) => `heartbeat mTLS hébergeur — certificat valide ${21 - (t % 3)} j` },
  { kind: 'canal', text: (t) => `index local mis à jour — ${542 + t * 3} URLs · Δ ${t % 2 ? '+' + (t % 4) : '-' + (t % 3)}` },
  { kind: 'sec', text: (t) => `journal chaîné : maillon #${248 + t} ancré — ${hash8('chain' + t)}` },
  { kind: 'ia', text: (t) => `inférence noyau : ${3 + (t % 3)} scores recalculés en ${18 + (t % 9)} ms` },
  { kind: 'sec', text: (t) => `registre DNS TXT consulté ${6 + (t % 5)}× — ${140 + t * 3} vérifications cumulées` },
  { kind: 'canal', text: (t) => `bouclier edge : ${3 + (t % 4)} requêtes interceptées → 410 + noarchive` },
];

export const ROUTE_POOL: { task: string; to: string; reason: string }[] = [
  { task: 'trier une URL du dépôt (risque initial)', to: 'llama-3.3-70b', reason: 'voie rapide · tri massif' },
  { task: 'décider noindex vs 410 (contenu mince)', to: 'deepseek-r1', reason: 'chaîne de décision requise' },
  { task: 'embedding mot-clé déposé', to: 'gemma-embed-2b', reason: 'similarité cosinus vs corpus' },
  { task: 'comparer à une campagne connue', to: 'ox-alpha', reason: 'récidive possible — mémoire long terme' },
  { task: 'arbitrer le niveau StopNet final', to: 'qwen-72b', reason: 'supervision · ordre à signer' },
  { task: 'persister le contexte de session', to: 'MEM0 · AGENT', reason: 'consolidation mémoire agent' },
];

export const MEMOP_POOL: { mem: string; op: MemOp['op']; key: string; size: string }[] = [
  { mem: 'MEM-1 gemma', op: 'lecture', key: 'embed/url/cible-du-depot', size: '768d' },
  { mem: 'MEM-2 ox-alpha', op: 'écriture', key: 'menace/neutralisee/hash', size: '1,8 Ko' },
  { mem: 'MEM0 agent', op: 'consolidation', key: 'session/ops-courante', size: '3,4 Ko' },
  { mem: 'MEM0 réseau', op: 'lecture', key: 'contrats/hebergeurs', size: '6,2 Ko' },
  { mem: 'MEM-2 ox-alpha', op: 'lecture', key: 'campagne/signatures', size: '9,1 Ko' },
];

/* ---------------- directives ---------------- */

export function buildDirectives(page: PageNode, baseId: number): Directive[] {
  const mk = (i: number, type: string, value: string, origin: string): Directive => ({
    id: `dir-${baseId}-${i}`,
    page: page.slug,
    type,
    value,
    origin,
  });
  switch (page.decision) {
    case 'noindex':
      return [
        mk(0, 'X-Robots-Tag', 'noindex, nofollow', 'header HTTP (.htaccess)'),
        mk(1, '<meta name="robots">', 'noindex, nofollow', 'HTML injecté via API hébergeur'),
      ];
    case 'http-410':
      return [
        mk(0, 'statut HTTP', '410 Gone', 'réponse serveur forcée'),
        mk(1, 'sitemap.xml', 'entrée retirée', 'artefact régénéré puis poussé'),
      ];
    case 'canonical':
      return [
        mk(0, '<link rel="canonical">', SITE + (page.canonicalTarget ?? '/'), 'HTML injecté via API hébergeur'),
      ];
    case 'purge-cache':
      return [
        mk(0, 'Cache-Control', 'no-store, max-age=0', 'header HTTP'),
        mk(1, 'purge CDN', 'invalidation edge immédiate', 'API hébergeur'),
      ];
    default:
      return [];
  }
}

export const SEED_DIRECTIVES: Directive[] = [
  ...buildDirectives(SEED_PAGES.find((p) => p.id === 'd1')!, 1),
  ...buildDirectives(SEED_PAGES.find((p) => p.id === 'd2')!, 10),
];

/* ---------------- helpers dépôt ---------------- */

export function hashNum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 1000;
}

export function intakeScore(it: IntakeTarget): number {
  const v = it.value.toLowerCase();
  let s = 15 + (hashNum(v) % 40);
  ['phish', 'verif', 'bancaire', 'login', 'secure', 'gain', 'iphone', 'casino', 'promo', 'flash', 'vip', 'free', 'crypto', 'officiel', 'support'].forEach((k) => {
    if (v.includes(k)) s += 9;
  });
  if (it.priority === 'haute') s += 12;
  if (it.type === 'url') s += 6;
  return Math.min(99, s);
}

export function slugFromIntake(it: IntakeTarget): string {
  let v = it.value.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (v.length > 42) v = v.slice(0, 42) + '…';
  return '/' + v.replace(/\s+/g, '-').toLowerCase();
}

export function intakeToPage(it: IntakeTarget): PageNode {
  const h = hashNum(it.value);
  const v = it.value.toLowerCase();
  let risk: RiskKind = 'faux-profil';
  if (/(phish|verif|bancaire|login|secure)/.test(v)) risk = 'phishing';
  else if (/(casino|promo|flash|vip|free)/.test(v)) risk = 'spam';
  else if (/(hack|script|\.js)/.test(v)) risk = 'page-hackee';
  return {
    id: `pg-${it.id}`,
    slug: slugFromIntake(it),
    title: `Cible déposée — ${it.value.slice(0, 48)}`,
    depth: 1,
    status: 'candidate',
    score: Math.max(2, 100 - (it.score ?? 80)),
    trafic: 120 + (h % 400),
    duplicate: h % 60,
    obsolete: (h >> 2) % 20,
    decision: 'http-410',
    confidence: 92 + (h % 8),
    applied: false,
    level: (it.score ?? 80) >= 85 ? 'L3' : 'L2',
    risk,
    toxic: true,
  };
}

/* ---------------- artefacts poussés ---------------- */

export function robotsTxt(pages: PageNode[]): string {
  const deref = pages.filter((p) => p.status === 'deref' || p.toxic);
  return [
    '# DEREFSHIELD — robots.txt généré automatiquement (protocole StopNet)',
    `# Régénéré le ${new Date().toLocaleDateString('fr-FR')} à ${nowTime()}`,
    '# Canal direct hébergeur — 0 requête vers les API des moteurs',
    '',
    'User-agent: *',
    ...deref.map((p) => `Disallow: ${p.slug === '/' ? '/' : p.slug}`),
    'Allow: /',
    '',
    '# Signaux complémentaires : X-Robots-Tag injectés via .htaccess',
    `Sitemap: ${SITE}/sitemap.xml`,
  ].join('\n');
}

export function sitemapXml(pages: PageNode[]): string {
  const keep = pages.filter((p) => p.status === 'indexee' && !p.toxic);
  const out = pages.filter((p) => p.status === 'deref' || p.toxic);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<!-- DEREFSHIELD — sitemap régénéré via canal hébergeur · ${nowTime()} -->`,
    `<!-- ${out.length} URL(s) exclue(s) : déréférencement actif ou ordre StopNet -->`,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...keep.flatMap((p) => [
      '  <url>',
      `    <loc>${SITE}${p.slug === '/' ? '/' : p.slug}</loc>`,
      `    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>`,
      `    <priority>${Math.max(0.1, parseFloat((p.score / 100).toFixed(1)))}</priority>`,
      '  </url>',
    ]),
    '</urlset>',
  ];
  return lines.join('\n');
}

export function htaccess(pages: PageNode[]): string {
  const active = (p: PageNode) => p.status === 'deref' || p.toxic;
  const noindex = pages.filter((p) => active(p) && p.decision === 'noindex');
  const gone = pages.filter((p) => active(p) && p.decision === 'http-410');
  const canon = pages.filter((p) => active(p) && p.decision === 'canonical');
  const purge = pages.filter((p) => active(p) && p.decision === 'purge-cache');
  return [
    '# DEREFSHIELD — directives de déréférencement (protocole StopNet)',
    '# Injection directe via API hébergeur — jamais via console moteur',
    '',
    '<IfModule mod_headers.c>',
    '  # Pages en noindex (header HTTP)',
    ...(noindex.length
      ? noindex.map((p) => `  Header set X-Robots-Tag "noindex, nofollow" "expr=%{REQUEST_URI} == '${p.slug}'"`)
      : ['  # aucune page en noindex actuellement']),
    '  # Purges cache',
    ...(purge.length
      ? purge.map((p) => `  Header set Cache-Control "no-store, max-age=0" "expr=%{REQUEST_URI} == '${p.slug}'"`)
      : ['  # aucune purge active']),
    '</IfModule>',
    '',
    '# Suppressions définitives (signal fort aux robots)',
    ...(gone.length ? gone.map((p) => `Redirect 410 ${p.slug}`) : ['# aucune suppression active']),
    '',
    '# Canonicalisation (balise <link rel="canonical"> injectée dans le HTML)',
    ...(canon.length ? canon.map((p) => `# ${p.slug} -> ${p.canonicalTarget ?? '/'}`) : ['# aucune canonicalisation active']),
  ].join('\n');
}

export function disavowTxt(backlinks: Backlink[]): string {
  const dis = backlinks.filter((b) => b.disavowed);
  return [
    '# DEREFSHIELD — désaveux de domaines toxiques',
    '# Poussé à l\u2019hébergeur + filtrage côté serveur (WAF référent)',
    '# 0 envoi vers les consoles des moteurs de recherche',
    '',
    ...(dis.length ? dis.map((b) => `domain:${b.domain}`) : ['# aucun domaine désavoué actuellement']),
  ].join('\n');
}

export function stopTokenJson(t: StopToken): string {
  return JSON.stringify(
    {
      token_id: t.id,
      target_url: SITE + t.targetSlug,
      action: `STOP_NET_${t.level}`,
      http_status: LEVEL_META[t.level].status,
      headers: {
        'X-Robots-Tag': LEVEL_META[t.level].action,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      seo_actions: {
        remove_from_sitemap: t.level !== 'L1',
        internal_links: t.level === 'L1' ? 'nofollow' : 'remove',
        external_links_signal: t.level === 'L3' ? 'send_nofollow_webhook' : 'none',
      },
      cyber_security: {
        evidence_hash: t.evidenceHash,
        waf_block_bad_ips: true,
      },
      ttl_seconds: t.ttl,
      signature: t.signature,
    },
    null,
    2
  );
}

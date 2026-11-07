import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  AuditEvent,
  Backlink,
  BlockEntry,
  CogComponent,
  Directive,
  FeedEvent,
  HostPush,
  IntakeMode,
  IntakeTarget,
  IntakeType,
  MemOp,
  PageNode,
  RouteEntry,
  StopToken,
  Suggestion,
  Toast,
  ToastKind,
  VictimAlert,
  ViewState,
} from './data';
import {
  CRAWL_FEED,
  MEMOP_POOL,
  RESERVE_CANDIDATES,
  ROUTE_POOL,
  SEED_ALERTS,
  SEED_AUDIT,
  SEED_BACKLINKS,
  SEED_BLOCKS,
  SEED_COMPONENTS,
  SEED_DIRECTIVES,
  SEED_EVIDENCES,
  SEED_FEED,
  SEED_HOSTS,
  SEED_INTAKE,
  SEED_MEMOPS,
  SEED_PAGES,
  SEED_PUSHES,
  SEED_REGISTRY,
  SEED_ROUTES,
  SEED_SUGGESTIONS,
  SEED_TOKENS,
  buildDirectives,
  decisionLabel,
  hash8,
  intakeScore,
  intakeToPage,
  nowTime,
  riskLabel,
} from './data';

/* ---------------- état global ---------------- */

export interface AppState {
  view: ViewState;
  pages: PageNode[];
  suggestions: Suggestion[];
  backlinks: Backlink[];
  audit: AuditEvent[];
  feed: FeedEvent[];
  pushes: HostPush[];
  directives: Directive[];
  reserve: PageNode[];
  selectedPage: string | null;
  latency: number;
  threat: number;
  tick: number;
  crawl: { pct: number; queue: number };
  toasts: Toast[];
  auditSeq: number;
  feedSeq: number;
  tokens: StopToken[];
  selectedToken: string | null;
  hosts: typeof SEED_HOSTS;
  registry: typeof SEED_REGISTRY;
  evidences: typeof SEED_EVIDENCES;
  alerts: VictimAlert[];
  components: CogComponent[];
  routes: RouteEntry[];
  routesSeq: number;
  memOps: MemOp[];
  memSeq: number;
  intake: IntakeTarget[];
  blocks: BlockEntry[];
  cdnLeft: number | null;
  purgeTokenId: string | null;
}

function initState(): AppState {
  return {
    view: 'overview',
    pages: SEED_PAGES,
    suggestions: SEED_SUGGESTIONS,
    backlinks: SEED_BACKLINKS,
    audit: SEED_AUDIT,
    feed: SEED_FEED,
    pushes: SEED_PUSHES,
    directives: SEED_DIRECTIVES,
    reserve: RESERVE_CANDIDATES,
    selectedPage: null,
    latency: 41,
    threat: 12,
    tick: 0,
    crawl: { pct: 34, queue: 128 },
    toasts: [],
    auditSeq: 100,
    feedSeq: 500,
    tokens: SEED_TOKENS,
    selectedToken: 'ST-77be09cd',
    hosts: SEED_HOSTS,
    registry: SEED_REGISTRY,
    evidences: SEED_EVIDENCES,
    alerts: SEED_ALERTS,
    components: SEED_COMPONENTS,
    routes: SEED_ROUTES,
    routesSeq: 100,
    memOps: SEED_MEMOPS,
    memSeq: 200,
    intake: SEED_INTAKE,
    blocks: SEED_BLOCKS,
    cdnLeft: null,
    purgeTokenId: null,
  };
}

function mkAudit(id: number, actor: AuditEvent['actor'], level: AuditEvent['level'], message: string): AuditEvent {
  return { id, time: nowTime(), actor, level, message, hash: hash8(`${id}|${actor}|${message}`) };
}

/* ---------------- actions ---------------- */

type Action =
  | { type: 'NAV'; view: ViewState }
  | { type: 'SELECT_PAGE'; id: string | null }
  | { type: 'KEEP_PAGE'; id: string; audit: AuditEvent }
  | { type: 'REVERT_DECISION'; id: string; audit: AuditEvent }
  | { type: 'INJECT_LINK'; id: string; audit: AuditEvent }
  | { type: 'DISAVOW'; id: string; push: HostPush; audit: AuditEvent }
  | { type: 'REHABILITATE'; id: string; audit: AuditEvent }
  | { type: 'PUSH_START'; push: HostPush; audit: AuditEvent }
  | { type: 'PUSH_OK'; id: string; latency: number; audit: AuditEvent }
  | { type: 'ISSUE_TOKEN'; token: StopToken; page: PageNode; pushes: HostPush[]; audit: AuditEvent }
  | { type: 'ADVANCE_TOKEN'; id: string; status: StopToken['status']; progress: number; audit?: AuditEvent; feed?: FeedEvent }
  | { type: 'OVERRIDE_SHIELD'; tokenId: string; audit: AuditEvent; feed: FeedEvent; registry: typeof SEED_REGISTRY }
  | { type: 'SELECT_TOKEN'; id: string | null }
  | { type: 'SYNC_HOST'; hostId: string; push: HostPush; audit: AuditEvent }
  | { type: 'CAPTURE_EVIDENCE'; pageId: string; audit: AuditEvent; evidence: (typeof SEED_EVIDENCES)[number] }
  | { type: 'RESOLVE_ALERT'; id: string }
  | { type: 'INTAKE_ADD'; targets: IntakeTarget[]; pages?: PageNode[]; blocks?: BlockEntry[]; audit: AuditEvent }
  | { type: 'REANALYZE'; id: string; audit: AuditEvent }
  | { type: 'REMOVE_BLOCK'; id: string; audit: AuditEvent }
  | { type: 'PURGE_START'; tokenId: string; audit: AuditEvent; feed: FeedEvent }
  | { type: 'SEND_SIGNALS'; id: string; audit: AuditEvent }
  | { type: 'TICK' }
  | { type: 'TOAST'; id: number; kind: ToastKind; text: string }
  | { type: 'UNTOAST'; id: number };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'NAV':
      return { ...s, view: a.view, selectedPage: null };

    case 'SELECT_PAGE':
      return { ...s, selectedPage: a.id };

    case 'KEEP_PAGE':
      return {
        ...s,
        pages: s.pages.map((p) =>
          p.id === a.id ? { ...p, applied: true, status: 'indexee' as const, decision: 'conserver' as const } : p
        ),
        audit: [a.audit, ...s.audit],
      };

    case 'REVERT_DECISION': {
      const page = s.pages.find((p) => p.id === a.id);
      return {
        ...s,
        pages: s.pages.map((p) => (p.id === a.id ? { ...p, applied: false, status: 'candidate' as const } : p)),
        directives: page ? s.directives.filter((d) => d.page !== page.slug) : s.directives,
        audit: [a.audit, ...s.audit],
      };
    }

    case 'INJECT_LINK':
      return {
        ...s,
        suggestions: s.suggestions.map((sg) => (sg.id === a.id ? { ...sg, applied: true } : sg)),
        audit: [a.audit, ...s.audit],
      };

    case 'DISAVOW':
      return {
        ...s,
        backlinks: s.backlinks.map((b) => (b.id === a.id ? { ...b, disavowed: true } : b)),
        pushes: [a.push, ...s.pushes],
        audit: [a.audit, ...s.audit],
      };

    case 'REHABILITATE':
      return {
        ...s,
        backlinks: s.backlinks.map((b) => (b.id === a.id ? { ...b, disavowed: false } : b)),
        audit: [a.audit, ...s.audit],
      };

    case 'PUSH_START':
      return { ...s, pushes: [a.push, ...s.pushes], audit: [a.audit, ...s.audit] };

    case 'PUSH_OK':
      return {
        ...s,
        pushes: s.pushes.map((p) => (p.id === a.id ? { ...p, status: 'ok' as const, latency: a.latency } : p)),
        audit: [a.audit, ...s.audit],
      };

    case 'ISSUE_TOKEN':
      return {
        ...s,
        tokens: [a.token, ...s.tokens],
        pages: s.pages.map((p) => (p.id === a.page.id ? { ...p, status: 'deref' as const, applied: true } : p)),
        directives: [...buildDirectives(a.page, s.auditSeq), ...s.directives],
        pushes: [...a.pushes, ...s.pushes],
        selectedToken: a.token.id,
        audit: [a.audit, ...s.audit],
      };

    case 'ADVANCE_TOKEN':
      return {
        ...s,
        tokens: s.tokens.map((t) => (t.id === a.id ? { ...t, status: a.status, progress: a.progress } : t)),
        pages:
          a.status === 'confirme'
            ? s.pages.map((p) => {
                const tok = s.tokens.find((t) => t.id === a.id);
                return tok && p.slug === tok.targetSlug ? { ...p, status: 'deref' as const, applied: true } : p;
              })
            : s.pages,
        intake:
          a.status === 'confirme'
            ? s.intake.map((it) => {
                const tok = s.tokens.find((t) => t.id === a.id);
                const pg = tok ? s.pages.find((p) => p.slug === tok.targetSlug) : null;
                return pg && it.pageId === pg.id ? { ...it, status: 'neutralisee' as const } : it;
              })
            : s.intake,
        audit: a.audit ? [a.audit, ...s.audit] : s.audit,
        feed: a.feed ? [a.feed, ...s.feed].slice(0, 40) : s.feed,
      };

    case 'OVERRIDE_SHIELD':
      return {
        ...s,
        tokens: s.tokens.map((t) =>
          t.id === a.tokenId
            ? {
                ...t,
                status: 'ignore' as const,
                progress: 100,
                override: { dns: true, cdn: true, shield: true },
                contract: t.contract.map((c, i) => ({ ...c, ok: i < 1 })),
              }
            : t
        ),
        registry: [...a.registry, ...s.registry],
        audit: [a.audit, ...s.audit],
        feed: [a.feed, ...s.feed].slice(0, 40),
      };

    case 'SELECT_TOKEN':
      return { ...s, selectedToken: a.id };

    case 'SYNC_HOST':
      return {
        ...s,
        hosts: s.hosts.map((h) => (h.id === a.hostId ? { ...h, pushes: h.pushes + 1, lastPush: a.push.time } : h)),
        pushes: [a.push, ...s.pushes],
        audit: [a.audit, ...s.audit],
      };

    case 'CAPTURE_EVIDENCE':
      return {
        ...s,
        evidences: [a.evidence, ...s.evidences],
        audit: [a.audit, ...s.audit],
      };

    case 'RESOLVE_ALERT':
      return {
        ...s,
        alerts: s.alerts.map((al) => (al.id === a.id ? { ...al, resolved: true } : al)),
      };

    case 'INTAKE_ADD':
      return {
        ...s,
        intake: [...a.targets, ...s.intake],
        pages: a.pages ? [...s.pages, ...a.pages] : s.pages,
        blocks: a.blocks ? [...a.blocks, ...s.blocks] : s.blocks,
        components: s.components.map((c) =>
          c.id === 'qwen'
            ? { ...c, load: Math.min(96, c.load + 14) }
            : c.id === 'llama'
              ? { ...c, load: Math.min(96, c.load + 22) }
              : c
        ),
        audit: [a.audit, ...s.audit],
      };

    case 'REANALYZE':
      return {
        ...s,
        intake: s.intake.map((it) => (it.id === a.id ? { ...it, status: 'ingeree' as const } : it)),
        audit: [a.audit, ...s.audit],
      };

    case 'REMOVE_BLOCK':
      return {
        ...s,
        blocks: s.blocks.filter((b) => b.id !== a.id),
        audit: [a.audit, ...s.audit],
      };

    case 'PURGE_START':
      return {
        ...s,
        cdnLeft: 56,
        purgeTokenId: a.tokenId,
        audit: [a.audit, ...s.audit],
        feed: [a.feed, ...s.feed].slice(0, 40),
      };

    case 'SEND_SIGNALS':
      return {
        ...s,
        tokens: s.tokens.map((tk) =>
          tk.id === a.id ? { ...tk, signalsSent: Math.min(14, tk.signalsSent + 4) } : tk
        ),
        audit: [a.audit, ...s.audit],
      };

    case 'TICK': {
      const t = s.tick + 1;
      const src = CRAWL_FEED[(t - 1) % CRAWL_FEED.length];
      let feed: FeedEvent[] = [
        { id: s.feedSeq, time: nowTime(), kind: src.kind, text: src.text(t) },
        ...s.feed,
      ].slice(0, 40);
      let feedSeq = s.feedSeq + 1;
      let pages = s.pages;
      let reserve = s.reserve;
      let audit = s.audit;
      let auditSeq = s.auditSeq;

      /* nouvelles candidates via le crawl */
      if (t % 6 === 0 && reserve.length > 0) {
        const [next, ...rest] = reserve;
        pages = [...pages, next];
        reserve = rest;
        feed = [
          { id: feedSeq++, time: nowTime(), kind: 'ia' as const, text: `nouvelle candidate détectée : ${next.slug} — score IA ${next.score}/100` },
          ...feed,
        ].slice(0, 40);
        audit = [
          mkAudit(auditSeq++, 'IA-COG', 'warn', `Nouvelle candidate en file : ${next.slug} (« ${decisionLabel[next.decision]} » recommandé)`),
          ...audit,
        ];
      }

      /* OS cognitif : charges & débits */
      const components = s.components.map((c) => {
        const j = ((t * 7 + c.id.length * 13) % 9) - 4;
        const load = Math.min(96, Math.max(3, c.load + j));
        return { ...c, load, tokens: c.tokens + Math.round(load * 42 + ((t + c.id.length) % 9) * 60) };
      });

      /* routage du superviseur */
      let routes = s.routes;
      let routesSeq = s.routesSeq;
      if (t % 3 === 0) {
        const tmpl = ROUTE_POOL[Math.floor(t / 3) % ROUTE_POOL.length];
        routes = [{ id: routesSeq++, time: nowTime(), ...tmpl }, ...routes].slice(0, 24);
      }

      /* opérations mémoire */
      let memOps = s.memOps;
      let memSeq = s.memSeq;
      if (t % 4 === 0) {
        const op = MEMOP_POOL[Math.floor(t / 4) % MEMOP_POOL.length];
        memOps = [{ id: memSeq++, time: nowTime(), ...op }, ...memOps].slice(0, 18);
      }

      /* cycle de vie du dépôt */
      let intake = s.intake;
      const idxA = intake.findIndex((x) => x.status === 'attente');
      if (idxA >= 0) {
        const it = intake[idxA];
        intake = intake.map((x, i) => (i === idxA ? { ...x, status: 'ingeree' as const } : x));
        feed = [
          { id: feedSeq++, time: nowTime(), kind: 'ia' as const, text: `ingestion dépôt : ${it.value} → tri noyau cognitif` },
          ...feed,
        ].slice(0, 40);
      } else {
        const idxI = intake.findIndex((x) => x.status === 'ingeree');
        if (idxI >= 0) {
          const it = intake[idxI];
          const score = Math.min(99, 15 + ((t * 17 + it.value.length * 7) % 85));
          const flagged = score >= 60;
          let analyzed: IntakeTarget = {
            ...it,
            status: flagged ? ('signalee' as const) : ('analysee' as const),
            score,
          };
          if (flagged) {
            const newPage = intakeToPage({ ...analyzed, score });
            analyzed = { ...analyzed, pageId: newPage.id };
            pages = [...pages, newPage];
            audit = [
              mkAudit(auditSeq++, 'IA-COG', 'crit', `Dépôt analysé — ${riskLabel[newPage.risk]} (risque ${score}/100) : ${it.value} → file ${newPage.level}`),
              ...audit,
            ];
            feed = [
              { id: feedSeq++, time: nowTime(), kind: 'sec' as const, text: `menace signalée depuis le dépôt : ${it.value} → file de déréférencement` },
              ...feed,
            ].slice(0, 40);
          } else {
            audit = [
              mkAudit(auditSeq++, 'IA-COG', 'info', `Dépôt analysé — risque faible ${score}/100 : ${it.value}`),
              ...audit,
            ];
          }
          intake = intake.map((x) => (x.id === it.id ? analyzed : x));
        }
      }

      /* avancement des ordres StopNet */
      const active = s.tokens.find((tk) => tk.status === 'pousse');
      let tokens = s.tokens;
      if (active) {
        const prog = Math.min(100, active.progress + 24);
        const checksDone = Math.floor((prog / 100) * active.contract.length);
        tokens = s.tokens.map((tk) =>
          tk.id === active.id
            ? { ...tk, progress: prog, contract: tk.contract.map((c, i) => ({ ...c, ok: i < checksDone })) }
            : tk
        );
        if (prog >= 100) {
          const host = s.hosts.find((h) => h.id === active.hostId);
          const ok = host?.status !== 'degrade';
          if (ok) {
            tokens = tokens.map((tk) => (tk.id === active.id ? { ...tk, status: 'confirme' as const } : tk));
            audit = [
              mkAudit(auditSeq++, 'CANAL', 'ok', `Ordre ${active.id} confirmé par ${host?.panel ?? 'hôte'} — preuve sha256:${hash8(active.id + t)} reçue`),
              ...audit,
            ];
          } else {
            feed = [
              { id: feedSeq++, time: nowTime(), kind: 'sec' as const, text: `contrat ignoré par ${host?.panel ?? 'l\u2019hôte'} (${active.id}) — bascule override DNS/CDN armée` },
              ...feed,
            ].slice(0, 40);
            audit = [
              mkAudit(auditSeq++, 'SEC', 'crit', `${host?.panel ?? 'Hôte'} n\u2019a pas appliqué ${active.id} — protocole d\u2019override engagé`),
              ...audit,
            ];
          }
        }
      }

      /* purge CDN (contrat < 60 s) */
      let cdnLeft = s.cdnLeft;
      let purgeTokenId = s.purgeTokenId;
      if (cdnLeft != null) {
        cdnLeft -= 4;
        if (cdnLeft <= 0) {
          cdnLeft = null;
          if (purgeTokenId) {
            tokens = tokens.map((tk) =>
              tk.id === purgeTokenId ? { ...tk, override: { ...tk.override, cdn: true } } : tk
            );
            audit = [
              mkAudit(auditSeq++, 'CANAL', 'ok', `Purge CDN confirmée sur 14 edges — ${purgeTokenId} en < 60 s (contrat respecté)`),
              ...audit,
            ];
          }
          purgeTokenId = null;
        }
      }

      const pct = s.crawl.pct + 6 + (t % 5);
      return {
        ...s,
        tick: t,
        feedSeq,
        auditSeq,
        latency: 32 + ((t * 7) % 19) + ((t * 13) % 9),
        threat: 9 + ((t * 11) % 8),
        crawl: { pct: pct > 100 ? pct - 100 : pct, queue: Math.max(4, 132 - t * 2 + (t % 5)) },
        feed,
        pages,
        reserve,
        audit,
        components,
        routes,
        routesSeq,
        memOps,
        memSeq,
        intake,
        tokens,
        cdnLeft,
        purgeTokenId,
      };
    }

    case 'TOAST':
      return { ...s, toasts: [...s.toasts, { id: a.id, kind: a.kind, text: a.text }].slice(-4) };

    case 'UNTOAST':
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };

    default:
      return s;
  }
}

/* ---------------- API exposée ---------------- */

export interface StoreApi {
  nav: (view: ViewState) => void;
  selectPage: (id: string | null) => void;
  keepPage: (pageId: string) => void;
  revertDecision: (pageId: string) => void;
  injectLink: (sugId: string) => void;
  disavow: (backlinkId: string) => void;
  rehabilitate: (backlinkId: string) => void;
  pushFile: (file: string) => void;
  issueToken: (pageId: string) => void;
  selectToken: (id: string | null) => void;
  overrideShield: (tokenId: string) => void;
  syncHost: (hostId: string) => void;
  captureEvidence: (pageId: string) => void;
  resolveAlert: (id: string) => void;
  addIntake: (items: { type: IntakeType; value: string }[], priority: 'auto' | 'haute', mode?: IntakeMode) => void;
  reanalyze: (id: string) => void;
  removeBlock: (id: string) => void;
  purgeCdn: (tokenId: string) => void;
  sendSignals: (tokenId: string) => void;
  toast: (kind: ToastKind, text: string) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<{ state: AppState; api: StoreApi } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const ref = useRef(state);
  ref.current = state;
  const seq = useRef(1000);

  useEffect(() => {
    const iv = window.setInterval(() => dispatch({ type: 'TICK' }), 3800);
    return () => window.clearInterval(iv);
  }, []);

  const api = useMemo<StoreApi>(() => {
    const toast = (kind: ToastKind, text: string) => {
      const id = seq.current++;
      dispatch({ type: 'TOAST', id, kind, text });
      window.setTimeout(() => dispatch({ type: 'UNTOAST', id }), 4600);
    };

    const confirmPush = (id: string, file: string, ms: number, latency: number) => {
      window.setTimeout(() => {
        dispatch({
          type: 'PUSH_OK',
          id,
          latency,
          audit: mkAudit(seq.current++, 'CANAL', 'ok', `${file} synchronisé via API REST hébergeur · ${latency} ms — SHA-256 vérifié`),
        });
      }, ms);
    };

    return {
      nav: (view) => dispatch({ type: 'NAV', view }),

      selectPage: (id) =>
        dispatch({ type: 'SELECT_PAGE', id: id === ref.current.selectedPage ? null : id }),

      keepPage: (pageId) => {
        const page = ref.current.pages.find((p) => p.id === pageId);
        if (!page) return;
        dispatch({
          type: 'KEEP_PAGE',
          id: pageId,
          audit: mkAudit(seq.current++, 'OPS', 'info', `${page.slug} conservée — réévaluation planifiée au prochain crawl`),
        });
        toast('info', `${page.slug} conservée — réévaluée au prochain crawl`);
      },

      revertDecision: (pageId) => {
        const page = ref.current.pages.find((p) => p.id === pageId);
        if (!page) return;
        dispatch({
          type: 'REVERT_DECISION',
          id: pageId,
          audit: mkAudit(seq.current++, 'OPS', 'warn', `Décision révoquée sur ${page.slug} — retour en file d'attente`),
        });
        toast('warn', `${page.slug} repasse en file d'attente — directives retirées`);
      },

      injectLink: (sugId) => {
        const sg = ref.current.suggestions.find((x) => x.id === sugId);
        if (!sg || sg.applied) return;
        const from = ref.current.pages.find((p) => p.id === sg.from);
        const to = ref.current.pages.find((p) => p.id === sg.to);
        dispatch({
          type: 'INJECT_LINK',
          id: sugId,
          audit: mkAudit(seq.current++, 'OPS', 'ok', `Lien interne injecté : ${from?.slug ?? sg.from} → ${to?.slug ?? sg.to} (ancre « ${sg.anchor} »)`),
        });
        toast('ok', `Lien injecté via API REST hébergeur : « ${sg.anchor} »`);
      },

      disavow: (backlinkId) => {
        const b = ref.current.backlinks.find((x) => x.id === backlinkId);
        if (!b || b.disavowed) return;
        const id = `push-${Date.now()}-${seq.current}`;
        const push: HostPush = {
          id,
          file: 'disavow.txt',
          time: nowTime(),
          status: 'pending',
          checksum: hash8('disavow' + b.domain + id),
          latency: 0,
        };
        dispatch({
          type: 'DISAVOW',
          id: backlinkId,
          push,
          audit: mkAudit(seq.current++, 'SEC', 'warn', `Désaveu de ${b.domain} — poussé dans disavow.txt + filtrage WAF référent`),
        });
        confirmPush(id, 'disavow.txt', 1400, 31 + (b.domain.length % 20));
        toast('warn', `${b.domain} désavoué — disavow.txt en cours de synchronisation`);
      },

      rehabilitate: (backlinkId) => {
        const b = ref.current.backlinks.find((x) => x.id === backlinkId);
        if (!b) return;
        dispatch({
          type: 'REHABILITATE',
          id: backlinkId,
          audit: mkAudit(seq.current++, 'SEC', 'info', `${b.domain} réhabilité — retiré du fichier de désaveu`),
        });
        toast('info', `${b.domain} réhabilité — domaine de nouveau suivi`);
      },

      pushFile: (file) => {
        const id = `push-${Date.now()}-${seq.current}`;
        const push: HostPush = {
          id,
          file,
          time: nowTime(),
          status: 'pending',
          checksum: hash8(file + id),
          latency: 0,
        };
        dispatch({
          type: 'PUSH_START',
          push,
          audit: mkAudit(seq.current++, 'OPS', 'info', `Push manuel demandé : ${file} vers l'hébergeur`),
        });
        confirmPush(id, file, 1400, 24 + ((file.length * 5) % 30));
        toast('info', `Synchronisation de ${file} en cours…`);
      },

      issueToken: (pageId) => {
        const page = ref.current.pages.find((p) => p.id === pageId);
        if (!page) return;
        if (ref.current.tokens.some((tk) => tk.targetSlug === page.slug)) {
          toast('warn', `Un ordre StopNet existe déjà pour ${page.slug}`);
          return;
        }
        const stamp = Date.now();
        const shortId = hash8(page.slug + stamp).slice(0, 8);
        const mkC = (i: number, rule: string, detail: string) => ({ id: `c${i}`, rule, detail, ok: null as boolean | null });
        const contract =
          page.level === 'L1'
            ? [
                mkC(1, 'Headers X-Robots-Tag injectés', 'noindex, nofollow servis sur la cible'),
                mkC(2, 'Maillage interne neutralisé', 'liens entrants passés en rel="nofollow"'),
                mkC(3, 'Preuve d\u2019exécution SHA-256', 'hash renvoyé par l\u2019hébergeur'),
              ]
            : page.level === 'L2'
              ? [
                  mkC(1, 'Statut HTTP 410 Gone', 'réponse forcée côté serveur'),
                  mkC(2, 'Purge cache < 60 s', 'invalidation edge + origine'),
                  mkC(3, 'Retrait maillage + sitemap.xml', 'liens internes supprimés, entrée ôtée'),
                ]
              : [
                  mkC(1, 'Statut HTTP 410 Gone', 'réponse forcée côté serveur'),
                  mkC(2, 'Purge cache < 60 s', 'invalidation edge + origine'),
                  mkC(3, 'Retrait maillage + sitemap.xml', 'liens internes supprimés, entrée ôtée'),
                  mkC(4, 'Signal nofollow externe (webhook)', 'réseau notifié pour les liens sortants'),
                ];
        const token: StopToken = {
          id: `ST-${shortId}`,
          targetSlug: page.slug,
          hostId: 'h-cpanel',
          level: page.level,
          risk: page.risk,
          status: 'genere',
          progress: 0,
          ttl: 86400,
          createdAt: nowTime(),
          signature: hash8(`sig1|${page.slug}|${stamp}`) + hash8(`sig2|${page.slug}|${stamp}`),
          evidenceHash: 'sha256:' + hash8(`ev1|${page.slug}`) + hash8(`ev2|${page.slug}`) + hash8(`ev3|${page.slug}`) + hash8(`ev4|${page.slug}`),
          override: { dns: false, cdn: false, shield: false },
          contract,
          signalsSent: 0,
        };
        const files = ['stopnet/' + token.id + '.json', 'robots.txt'];
        if (page.level !== 'L1') files.push('sitemap.xml');
        if (page.level === 'L3') files.push('disavow.txt');
        const pushes: HostPush[] = files.map((f, i) => ({
          id: `push-${stamp}-${i}`,
          file: f,
          time: nowTime(),
          status: 'pending' as const,
          checksum: hash8(`${f}${page.slug}${stamp}${i}`),
          latency: 0,
        }));
        dispatch({
          type: 'ISSUE_TOKEN',
          token,
          page,
          pushes,
          audit: mkAudit(seq.current++, 'IA-COG', 'crit', `Ordre signé ${token.id} émis (${page.level} · ${riskLabel[page.risk]}) pour ${page.slug} — Ed25519`),
        });
        toast('crit', `Ordre ${token.id} signé puis poussé — vérification du contrat hébergeur en cours`);
        window.setTimeout(
          () =>
            dispatch({
              type: 'ADVANCE_TOKEN',
              id: token.id,
              status: 'pousse',
              progress: 8,
              audit: mkAudit(seq.current++, 'CANAL', 'ok', `Ordre ${token.id} remis à l'hébergeur via API signée (mTLS) — accusé reçu`),
              feed: { id: seq.current + 9000, time: nowTime(), kind: 'canal', text: `ordre ${token.id} poussé → h-cpanel · contrat à vérifier` },
            }),
          1200
        );
        pushes.forEach((p, i) => confirmPush(p.id, p.file, 1600 + i * 900, 26 + ((p.id.length * 7 + i * 11) % 33)));
      },

      selectToken: (id) => dispatch({ type: 'SELECT_TOKEN', id }),

      overrideShield: (tokenId) => {
        const tok = ref.current.tokens.find((tk) => tk.id === tokenId);
        if (!tok) return;
        const domain = tok.targetSlug.replace(/^\//, '').split('/')[0] + '.example';
        const short = tok.id.replace('ST-', '');
        dispatch({
          type: 'OVERRIDE_SHIELD',
          tokenId,
          audit: mkAudit(seq.current++, 'SEC', 'crit', `Override actif pour ${tok.id} — CNAME ${domain} → shield.derefshield.net · réponse 410 + noarchive`),
          feed: { id: seq.current + 9100, time: nowTime(), kind: 'sec', text: `bouclier déployé : ${domain} intercepté au edge (DNS + CDN)` },
          registry: [
            {
              id: `rg-${Date.now()}`,
              domain,
              txt: `v=ds1; a=stop; l=${tok.level === 'L3' ? 3 : 2}; t=${short}`,
              level: tok.level,
              since: nowTime(),
              checks: 0,
            },
          ],
        });
        toast('crit', `Bouclier déployé — ${domain} sert désormais 410 + page de sécurité`);
      },

      syncHost: (hostId) => {
        const h = ref.current.hosts.find((x) => x.id === hostId);
        if (!h) return;
        const id = `push-${Date.now()}-${seq.current}`;
        const push: HostPush = {
          id,
          file: 'artefacts-complets',
          time: nowTime(),
          status: 'pending',
          checksum: hash8('sync' + h.id + id),
          latency: 0,
        };
        dispatch({
          type: 'SYNC_HOST',
          hostId,
          push,
          audit: mkAudit(seq.current++, 'CANAL', 'info', `Synchronisation complète demandée sur ${h.panel} (${h.domain})`),
        });
        confirmPush(id, `artefacts → ${h.panel}`, 1500, 22 + (h.domain.length % 25));
        toast('info', `Artefacts en cours de synchronisation sur ${h.panel}…`);
      },

      captureEvidence: (pageId) => {
        const page = ref.current.pages.find((p) => p.id === pageId);
        if (!page) return;
        if (ref.current.evidences.some((e) => e.target === page.slug)) {
          toast('info', `La preuve pour ${page.slug} est déjà au coffre`);
          return;
        }
        const tok = ref.current.tokens.find((tk) => tk.targetSlug === page.slug);
        const stamp = Date.now();
        dispatch({
          type: 'CAPTURE_EVIDENCE',
          pageId,
          evidence: {
            id: `ev-${stamp}`,
            target: page.slug,
            tokenId: tok?.id,
            at: nowTime(),
            htmlHash: hash8(`${page.slug}|h1|${stamp}`) + hash8(`${page.slug}|h2`) + hash8(`${page.slug}|h3`) + hash8(`${page.slug}|h4`),
            tlsFp: hash8(`${page.slug}|tls1`) + hash8(`${page.slug}|tls2`),
            size: `${120 + ((page.slug.length * 17) % 900)} Ko`,
            headers: ['HTTP/2 200', 'server: nginx/1.24.0', 'x-content-type-options: nosniff', 'set-cookie: sess=…; Secure'],
            shot: true,
          },
          audit: mkAudit(seq.current++, 'SEC', 'warn', `Forensics capturée pour ${page.slug} — HTML + headers + TLS hashés, ancrés au journal`),
        });
        toast('ok', `Preuve forensics capturée pour ${page.slug} — ancrée au coffre`);
      },

      resolveAlert: (id) => {
        dispatch({ type: 'RESOLVE_ALERT', id });
        toast('ok', 'Alerte visiteur marquée comme traitée');
      },

      addIntake: (items, priority, mode = 'analyser') => {
        const stamp = Date.now();
        const targets: IntakeTarget[] = items.map((it, i) => {
          const base: IntakeTarget = {
            id: `it-${stamp}-${i}`,
            type: it.type,
            value: it.value,
            priority,
            mode,
            at: nowTime(),
            status: 'attente',
            score: null,
          };
          return { ...base, score: mode === 'analyser' ? null : intakeScore(base) };
        });

        let pages: PageNode[] | undefined;
        let blocks: BlockEntry[] | undefined;

        if (mode === 'bloquer') {
          blocks = targets.map((t) => ({
            id: `bk-${t.id}`,
            url:
              t.type === 'site'
                ? `https://${t.value}/*`
                : t.type === 'motcle'
                  ? `mot-clé : « ${t.value} »`
                  : t.value.replace(/\/$/, '') + (t.value.includes('/', 9) ? '' : '/*'),
            scope: 'WAF' as const,
            at: t.at,
            source: 'dépôt direct (mode bloquer)',
          }));
          targets.forEach((t) => {
            t.status = 'bloquee';
          });
        } else if (mode === 'deref') {
          pages = targets.map((t) => {
            const score = intakeScore(t);
            t.status = 'signalee';
            t.score = score;
            const page = intakeToPage({ ...t, score });
            t.pageId = page.id;
            return page;
          });
        }

        const modeLabel = mode === 'bloquer' ? 'blocage immédiat' : mode === 'deref' ? 'déréférencement direct' : 'pipeline cognitif';
        dispatch({
          type: 'INTAKE_ADD',
          targets,
          pages,
          blocks,
          audit: mkAudit(
            seq.current++,
            mode === 'analyser' ? 'OPS' : 'SEC',
            mode === 'bloquer' ? 'crit' : mode === 'deref' ? 'warn' : 'info',
            `Dépôt (${modeLabel}) : ${targets.length} cible(s) — ${targets.map((t) => t.value).join(', ').slice(0, 80)}`
          ),
        });

        if (mode === 'bloquer') toast('crit', `${targets.length} cible(s) bloquée(s) au WAF — registre mis à jour`);
        else if (mode === 'deref') toast('warn', `${targets.length} menace(s) ajoutée(s) à la file de déréférencement`);
        else toast('ok', `${targets.length} cible(s) déposée(s) — tri par le noyau cognitif lancé`);
      },

      reanalyze: (id) => {
        const it = ref.current.intake.find((x) => x.id === id);
        if (!it) return;
        dispatch({
          type: 'REANALYZE',
          id,
          audit: mkAudit(seq.current++, 'OPS', 'info', `Ré-analyse demandée pour ${it.value} — repasse dans le noyau cognitif`),
        });
        toast('info', `${it.value} repasse en analyse (voie profonde si ambigu)`);
      },

      removeBlock: (id) => {
        const b = ref.current.blocks.find((x) => x.id === id);
        if (!b) return;
        dispatch({
          type: 'REMOVE_BLOCK',
          id,
          audit: mkAudit(seq.current++, 'SEC', 'info', `Blocage levé pour ${b.url} — règle retirée du WAF`),
        });
        toast('info', `Blocage levé : ${b.url}`);
      },

      purgeCdn: (tokenId) => {
        const tok = ref.current.tokens.find((tk) => tk.id === tokenId);
        if (!tok) return;
        if (ref.current.cdnLeft != null) return;
        dispatch({
          type: 'PURGE_START',
          tokenId,
          audit: mkAudit(seq.current++, 'CANAL', 'warn', `Purge CDN ordonnée pour ${tokenId} — invalidation des 14 edges (contrat < 60 s)`),
          feed: { id: seq.current + 9200, time: nowTime(), kind: 'canal', text: `purge edge lancée pour ${tokenId} — invalidation workers` },
        });
        toast('warn', 'Purge CDN lancée — les edges doivent confirmer en moins de 60 s');
      },

      sendSignals: (tokenId) => {
        const tok = ref.current.tokens.find((tk) => tk.id === tokenId);
        if (!tok) return;
        dispatch({
          type: 'SEND_SIGNALS',
          id: tokenId,
          audit: mkAudit(seq.current++, 'CANAL', 'info', `Webhooks nofollow émis vers les sites du réseau (${Math.min(14, tok.signalsSent + 4)} signaux cumulés)`),
        });
        toast('info', 'Webhooks nofollow envoyés aux sites du réseau — accusés en cours');
      },

      toast,
      dismissToast: (id) => dispatch({ type: 'UNTOAST', id }),
    };
  }, []);

  return <Ctx.Provider value={{ state, api }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return ctx;
}

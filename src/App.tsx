import { useEffect, useState } from 'react';
import type { ComponentType, DragEvent, ReactNode } from 'react';
import { StoreProvider, useStore } from './lib/store';
import type { IntakeMode, ToastKind, ViewState } from './lib/data';
import { orphelines } from './lib/data';
import { Badge, StatusDot } from './components/ui';
import {
  IcAlert,
  IcBolt,
  IcCheck,
  IcChip,
  IcGhost,
  IcGlobe,
  IcGraph,
  IcGrid,
  IcLock,
  IcLogo,
  IcRadar,
  IcServer,
  IcShield,
  IcUpload,
  IcX,
} from './components/icons';
import Overview from './views/Overview';
import Cognitif from './views/Cognitif';
import Depot from './views/Depot';
import Maillage from './views/Maillage';
import Backlinks from './views/Backlinks';
import Dereferencement from './views/Dereferencement';
import StopNet from './views/StopNet';
import Hebergeur from './views/Hebergeur';
import Forensics from './views/Forensics';
import Audit from './views/Audit';

/* ---------------- horloge ---------------- */

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(iv);
  }, []);
  return <span className="tabular">{now.toLocaleTimeString('fr-FR', { hour12: false })}</span>;
}

/* ---------------- barre de dépôt d'URL (globale) ---------------- */

function normalizeUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    if (!u.hostname.includes('.') || u.hostname.length < 4) return null;
    return u.href;
  } catch {
    return null;
  }
}

const DROP_MODES: { id: IntakeMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'analyser', label: 'analyser', icon: IcRadar },
  { id: 'bloquer', label: 'bloquer', icon: IcX },
  { id: 'deref', label: 'déréférencer', icon: IcGhost },
];

function UrlDrop() {
  const { api } = useStore();
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);
  const [sent, setSent] = useState<IntakeMode | null>(null);
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<IntakeMode>('analyser');

  const submit = (raw: string) => {
    const v = normalizeUrl(raw);
    if (!v) {
      setErr(true);
      window.setTimeout(() => setErr(false), 700);
      api.toast('crit', 'URL invalide — déposez une adresse complète (https://…)');
      return;
    }
    api.addIntake([{ type: 'url', value: v }], 'auto', mode);
    setVal('');
    setSent(mode);
    window.setTimeout(() => setSent(null), 1400);
    setOpen(false);
  };

  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      const raw = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (raw) submit(raw.split('\n')[0]);
    },
  };

  const inputCls =
    'bg-transparent outline-none font-mono text-[11px] text-fog placeholder:text-mute flex-1 min-w-0';

  const modeBtnCls: Record<IntakeMode, string> = {
    analyser: 'text-mint border-mint/40 hover:bg-mint/10',
    bloquer: 'text-coral border-coral/40 hover:bg-coral/10',
    deref: 'text-amber border-amber/40 hover:bg-amber/10',
  };

  const placeholder = `URL à ${mode === 'bloquer' ? 'BLOQUER' : mode === 'deref' ? 'DÉRÉFÉRENCER' : 'analyser'} — coller ou glisser-déposer, puis Entrée`;

  return (
    <>
      {/* dépôt inline — desktop */}
      <div
        {...dropHandlers}
        className={`hidden lg:flex flex-1 max-w-2xl items-center gap-2 border pr-2 h-9 transition-all duration-200 ${
          over
            ? 'border-mint bg-mint/10 scale-[1.01]'
            : err
              ? 'border-coral bg-coral/10 anim-shake'
              : sent
                ? sent === 'bloquer'
                  ? 'border-coral bg-coral/5'
                  : sent === 'deref'
                    ? 'border-amber bg-amber/5'
                    : 'border-mint bg-mint/5'
                : 'border-line bg-ink-850/70 hover:border-mute'
        }`}
        title="Choisissez l'action, puis collez ou glissez-déposez l'URL"
      >
        <div className="flex items-stretch border-r border-line-soft divide-x divide-line-soft shrink-0 self-stretch">
          {DROP_MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            const activeCls =
              m.id === 'bloquer'
                ? 'bg-coral/15 text-coral'
                : m.id === 'deref'
                  ? 'bg-amber/15 text-amber'
                  : 'bg-sky/15 text-sky';
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1 px-2 font-mono text-[8.5px] uppercase tracking-wider transition-colors cursor-pointer ${
                  active ? activeCls : 'text-mute hover:text-dim'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden xl:inline">{m.label}</span>
              </button>
            );
          })}
        </div>
        <IcUpload className={`w-3.5 h-3.5 shrink-0 ml-1.5 transition-colors ${over || sent ? 'text-mint' : 'text-mute'}`} />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(val)}
          placeholder={placeholder}
          className={inputCls}
          aria-label="Déposer une URL suspecte"
        />
        {sent ? (
          <span className={`flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider anim-feed shrink-0 ${
            sent === 'bloquer' ? 'text-coral' : sent === 'deref' ? 'text-amber' : 'text-mint'
          }`}>
            <IcCheck className="w-3.5 h-3.5" />
            {sent === 'bloquer' ? 'bloquée WAF' : sent === 'deref' ? '→ file déréf' : 'ingérée'}
          </span>
        ) : (
          <button
            onClick={() => submit(val)}
            className={`font-mono text-[9.5px] uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer shrink-0 ${modeBtnCls[mode]}`}
          >
            {mode === 'bloquer' ? 'bloquer' : mode === 'deref' ? 'déréférencer' : 'déposer'}
          </button>
        )}
      </div>

      {/* bouton flottant — mobile */}
      <button
        onClick={() => setOpen(!open)}
        className={`lg:hidden fixed bottom-10 left-4 z-40 w-11 h-11 grid place-items-center border shadow-xl transition-all duration-200 cursor-pointer ${
          open ? 'border-mint bg-mint text-ink-950 rotate-45' : 'border-mint/50 bg-ink-800 text-mint dot-live'
        }`}
        aria-label="Déposer une URL"
      >
        <IcUpload className="w-4 h-4" />
      </button>
      {open && (
        <div
          {...dropHandlers}
          className={`lg:hidden fixed bottom-[4.9rem] left-4 right-4 z-40 panel corners p-3 anim-toast ${over ? 'border-mint' : ''}`}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-mute mb-2">
            dépôt rapide d'URL — choisissez l'action
          </div>
          <div className="flex gap-1.5 mb-2">
            {DROP_MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              const activeCls =
                m.id === 'bloquer'
                  ? 'border-coral/60 bg-coral/15 text-coral'
                  : m.id === 'deref'
                    ? 'border-amber/60 bg-amber/15 text-amber'
                    : 'border-sky/60 bg-sky/15 text-sky';
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer ${
                    active ? activeCls : 'border-line text-mute'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {m.label}
                </button>
              );
            })}
          </div>
          <div className={`flex items-center gap-2 border px-2.5 h-9 ${err ? 'border-coral anim-shake' : 'border-line'}`}>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(val)}
              placeholder="https://page-suspecte.com/…"
              className={inputCls}
              aria-label="Déposer une URL suspecte"
            />
            <button
              onClick={() => submit(val)}
              className={`font-mono text-[9.5px] uppercase tracking-wider border px-2 py-0.5 cursor-pointer shrink-0 ${modeBtnCls[mode]}`}
            >
              {mode === 'bloquer' ? 'bloquer' : mode === 'deref' ? 'déréf' : 'envoyer'}
            </button>
          </div>
          <p className="font-mono text-[9px] text-mute mt-2">
            {mode === 'bloquer'
              ? 'blocage WAF immédiat — visible dans Forensics'
              : mode === 'deref'
                ? 'menace directe dans la file de déréférencement (L2/L3)'
                : 'noyau cognitif : qwen → analyse → décision'}
          </p>
        </div>
      )}
    </>
  );
}

/* ---------------- barre supérieure ---------------- */

function TopBar() {
  const { state } = useStore();
  const shieldOn = state.tokens.some((t) => t.override.shield);
  return (
    <header className="sticky top-0 z-30 h-14 bg-ink-900/85 backdrop-blur-sm border-b border-line flex items-center gap-4 px-4 md:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 grid place-items-center border shrink-0 transition-colors duration-500 ${
          shieldOn ? 'border-coral/60 bg-coral/10 text-coral' : 'border-mint/40 bg-mint/5 text-mint'
        }`}>
          <IcLogo className="w-5 h-5" />
        </span>
        <div className="leading-none min-w-0">
          <div className="font-display font-bold text-lg tracking-[0.18em] text-fog">
            DEREF<span className={shieldOn ? 'text-coral' : 'text-mint'}>SHIELD</span>
          </div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-mute mt-1 truncate">
            protocole stopnet · déréférencement direct
          </div>
        </div>
      </div>
      <UrlDrop />
      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <span className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim">
          <StatusDot tone="mint" pulse /> canal hébergeur · sync
        </span>
        <Badge tone={shieldOn ? 'coral' : 'mute'} className="hidden sm:inline-flex">
          <IcShield className="w-3 h-3" /> {shieldOn ? 'bouclier actif' : 'bouclier veille'}
        </Badge>
        <span className="font-mono text-[12px] text-dim">
          <Clock />
        </span>
        <Badge tone="sky" className="hidden sm:inline-flex">OPS-07</Badge>
      </div>
    </header>
  );
}

/* ---------------- navigation latérale ---------------- */

const NAV: { group: string; items: { id: ViewState; label: string; icon: ComponentType<{ className?: string }> }[] }[] = [
  {
    group: 'Noyau & moteur',
    items: [
      { id: 'overview', label: 'Vue d\u2019ensemble', icon: IcGrid },
      { id: 'cognitif', label: 'OS cognitif', icon: IcChip },
      { id: 'depot', label: 'Dépôt de cibles', icon: IcUpload },
      { id: 'maillage', label: 'Maillage interne', icon: IcGraph },
      { id: 'backlinks', label: 'Maillage externe', icon: IcGlobe },
      { id: 'deref', label: 'Déréférencement', icon: IcGhost },
    ],
  },
  {
    group: 'Protocole',
    items: [
      { id: 'stopnet', label: 'StopNet', icon: IcShield },
      { id: 'hebergeur', label: 'Hébergeurs', icon: IcServer },
    ],
  },
  {
    group: 'Sécurité',
    items: [
      { id: 'forensics', label: 'Forensics', icon: IcRadar },
      { id: 'audit', label: 'Audit & chaîne', icon: IcLock },
    ],
  },
];

function SideNav() {
  const { state, api } = useStore();
  const orph = orphelines(state.pages, state.suggestions).length;
  const cands = state.pages.filter((p) => p.status === 'candidate' && !p.applied).length;
  const ordres = state.tokens.filter((t) => t.status !== 'confirme').length;
  const alertes = state.alerts.filter((a) => !a.resolved).length;
  const depot = state.intake.filter((it) => it.status === 'attente' || it.status === 'ingeree').length;
  const badge: Partial<Record<ViewState, { n: number; tone: 'amber' | 'coral' | 'sky' }>> = {
    depot: { n: depot, tone: 'sky' },
    maillage: { n: orph, tone: 'amber' },
    deref: { n: cands, tone: 'coral' },
    stopnet: { n: ordres, tone: 'sky' },
    forensics: { n: alertes, tone: 'coral' },
  };

  return (
    <aside className="w-14 lg:w-56 shrink-0 border-r border-line-soft bg-ink-900/50 backdrop-blur-sm sticky top-14 h-[calc(100vh-3.5rem)] hidden sm:flex flex-col">
      <nav className="flex-1 p-2 lg:p-3 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group} className="mb-3">
            <div className="hidden lg:block font-mono text-[8.5px] uppercase tracking-[0.24em] text-mute px-3 pt-2 pb-1.5">
              {g.group}
            </div>
            <div className="space-y-1">
              {g.items.map((item) => {
                const active = state.view === item.id;
                const b = badge[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => api.nav(item.id)}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-2.5 lg:px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-wider border-l-2 transition-all duration-200 cursor-pointer ${
                      active
                        ? 'border-mint bg-ink-800 text-fog'
                        : 'border-transparent text-mute hover:text-dim hover:bg-ink-850'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-mint' : ''}`} />
                    <span className="hidden lg:inline flex-1 text-left">{item.label}</span>
                    {b && b.n > 0 && (
                      <span className={`hidden lg:inline-grid place-items-center min-w-[18px] h-[18px] px-1 border font-mono text-[9.5px] tabular ${
                        b.tone === 'coral' ? 'bg-coral/15 text-coral border-coral/40'
                          : b.tone === 'sky' ? 'bg-sky/15 text-sky border-sky/40'
                          : 'bg-amber/15 text-amber border-amber/40'
                      }`}>
                        {b.n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-line-soft hidden lg:block">
        <div className="bg-ink-850 border border-line-soft p-3">
          <div className="flex items-center gap-2 text-mint">
            <IcLock className="w-3.5 h-3.5" />
            <span className="font-mono text-[9.5px] uppercase tracking-wider">session chiffrée</span>
          </div>
          <p className="font-mono text-[9px] text-mute mt-1.5 leading-relaxed">
            AES-256-GCM · Ed25519<br />aucun appel GAFAM
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- navigation mobile ---------------- */

function MobileNav() {
  const { state, api } = useStore();
  const all = NAV.flatMap((g) => g.items);
  return (
    <nav className="sm:hidden sticky top-14 z-20 bg-ink-900/90 backdrop-blur-sm border-b border-line-soft flex overflow-x-auto">
      {all.map((item) => {
        const active = state.view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => api.nav(item.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              active ? 'border-mint text-mint' : 'border-transparent text-mute'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- toasts ---------------- */

const TOAST_STYLE: Record<ToastKind, { border: string; text: string; icon: ComponentType<{ className?: string }> }> = {
  ok: { border: 'border-mint/50', text: 'text-mint', icon: IcCheck },
  warn: { border: 'border-amber/50', text: 'text-amber', icon: IcAlert },
  crit: { border: 'border-coral/50', text: 'text-coral', icon: IcX },
  info: { border: 'border-sky/50', text: 'text-sky', icon: IcBolt },
};

function Toasts() {
  const { state, api } = useStore();
  return (
    <div className="fixed bottom-10 right-4 z-50 w-[min(340px,calc(100vw-2rem))] space-y-2">
      {state.toasts.map((t) => {
        const s = TOAST_STYLE[t.kind];
        const Icon = s.icon;
        return (
          <div key={t.id} className={`anim-toast panel border ${s.border} p-3 flex items-start gap-2.5 shadow-2xl`}>
            <Icon className={`w-4 h-4 ${s.text} shrink-0 mt-0.5`} />
            <p className="text-[12px] text-dim leading-snug flex-1">{t.text}</p>
            <button
              onClick={() => api.dismissToast(t.id)}
              className="text-mute hover:text-fog transition-colors cursor-pointer shrink-0"
              aria-label="Fermer la notification"
            >
              <IcX className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- barre d'état ---------------- */

function StatusBar() {
  const { state } = useStore();
  const shieldOn = state.tokens.some((t) => t.override.shield);
  return (
    <footer className="fixed bottom-0 inset-x-0 z-30 h-8 bg-ink-900/92 backdrop-blur-sm border-t border-line flex items-center gap-4 px-4 font-mono text-[9.5px] uppercase tracking-wider text-mute">
      <span className="hidden md:inline">DEREFSHIELD v3.0.0 · protocole StopNet</span>
      <span className="text-mint/80 hidden sm:inline">canal direct — 0 API moteur</span>
      <span className="tabular">latence {state.latency} ms</span>
      <span className={`hidden sm:inline ${shieldOn ? 'text-coral' : 'text-mute'}`}>
        bouclier : {shieldOn ? 'actif' : 'veille'}
      </span>
      <span className="tabular text-coral/90 hidden md:inline">menaces 24h : {state.threat}</span>
      <span className="ml-auto flex items-center gap-2">
        <Clock />
        <span className="cursor-blink text-mint text-[11px] leading-none">▌</span>
      </span>
    </footer>
  );
}

/* ---------------- coquille ---------------- */

const VIEWS: Record<ViewState, () => ReactNode> = {
  overview: () => <Overview />,
  cognitif: () => <Cognitif />,
  depot: () => <Depot />,
  maillage: () => <Maillage />,
  backlinks: () => <Backlinks />,
  deref: () => <Dereferencement />,
  stopnet: () => <StopNet />,
  hebergeur: () => <Hebergeur />,
  forensics: () => <Forensics />,
  audit: () => <Audit />,
};

function Shell() {
  const { state } = useStore();
  return (
    <div className="scanlines vignette relative min-h-screen text-fog font-sans">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 bg-glow-a" />
        <div className="absolute inset-0 bg-glow-b" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBar />
        <MobileNav />
        <div className="flex flex-1">
          <SideNav />
          <main className="flex-1 min-w-0 px-4 md:px-6 xl:px-8 py-6 pb-24">
            <div key={state.view}>{VIEWS[state.view]()}</div>
          </main>
        </div>
      </div>

      <Toasts />
      <StatusBar />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

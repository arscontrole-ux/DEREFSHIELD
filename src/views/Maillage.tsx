import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { Badge, Btn, Meter, Panel, ViewHead } from '../components/ui';
import type { PageNode } from '../lib/data';
import {
  INTERNAL_LINKS,
  decisionLabel,
  decisionTone,
  effectiveInlinks,
  orphelines,
  statusMeta,
} from '../lib/data';
import { IcCross, IcLink, IcRefresh } from '../components/icons';

const FILL: Record<PageNode['status'], string> = {
  indexee: '#3ce6a4',
  candidate: '#f5b02e',
  deref: '#f2554d',
};

export default function Maillage() {
  const { state, api } = useStore();

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    const cx = 400;
    const cy = 268;
    const byDepth = new Map<number, PageNode[]>();
    state.pages
      .filter((p) => p.status !== 'deref')
      .forEach((p) => {
        const arr = byDepth.get(p.depth) ?? [];
        arr.push(p);
        byDepth.set(p.depth, arr);
      });
    byDepth.forEach((nodes, depth) => {
      if (depth === 0) {
        nodes.forEach((n) => m.set(n.id, { x: cx, y: cy }));
        return;
      }
      const r = 78 + depth * 78;
      nodes.forEach((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2 + depth * 0.5;
        m.set(n.id, { x: cx + Math.cos(a) * r * 1.18, y: cy + Math.sin(a) * r * 0.8 });
      });
    });
    state.pages
      .filter((p) => p.status === 'deref')
      .forEach((p, i) => m.set(p.id, { x: 84, y: 372 + i * 42 }));
    return m;
  }, [state.pages]);

  const edges = useMemo(() => {
    const base = INTERNAL_LINKS.map((l) => ({ ...l, extra: false }));
    const extra = state.suggestions
      .filter((s) => s.applied)
      .map((s) => ({ from: s.from, to: s.to, extra: true }));
    return [...base, ...extra].filter((e) => pos.has(e.from) && pos.has(e.to));
  }, [pos, state.suggestions]);

  const orphanSet = useMemo(
    () => new Set(orphelines(state.pages, state.suggestions).map((p) => p.id)),
    [state.pages, state.suggestions]
  );
  const toxicIds = useMemo(
    () => new Set(state.pages.filter((p) => p.toxic || p.status === 'deref').map((p) => p.id)),
    [state.pages]
  );
  const inMap = effectiveInlinks(state.pages, state.suggestions);
  const selected = state.pages.find((p) => p.id === state.selectedPage) ?? null;

  const outCount = (id: string) => edges.filter((e) => e.from === id).length;
  const density = useMemo(() => {
    const n = state.pages.filter((p) => p.status !== 'deref').length;
    return n > 1 ? ((edges.length / (n * (n - 1))) * 100).toFixed(1) : '0';
  }, [edges, state.pages]);
  const avgDepth = useMemo(() => {
    const act = state.pages.filter((p) => p.status !== 'deref');
    return (act.reduce((a, p) => a + p.depth, 0) / (act.length || 1)).toFixed(1);
  }, [state.pages]);
  const derefCount = state.pages.filter((p) => p.status === 'deref').length;

  return (
    <div>
      <ViewHead
        code="04 / TOPOLOGIE"
        title="Maillage interne"
        desc="Graphe des liens extrait du crawl, détection d'orphelines en temps réel et injection de liens contextuels générés par le noyau cognitif — appliqués directement sur l'hébergeur."
        right={
          <Btn ghost onClick={() => api.toast('info', 'Analyse sémantique relancée — 5 suggestions stables, 0 conflit détecté')}>
            <IcRefresh className="w-3.5 h-3.5" /> relancer l'analyse
          </Btn>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Liens actifs', v: String(edges.length), t: 'text-sky' as const },
          { l: 'Orphelines', v: String(orphanSet.size), t: 'text-amber' as const },
          { l: 'Densité du graphe', v: `${density}%`, t: 'text-mint' as const },
          { l: 'Profondeur moyenne', v: avgDepth, t: 'text-fog' as const },
        ].map((s, i) => (
          <div key={s.l} className="panel corners px-4 py-3 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{s.l}</div>
            <div className={`font-display text-2xl font-bold tabular mt-1 ${s.t}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          <Panel title="Graphe des coconnages — extraction crawl" delay={60} bodyClassName="p-2">
            <svg viewBox="0 0 780 560" className="w-full h-auto select-none">
              {[78 + 78, 78 + 156, 78 + 234].map((r, i) => (
                <ellipse
                  key={r}
                  cx="400"
                  cy="268"
                  rx={r * 1.18}
                  ry={r * 0.8}
                  fill="none"
                  stroke="#16303b"
                  strokeWidth="1"
                  strokeDasharray={i === 2 ? '2 6' : '1 5'}
                />
              ))}
              <rect
                x="30"
                y="344"
                width="112"
                height={56 + derefCount * 42}
                fill="rgba(242,85,77,0.04)"
                stroke="#f2554d"
                strokeOpacity="0.35"
                strokeDasharray="3 4"
              />
              <text x="36" y="338" fontSize="8.5" fontFamily="IBM Plex Mono" fill="#f2554d" opacity="0.8" letterSpacing="2">
                QUARANTAINE
              </text>

              {edges.map((e, i) => {
                const a = pos.get(e.from)!;
                const b = pos.get(e.to)!;
                const dead = toxicIds.has(e.to);
                return (
                  <line
                    key={`${e.from}-${e.to}-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={dead ? '#7a3a36' : e.extra ? '#3ce6a4' : '#1f4250'}
                    strokeWidth={e.extra ? 1.4 : 1}
                    strokeOpacity={dead ? 0.55 : e.extra ? 0.85 : 0.9}
                    strokeDasharray={dead ? '2 5' : undefined}
                    className={dead ? undefined : e.extra ? 'edge-extra' : 'edge'}
                  />
                );
              })}

              {state.pages.map((p) => {
                const pt = pos.get(p.id);
                if (!pt) return null;
                const sel = state.selectedPage === p.id;
                const orph = orphanSet.has(p.id);
                const fill = p.toxic && p.status !== 'deref' ? '#f2554d' : FILL[p.status];
                return (
                  <g
                    key={p.id}
                    transform={`translate(${pt.x},${pt.y})`}
                    className="cursor-pointer"
                    onClick={() => api.selectPage(p.id)}
                  >
                    {p.toxic && p.status !== 'deref' && (
                      <circle r={12} fill="none" stroke="#f2554d" strokeWidth="1.2" className="anim-ring" />
                    )}
                    {orph && <circle r={12} fill="none" stroke="#f5b02e" strokeWidth="1.2" className="anim-ring" />}
                    {sel && <circle r={15} fill="none" stroke={fill} strokeOpacity="0.45" />}
                    <circle
                      r={sel ? 8 : p.depth === 0 ? 9 : 6}
                      fill={fill}
                      fillOpacity={p.status === 'indexee' ? 0.92 : 1}
                      stroke="#0a141a"
                      strokeWidth="1.6"
                      className="transition-all duration-300"
                    />
                    <text
                      y={sel ? 27 : 21}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="IBM Plex Mono"
                      fill={sel ? '#d9e7ec' : '#5e7a85'}
                    >
                      {p.slug === '/' ? 'accueil' : p.slug.replace(/^\//, '').split('/').pop()}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-mint inline-block rounded-full" /> indexée</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber inline-block rounded-full" /> candidate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-coral inline-block rounded-full" /> neutralisée</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 border border-amber inline-block rounded-full" /> orpheline</span>
              <span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-mint inline-block" /> lien injecté</span>
            </div>
          </Panel>

          <Panel
            title="Suggestions de maillage — noyau cognitif"
            delay={120}
            bodyClassName="p-0"
            right={<Badge tone="mint">similarité cosinus ≥ 0.75</Badge>}
          >
            <ul className="divide-y divide-line-soft">
              {state.suggestions.map((s) => {
                const from = state.pages.find((p) => p.id === s.from);
                const to = state.pages.find((p) => p.id === s.to);
                return (
                  <li key={s.id} className="px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-ink-800/60 transition-colors">
                    <IcLink className="w-4 h-4 text-mint shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12px] text-fog">
                        {from?.slug} <span className="text-mute">→</span> {to?.slug}
                        <span className="text-dim"> · ancre « {s.anchor} »</span>
                      </div>
                      <div className="text-[11px] text-mute mt-0.5">{s.reason}</div>
                    </div>
                    <Badge tone="mint">+{s.gain} pts</Badge>
                    {s.applied ? (
                      <Badge tone="sky">injecté</Badge>
                    ) : (
                      <Btn onClick={() => api.injectLink(s.id)}>injecter le lien</Btn>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Inspecteur de nœud" delay={100}>
            {!selected ? (
              <div className="py-8 text-center">
                <IcCross className="w-7 h-7 text-mute mx-auto mb-3" />
                <p className="font-mono text-[11px] uppercase tracking-wider text-mute leading-relaxed">
                  Sélectionnez un nœud du graphe<br />pour inspecter ses connexions
                </p>
              </div>
            ) : (
              <div className="anim-feed">
                <div className="font-mono text-[13px] text-mint break-all">{selected.slug}</div>
                <div className="text-[12px] text-dim mt-0.5">{selected.title}</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge tone={statusMeta[selected.status].tone}>{statusMeta[selected.status].label}</Badge>
                  {orphanSet.has(selected.id) && <Badge tone="amber">orpheline</Badge>}
                  {selected.status === 'candidate' && (
                    <Badge tone={decisionTone[selected.decision]}>
                      {decisionLabel[selected.decision]} · {selected.confidence}%
                    </Badge>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-mute mb-1">
                      <span>Score qualité IA</span>
                      <span className="tabular text-dim">{selected.score}/100</span>
                    </div>
                    <Meter value={selected.score} tone={selected.score < 35 ? 'coral' : selected.score < 70 ? 'amber' : 'mint'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    {[
                      { l: 'entrants', v: inMap.get(selected.id) ?? 0 },
                      { l: 'sortants', v: outCount(selected.id) },
                      { l: 'trafic/sem', v: selected.trafic },
                    ].map((x) => (
                      <div key={x.l} className="bg-ink-800 border border-line-soft py-2">
                        <div className="font-display text-lg font-bold text-fog tabular">{x.v}</div>
                        <div className="text-[9px] uppercase tracking-wider text-mute mt-0.5">{x.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.status === 'candidate' && (
                    <Btn tone="coral" onClick={() => api.nav('deref')}>
                      passer en déréférencement
                    </Btn>
                  )}
                  <Btn ghost onClick={() => api.selectPage(selected.id)}>
                    fermer
                  </Btn>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Sorties du nœud sélectionné" delay={160} bodyClassName="p-3">
            {selected ? (
              <div className="flex flex-wrap gap-1.5">
                {edges
                  .filter((e) => e.from === selected.id)
                  .map((e, i) => {
                    const target = state.pages.find((p) => p.id === e.to);
                    return (
                      <button
                        key={`${e.to}-${i}`}
                        onClick={() => api.selectPage(e.to)}
                        className="font-mono text-[10.5px] px-2 py-1 border border-line text-dim hover:border-mint/60 hover:text-mint transition-colors cursor-pointer"
                      >
                        {target?.slug ?? e.to}
                      </button>
                    );
                  })}
                {outCount(selected.id) === 0 && (
                  <span className="font-mono text-[10.5px] text-mute uppercase tracking-wider">
                    aucun lien sortant — cul-de-sac sémantique
                  </span>
                )}
              </div>
            ) : (
              <p className="font-mono text-[10.5px] text-mute uppercase tracking-wider py-2">
                en attente de sélection…
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

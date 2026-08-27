import { useStore } from '../lib/store';
import { Badge, Btn, Meter, Panel, Stat, ViewHead } from '../components/ui';
import { SHORT_COMP, decisionLabel, decisionTone, effectiveInlinks, levelTone, riskLabel, riskTone, wave } from '../lib/data';
import { IcArrow, IcShield, IcUpload } from '../components/icons';

export default function Overview() {
  const { state, api } = useStore();
  const deref = state.pages.filter((p) => p.status === 'deref');
  const indexees = state.pages.filter((p) => p.status === 'indexee');
  const cands = state.pages.filter((p) => p.status === 'candidate' && !p.applied);
  const menaces = cands.filter((p) => p.toxic);
  const avgConf = cands.length ? Math.round(cands.reduce((a, c) => a + c.confidence, 0) / cands.length) : 0;
  const decisions = state.audit.filter((a) => a.actor === 'IA-COG').slice(0, 5);
  const risky = [...cands].sort((a, b) => a.score - b.score).slice(0, 5);
  const ordresActifs = state.tokens.filter((t) => t.status !== 'confirme').length;
  const shields = state.tokens.filter((t) => t.override.shield).length;
  const inl = effectiveInlinks(state.pages, state.suggestions);
  const orph = state.pages.filter((p) => p.status !== 'deref' && (inl.get(p.id) ?? 0) === 0).length;

  const layers = [
    {
      code: 'L·IA',
      title: 'Couche IA cognitive — OS à 7 organes',
      tone: 'text-mint' as const,
      chips: ['superviseur qwen', 'llm-1 llama', 'llm-2 deepseek', 'mémoires gemma+ox', 'mem0 ×2', 'API unique'],
      live: `confiance ${avgConf} % · ${menaces.length} menace(s) scorée(s)`,
    },
    {
      code: 'L·SEO',
      title: 'Couche moteur SEO',
      tone: 'text-sky' as const,
      chips: ['crawler autonome', 'maillage interne', 'maillage externe', 'robots · sitemap · meta'],
      live: `${state.pages.length} pages · ${state.crawl.queue} en file`,
    },
    {
      code: 'L·DEP',
      title: 'Couche déploiement direct',
      tone: 'text-amber' as const,
      chips: ['API cPanel', 'API Plesk', 'DirectAdmin', 'SFTP/SSH', 'Cloudflare', 'OVH'],
      live: `${state.hosts.filter((h) => h.status === 'en-ligne').length}/6 connecteurs · ${state.latency} ms`,
    },
    {
      code: 'L·SEC',
      title: 'Couche cybersécurité',
      tone: 'text-coral' as const,
      chips: ['mTLS', 'ordres signés Ed25519', 'WAF · RBAC', 'audit chaîné SHA-256'],
      live: `${state.threat} menaces bloquées · chaîne intègre`,
    },
  ];

  return (
    <div>
      <ViewHead
        code="01 / SUPERVISION"
        title="Protection active du réseau"
        desc="Le système n'attend pas les moteurs de recherche : il analyse, décide et neutralise à la source — chez l'hébergeur, sur le DNS, le CDN et le maillage. Déposez une URL en haut de l'écran pour lancer le cycle."
        right={
          <div className="flex items-center gap-2">
            <Badge tone={shields > 0 ? 'coral' : 'mint'}>
              <IcShield className="w-3 h-3" /> {shields > 0 ? 'bouclier actif' : 'bouclier en veille'}
            </Badge>
            <Btn ghost onClick={() => api.nav('depot')}>
              <IcUpload className="w-3.5 h-3.5" /> déposer une cible
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Pages suivies" value={state.pages.length} sub={`${indexees.length} indexées`} tone="sky" spark={wave(state.tick, 1)} />
        <Stat label="Menaces actives" value={menaces.length} sub="à neutraliser" tone="coral" spark={wave(state.tick, 2)} delay={40} />
        <Stat label="Ordres StopNet" value={ordresActifs} sub={`${state.tokens.length} émis au total`} tone="amber" spark={wave(state.tick, 3)} delay={80} />
        <Stat label="Orphelines" value={orph} sub="liens internes à renforcer" tone="amber" spark={wave(state.tick, 4)} delay={120} />
        <Stat label="Confiance IA" value={`${avgConf}%`} sub="seuil d'auto-décision 85%" tone="mint" spark={wave(state.tick, 5)} delay={160} />
        <Stat label="Latence canal" value={state.latency} sub="ms · API REST hébergeur" tone="sky" spark={wave(state.tick, 6)} delay={200} />
      </div>

      {/* -------- noyau cognitif -------- */}
      <Panel
        title="Noyau cognitif — 7 organes, 1 API"
        className="mt-5"
        delay={60}
        right={
          <button onClick={() => api.nav('cognitif')} className="font-mono text-[10px] uppercase tracking-wider text-mint hover:text-fog transition-colors cursor-pointer flex items-center gap-1">
            ouvrir le circuit <IcArrow className="w-3 h-3" />
          </button>
        }
        bodyClassName="p-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {state.components.map((c) => (
            <div key={c.id} className="border border-line-soft bg-ink-850/60 p-2.5 hover:border-mute transition-colors">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-medium text-fog tracking-wider">{SHORT_COMP[c.id]}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'actif' ? 'bg-mint dot-live' : 'bg-amber'}`} />
              </div>
              <div className="font-mono text-[8.5px] text-mute truncate mt-0.5">{c.model}</div>
              <div className="mt-2">
                <Meter value={c.load} tone={c.load > 80 ? 'coral' : c.load > 55 ? 'amber' : 'mint'} />
                <div className="font-mono text-[8.5px] text-dim mt-1 tabular">{c.load}% · {c.latency} ms</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* -------- pile protocolaire -------- */}
      <Panel
        title="Pile protocolaire DerefShield — flux de décision descendant"
        className="mt-5"
        delay={90}
        right={<Badge tone="mute">exécution de haut en bas</Badge>}
        bodyClassName="p-4 md:p-5"
      >
        <div className="grid gap-0">
          {layers.map((l, i) => (
            <div key={l.code} className="flex gap-4">
              <div className="flex flex-col items-center w-5 shrink-0">
                <span className={`w-2.5 h-2.5 border ${l.tone.replace('text-', 'border-')} ${i === 0 ? 'dot-live' : ''}`} />
                {i < layers.length - 1 && (
                  <span className="w-px flex-1 bg-gradient-to-b from-line to-transparent relative overflow-hidden my-1">
                    <span className="absolute left-0 top-0 w-px h-3 bg-mint/80 animate-[dashFlow_2.4s_linear_infinite]" />
                  </span>
                )}
              </div>
              <div className="flex-1 pb-5 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={`font-mono text-[10px] tracking-[0.2em] ${l.tone}`}>{l.code}</span>
                  <span className="font-display font-bold text-[15px] text-fog">{l.title}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {l.chips.map((c) => (
                    <span key={c} className="font-mono text-[9.5px] uppercase tracking-wider text-dim border border-line-soft bg-ink-850/70 px-2 py-0.5">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="font-mono text-[10px] text-mute mt-1.5 tabular">{l.live}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        {/* -------- flux de crawl -------- */}
        <Panel
          title="Flux de crawl — direct hébergeur"
          delay={120}
          bodyClassName="p-0"
          right={<Badge tone="mint">live</Badge>}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] uppercase tracking-wider text-mute">
              <span>progression du passage</span>
              <span className="tabular text-dim">{state.crawl.pct}% · {state.crawl.queue} URLs</span>
            </div>
            <Meter value={state.crawl.pct} tone="sky" className="h-1.5" />
          </div>
          <ul className="divide-y divide-line-soft max-h-[300px] overflow-y-auto">
            {state.feed.map((f, i) => (
              <li key={f.id} className={`px-4 py-2 flex gap-2.5 items-baseline ${i === 0 ? 'anim-feed bg-ink-800/50' : ''}`}>
                <span className="font-mono text-[9.5px] text-mute tabular shrink-0">{f.time}</span>
                <Badge tone={f.kind === 'sec' ? 'coral' : f.kind === 'canal' ? 'mint' : f.kind === 'ia' ? 'sky' : 'mute'} className="shrink-0">
                  {f.kind}
                </Badge>
                <span className="text-[11px] text-dim truncate">{f.text}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* -------- décisions IA -------- */}
        <Panel title="Décisions du noyau" delay={150} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {decisions.map((d) => (
              <li key={d.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={levelTone[d.level]}>{d.level}</Badge>
                  <span className="font-mono text-[9.5px] text-mute tabular">{d.time}</span>
                </div>
                <p className="text-[11px] text-dim mt-1.5 leading-snug">{d.message}</p>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2.5 border-t border-line-soft">
            <Btn ghost onClick={() => api.nav('audit')} className="w-full">
              journal chaîné complet <IcArrow className="w-3.5 h-3.5" />
            </Btn>
          </div>
        </Panel>

        {/* -------- pages à risque -------- */}
        <Panel title="Pages à risque — à traiter" delay={180} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {risky.map((p) => (
              <li key={p.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-fog truncate">{p.slug}</span>
                  <Badge tone={riskTone[p.risk]}>{riskLabel[p.risk]}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Meter value={100 - p.score} tone={p.toxic ? 'coral' : 'amber'} className="h-1 flex-1" />
                  <span className="font-mono text-[9.5px] text-mute tabular">{p.score}/100</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge tone={decisionTone[p.decision]}>{decisionLabel[p.decision]}</Badge>
                  <Btn ghost onClick={() => { api.selectPage(p.id); api.nav('deref'); }} className="py-0.5 px-2">
                    traiter
                  </Btn>
                </div>
              </li>
            ))}
            {risky.length === 0 && (
              <li className="px-4 py-8 text-center font-mono text-[10.5px] uppercase tracking-wider text-mute">
                aucune page à risque en file
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

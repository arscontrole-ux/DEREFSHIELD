import { useStore } from '../lib/store';
import { Badge, Btn, Meter, Panel, ViewHead } from '../components/ui';
import { IcArrow, IcBolt, IcCheck, IcLock, IcRadar, IcShield, IcX } from '../components/icons';
import type { VictimAlert } from '../lib/data';

const KIND_META: Record<VictimAlert['kind'], { label: string; tone: 'sky' | 'coral' | 'amber'; icon: typeof IcArrow }> = {
  redirect: { label: 'redirect 302', tone: 'sky', icon: IcArrow },
  blocage: { label: 'blocage WAF', tone: 'coral', icon: IcX },
  bookmark: { label: 'alerte marque-page', tone: 'amber', icon: IcBolt },
};

export default function Forensics() {
  const { state, api } = useStore();

  const capturables = state.pages.filter(
    (p) => p.toxic && !state.evidences.some((e) => e.target === p.slug)
  );
  const activeAlerts = state.alerts.filter((a) => !a.resolved);
  const redirects = state.alerts.filter((a) => a.kind === 'redirect').length;
  const blocks = state.alerts.filter((a) => a.kind === 'blocage').length;

  return (
    <div>
      <ViewHead
        code="09 / PREUVES"
        title="Forensics & protection des visiteurs"
        desc="Chaque menace est figée avant neutralisation : HTML hashé, headers capturés, certificat TLS fingerprinté, screenshot headless. Les visiteurs, eux, ne voient jamais la page toxique — redirection sûre, blocage edge ou alerte en temps réel."
        right={<Badge tone="mint">{state.evidences.length} preuves ancrées</Badge>}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Preuves capturées', v: String(state.evidences.length), t: 'text-fog' as const },
          { l: 'Redirections sûres', v: String(redirects), t: 'text-sky' as const },
          { l: 'Blocages WAF', v: String(blocks), t: 'text-coral' as const },
          { l: 'Alertes en cours', v: String(activeAlerts.length), t: 'text-amber' as const },
        ].map((k, i) => (
          <div key={k.l} className="panel corners px-4 py-3 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{k.l}</div>
            <div className={`font-display text-2xl font-bold tabular mt-1 ${k.t}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          <Panel
            title="Coffre-fort forensics"
            delay={60}
            bodyClassName="p-0"
            right={<Badge tone="mute">AES-256-GCM au repos</Badge>}
          >
            <ul className="divide-y divide-line-soft">
              {state.evidences.map((ev) => (
                <li key={ev.id} className="p-4 anim-feed">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 shrink-0 grid place-items-center border border-coral/40 bg-coral/10 text-coral">
                        <IcRadar className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-[12.5px] text-fog truncate">{ev.target}</div>
                        <div className="font-mono text-[9.5px] text-mute">
                          capturée à {ev.at} · {ev.size}
                          {ev.tokenId && <> · ordre {ev.tokenId}</>}
                        </div>
                      </div>
                    </div>
                    {ev.shot ? <Badge tone="mint">screenshot headless</Badge> : <Badge tone="mute">headers seuls</Badge>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-ink-950 border border-line-soft p-2.5">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-mute mb-1">HTML — SHA-256</div>
                      <div className="font-mono text-[10px] text-mint break-all">{ev.htmlHash}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-mute mb-1 mt-2.5">Certificat TLS — empreinte</div>
                      <div className="font-mono text-[10px] text-sky break-all">{ev.tlsFp}</div>
                    </div>
                    <div className="bg-ink-950 border border-line-soft p-2.5">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-mute mb-1">Headers capturés</div>
                      <pre className="font-mono text-[10px] text-dim leading-relaxed whitespace-pre-wrap">
                        {ev.headers.join('\n')}
                      </pre>
                    </div>
                  </div>
                </li>
              ))}
              {state.evidences.length === 0 && (
                <li className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-wider text-mute">
                  aucune preuve au coffre
                </li>
              )}
            </ul>
          </Panel>

          <Panel
            title="Captures à effectuer — menaces sans preuve"
            delay={120}
            bodyClassName="p-0"
            right={<Badge tone={capturables.length ? 'amber' : 'mint'}>{capturables.length} en attente</Badge>}
          >
            {capturables.length ? (
              <ul className="divide-y divide-line-soft">
                {capturables.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                    <IcLock className="w-4 h-4 text-amber shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12px] text-fog truncate">{p.slug}</div>
                      <div className="text-[11px] text-mute">{p.title}</div>
                    </div>
                    <Btn ghost tone="amber" onClick={() => api.captureEvidence(p.id)}>
                      <IcRadar className="w-3.5 h-3.5" /> capturer la preuve
                    </Btn>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-mint">
                toutes les menaces actives sont prouvées et ancrées au journal
              </p>
            )}
          </Panel>

          <Panel
            title="Registre des blocages actifs"
            delay={150}
            bodyClassName="p-0"
            right={<Badge tone={state.blocks.length ? 'coral' : 'mint'}>{state.blocks.length} règle(s)</Badge>}
          >
            {state.blocks.length ? (
              <ul className="divide-y divide-line-soft">
                {state.blocks.map((b) => (
                  <li key={b.id} className="px-4 py-2.5 flex flex-wrap items-center gap-3 anim-feed">
                    <span className="w-6 h-6 grid place-items-center border border-coral/40 bg-coral/10 text-coral shrink-0">
                      <IcX className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11.5px] text-fog truncate">{b.url}</div>
                      <div className="font-mono text-[9.5px] text-mute">
                        {b.scope} · {b.at} · {b.source}
                      </div>
                    </div>
                    <Badge tone="coral">bloqué</Badge>
                    <Btn ghost onClick={() => api.removeBlock(b.id)} className="py-1">
                      lever
                    </Btn>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-mute">
                aucun blocage actif — déposez une URL en mode « bloquer »
              </p>
            )}
            <p className="px-4 py-3 border-t border-line-soft font-mono text-[10px] text-mute uppercase tracking-wider">
              règles poussées sur l'hébergeur (WAF / edge CDN) — levée immédiate possible
            </p>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel
            title="Alertes visiteurs — temps réel"
            delay={100}
            bodyClassName="p-0"
            right={<Badge tone={activeAlerts.length ? 'amber' : 'mint'}>{activeAlerts.length} actives</Badge>}
          >
            <ul className="divide-y divide-line-soft max-h-[430px] overflow-y-auto">
              {state.alerts.map((al) => {
                const K = KIND_META[al.kind];
                const Icon = K.icon;
                return (
                  <li key={al.id} className={`px-4 py-3 ${al.resolved ? 'opacity-45' : 'anim-feed'}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`w-7 h-7 shrink-0 grid place-items-center border ${
                        K.tone === 'coral' ? 'border-coral/40 text-coral bg-coral/10'
                          : K.tone === 'sky' ? 'border-sky/40 text-sky bg-sky/10'
                          : 'border-amber/40 text-amber bg-amber/10'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11.5px] text-fog">{al.who}</span>
                          <span className="font-mono text-[9.5px] text-mute tabular">{al.time}</span>
                        </div>
                        <div className="text-[11px] text-dim mt-0.5 leading-snug">
                          tentait d'atteindre <span className="font-mono text-coral/90">{al.target}</span>
                        </div>
                        <div className="font-mono text-[10px] text-mute mt-0.5">{al.action}</div>
                      </div>
                    </div>
                    <div className="mt-2 pl-[38px]">
                      {al.resolved ? (
                        <Badge tone="mint">
                          <IcCheck className="w-3 h-3" /> traitée
                        </Badge>
                      ) : (
                        <Btn ghost onClick={() => api.resolveAlert(al.id)} className="py-1">
                          marquer traitée
                        </Btn>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Posture de protection" delay={160}>
            <ul className="space-y-3">
              <li>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-dim">Taux de redirection sûre</span>
                  <span className="font-mono tabular text-mint">100 %</span>
                </div>
                <Meter value={100} tone="mint" />
              </li>
              <li className="flex items-center justify-between text-[12px]">
                <span className="text-dim flex items-center gap-2">
                  <IcShield className="w-3.5 h-3.5 text-mute" /> Page de sécurité servie
                </span>
                <span className="font-mono text-[10.5px] text-fog">/securite (302)</span>
              </li>
              <li className="flex items-center justify-between text-[12px]">
                <span className="text-dim flex items-center gap-2">
                  <IcBolt className="w-3.5 h-3.5 text-mute" /> Notification push navigateurs
                </span>
                <span className="font-mono text-[10.5px] text-fog">active</span>
              </li>
              <li className="flex items-center justify-between text-[12px]">
                <span className="text-dim flex items-center gap-2">
                  <IcX className="w-3.5 h-3.5 text-mute" /> IPs hostiles bloquées (24 h)
                </span>
                <span className="font-mono text-[10.5px] text-coral tabular">{state.threat}</span>
              </li>
            </ul>
            <p className="font-mono text-[9.5px] text-mute uppercase tracking-wider mt-4 leading-relaxed">
              le visiteur n'atteint jamais la page toxique — le réseau répond avant l'origine
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

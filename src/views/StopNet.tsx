import { useStore } from '../lib/store';
import { Badge, Btn, Meter, Panel, ViewHead } from '../components/ui';
import { LEVEL_META, SHIELD_HOST, TOKEN_STATUS, riskLabel, riskTone, stopTokenJson } from '../lib/data';
import { IcAlert, IcBolt, IcCheck, IcLock, IcShield, IcUpload, IcX } from '../components/icons';

function ShieldPreview({ domain }: { domain: string }) {
  return (
    <div className="border border-coral/40 bg-ink-950 anim-feed">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-line-soft bg-ink-850">
        <span className="w-2 h-2 rounded-full bg-coral/70" />
        <span className="w-2 h-2 rounded-full bg-amber/70" />
        <span className="w-2 h-2 rounded-full bg-mint/70" />
        <span className="font-mono text-[9px] text-mute truncate ml-1.5">
          https://{domain} — intercepté par le bouclier
        </span>
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2 text-coral">
          <IcShield className="w-4 h-4" />
          <span className="font-display font-bold text-[13px] tracking-wide">HTTP 410 — Gone</span>
        </div>
        <p className="text-[11px] text-dim leading-relaxed mt-2">
          Cette page a été neutralisée par le réseau. Elle ne sera plus servie, ni archivée.
        </p>
        <div className="font-mono text-[9px] text-mute mt-2.5 space-y-0.5">
          <div><span className="text-mute">X-Robots-Tag:</span> <span className="text-coral">noindex, nofollow, noarchive</span></div>
          <div><span className="text-mute">Cache-Control:</span> <span className="text-coral">no-store</span></div>
        </div>
      </div>
    </div>
  );
}

export default function StopNet() {
  const { state, api } = useStore();
  const sel = state.tokens.find((t) => t.id === state.selectedToken) ?? state.tokens[0] ?? null;
  const selHost = sel ? state.hosts.find((h) => h.id === sel.hostId) : null;

  const actifs = state.tokens.filter((t) => t.status !== 'confirme').length;
  const shields = state.tokens.filter((t) => t.override.shield).length;
  const victimes = state.alerts.filter((a) => !a.resolved).length;
  const purging = state.cdnLeft != null;

  const shieldDomain = sel && sel.override.shield ? sel.targetSlug.replace(/^\//, '').split('/')[0] + '.example' : null;

  return (
    <div>
      <ViewHead
        code="07 / PROTOCOLE"
        title="Protocole StopNet"
        desc="Ordres de déréférencement signés Ed25519, poussés directement aux hébergeurs. Si un hôte viole le contrat (410, purge < 60 s, preuve SHA-256), le réseau prend le relais : override DNS/CDN vers le Bouclier, registre public TXT, redirection sûre des visiteurs."
        right={
          <div className="flex items-center gap-2">
            <Badge tone={shields > 0 ? 'coral' : 'mute'}>
              <IcShield className="w-3 h-3" /> bouclier : {shields > 0 ? `${shields} actif(s)` : 'en veille'}
            </Badge>
            <Badge tone={purging ? 'amber' : 'mint'}>
              {purging ? `purge CDN · ${state.cdnLeft} s` : 'edges synchrones'}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Ordres actifs', v: String(actifs), t: 'text-sky' as const, s: 'en attente de confirmation' },
          { l: 'Overrides bouclier', v: String(shields), t: 'text-coral' as const, s: 'CNAME basculés vers shield' },
          { l: 'Entrées registre TXT', v: String(state.registry.length), t: 'text-fog' as const, s: 'vérifiables par tout le réseau' },
          { l: 'Visiteurs protégés', v: String(state.alerts.length), t: 'text-mint' as const, s: `${victimes} alerte(s) en cours` },
        ].map((k, i) => (
          <div key={k.l} className="panel corners px-4 py-3 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{k.l}</div>
            <div className={`font-display text-2xl font-bold tabular mt-1 ${k.t}`}>{k.v}</div>
            <div className="text-[11px] text-dim mt-0.5">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          {state.tokens.map((tok, ti) => {
            const host = state.hosts.find((h) => h.id === tok.hostId);
            const L = LEVEL_META[tok.level];
            const isSel = sel?.id === tok.id;
            return (
              <Panel
                key={tok.id}
                delay={Math.min(ti, 4) * 60}
                bodyClassName="p-4"
                title={`ordre ${tok.id}`}
                right={
                  <div className="flex items-center gap-1.5">
                    <Badge tone={riskTone[tok.risk]}>{riskLabel[tok.risk]}</Badge>
                    <Badge tone={L.tone}>{L.label}</Badge>
                    <Badge tone={TOKEN_STATUS[tok.status].tone}>{TOKEN_STATUS[tok.status].label}</Badge>
                  </div>
                }
              >
                <button
                  onClick={() => api.selectToken(tok.id)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono text-[13px] text-fog break-all">{tok.targetSlug}</span>
                    <span className="font-mono text-[10px] text-mute">→ hôte {host?.panel ?? tok.hostId}</span>
                    <span className="font-mono text-[10px] text-mute tabular">émis à {tok.createdAt}</span>
                  </div>
                </button>

                <div className="mt-3">
                  <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-mute mb-1">
                    <span>vérification du contrat hébergeur</span>
                    <span className="tabular text-dim">{tok.progress}%</span>
                  </div>
                  <Meter value={tok.progress} tone={tok.status === 'ignore' ? 'coral' : tok.status === 'confirme' ? 'mint' : 'amber'} className="h-1.5" />
                </div>

                {isSel && (
                  <div className="mt-4 anim-feed">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mute mb-2">
                          clauses du contrat
                        </div>
                        <ul className="space-y-2">
                          {tok.contract.map((c) => (
                            <li key={c.id} className="flex items-start gap-2.5">
                              {c.ok === null ? (
                                <span className="w-4 h-4 grid place-items-center border border-line text-mute mt-0.5">…</span>
                              ) : c.ok ? (
                                <span className="w-4 h-4 grid place-items-center border border-mint/50 text-mint mt-0.5">
                                  <IcCheck className="w-2.5 h-2.5" />
                                </span>
                              ) : (
                                <span className="w-4 h-4 grid place-items-center border border-coral/50 text-coral mt-0.5">
                                  <IcX className="w-2.5 h-2.5" />
                                </span>
                              )}
                              <div>
                                <div className={`text-[11.5px] ${c.ok ? 'text-fog' : 'text-dim'}`}>{c.rule}</div>
                                <div className="font-mono text-[9px] text-mute">{c.detail}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mute mb-2">
                          jeton signé (payload)
                        </div>
                        <pre className="font-mono text-[9px] leading-relaxed text-dim bg-ink-950 border border-line-soft p-2.5 overflow-auto max-h-[180px] whitespace-pre">
                          {stopTokenJson(tok)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3.5">
                  {tok.status === 'ignore' && !tok.override.shield && (
                    <Btn tone="coral" onClick={() => api.overrideShield(tok.id)}>
                      <IcShield className="w-3.5 h-3.5" /> override → bouclier
                    </Btn>
                  )}
                  {tok.override.shield && (
                    <Badge tone="coral" className="py-1">
                      <IcShield className="w-3 h-3" /> trafic intercepté par le bouclier
                    </Badge>
                  )}
                  {tok.level === 'L3' && (
                    <Btn ghost onClick={() => api.sendSignals(tok.id)}>
                      <IcBolt className="w-3.5 h-3.5" /> webhook nofollow réseau
                      {tok.signalsSent > 0 && <span className="text-mint tabular">· {tok.signalsSent} signaux</span>}
                    </Btn>
                  )}
                  {tok.status === 'confirme' && (
                    <span className="font-mono text-[10px] text-mute uppercase tracking-wider">
                      preuve : {tok.evidenceHash.slice(0, 23)}…
                    </span>
                  )}
                  {!isSel && (
                    <Btn ghost onClick={() => api.selectToken(tok.id)} className="ml-auto">
                      inspecter
                    </Btn>
                  )}
                </div>
              </Panel>
            );
          })}

          {state.tokens.length === 0 && (
            <Panel title="aucun ordre émis" bodyClassName="p-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-mute text-center">
                émettez un ordre depuis la file de déréférencement
              </p>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Bouclier — aperçu en direct" delay={100}>
            {shieldDomain ? (
              <div>
                <ShieldPreview domain={shieldDomain} />
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-dim flex items-center gap-2"><IcLock className="w-3 h-3 text-mute" /> Override DNS</span>
                    <Badge tone="coral">CNAME actif</Badge>
                  </div>
                  <div className="font-mono text-[9.5px] text-mute bg-ink-950 border border-line-soft p-2">
                    {shieldDomain} <span className="text-coral">→</span> {SHIELD_HOST}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <IcAlert className="w-6 h-6 text-mute mx-auto mb-2" />
                <p className="text-[11.5px] text-dim leading-relaxed px-2">
                  Le bouclier s'arme automatiquement quand un hébergeur ignore un ordre signé : le trafic est
                  intercepté au niveau DNS/CDN et servi en <span className="font-mono text-coral">410 + noarchive</span>.
                </p>
              </div>
            )}

            <div className="mt-3.5 border-t border-line-soft pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">purge CDN (contrat &lt; 60 s)</span>
                {purging ? (
                  <span className="font-mono text-[11px] text-amber tabular">{state.cdnLeft} s</span>
                ) : (
                  <span className="font-mono text-[11px] text-mint">edges propres</span>
                )}
              </div>
              <Meter value={purging ? ((60 - (state.cdnLeft ?? 0)) / 60) * 100 : 100} tone={purging ? 'amber' : 'mint'} />
              <div className="flex gap-2 mt-2.5">
                <Btn ghost onClick={() => sel && api.purgeCdn(sel.id)} disabled={purging} className="flex-1">
                  <IcUpload className="w-3.5 h-3.5" /> purger les edges
                </Btn>
                <Btn ghost onClick={() => api.nav('forensics')} className="flex-1">
                  alertes visiteurs
                </Btn>
              </div>
            </div>
          </Panel>

          <Panel title="Registre public — DNS TXT" delay={160} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {state.registry.map((r) => (
                <li key={r.id} className="px-4 py-2.5 anim-feed">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-fog truncate">{r.domain}</span>
                    <Badge tone={LEVEL_META[r.level].tone}>{r.level}</Badge>
                  </div>
                  <div className="font-mono text-[10px] text-mint mt-1 break-all">{r.txt}</div>
                  <div className="font-mono text-[9px] text-mute mt-1 tabular">
                    publié {r.since} · {r.checks + (state.tick % 5)} vérifications réseau
                  </div>
                </li>
              ))}
              {state.registry.length === 0 && (
                <li className="px-4 py-8 text-center font-mono text-[10.5px] uppercase tracking-wider text-mute">
                  aucune entrée publiée
                </li>
              )}
            </ul>
            <p className="px-4 py-3 border-t border-line-soft font-mono text-[10px] text-mute uppercase tracking-wider">
              tout site du réseau peut vérifier un lien externe avant de le suivre
            </p>
          </Panel>

          <Panel title="Hôtes impliqués" delay={220} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {state.hosts.slice(0, 4).map((h) => (
                <li key={h.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-fog">{h.panel}</div>
                    <div className="font-mono text-[9px] text-mute">{h.domain}</div>
                  </div>
                  <Badge tone={h.status === 'en-ligne' ? 'mint' : h.status === 'degrade' ? 'amber' : 'coral'}>
                    {h.status}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2.5 border-t border-line-soft">
              <Btn ghost onClick={() => api.nav('hebergeur')} className="w-full">
                tous les connecteurs
              </Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

import { useStore } from '../lib/store';
import { Badge, Btn, Meter, Panel, ViewHead } from '../components/ui';
import { LEVEL_META, TOKEN_STATUS, decisionLabel, riskLabel, riskTone } from '../lib/data';
import { IcCheck, IcGhost, IcLock, IcRadar, IcShield, IcX } from '../components/icons';

export default function Dereferencement() {
  const { state, api } = useStore();
  const queue = state.pages.filter((p) => p.status === 'candidate' && !p.applied);
  const traitees = state.pages.filter((p) => p.status === 'deref');
  const toxicQueue = queue.filter((p) => p.toxic);

  return (
    <div>
      <ViewHead
        code="06 / DÉCISIONS"
        title="File de déréférencement"
        desc="Le noyau cognitif score chaque menace — hameçonnage, faux profil, réseau de spam, page compromise, contenu mort — et recommande un niveau StopNet. L'ordre est signé, poussé à l'hébergeur, puis vérifié ligne par ligne contre le contrat."
        right={<Badge tone={toxicQueue.length ? 'coral' : 'mint'}>{toxicQueue.length} menace(s) prioritaire(s)</Badge>}
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="flex flex-col gap-4 min-w-0">
          {queue.map((p, i) => {
            const L = LEVEL_META[p.level];
            const hasEvidence = state.evidences.some((e) => e.target === p.slug);
            return (
              <Panel
                key={p.id}
                delay={Math.min(i, 5) * 50}
                bodyClassName="p-4"
                title={p.toxic ? 'menace active' : 'candidate au déréférencement'}
                right={
                  <div className="flex items-center gap-1.5">
                    <Badge tone={riskTone[p.risk]}>{riskLabel[p.risk]}</Badge>
                    <Badge tone={L.tone}>{L.label}</Badge>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-6">
                  <div className="min-w-0 flex-1">
                    <div className={`font-mono text-[13px] break-all ${p.toxic ? 'text-coral' : 'text-fog'}`}>{p.slug}</div>
                    <div className="text-[12px] text-dim mt-0.5">{p.title}</div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 font-mono text-[10.5px] text-mute">
                      <span>trafic <span className="text-dim tabular">{p.trafic}/sem</span></span>
                      <span>duplicata <span className="text-dim tabular">{p.duplicate}%</span></span>
                      <span>obsolescence <span className="text-dim tabular">{p.obsolete}%</span></span>
                    </div>
                  </div>
                  <div className="w-44 shrink-0">
                    <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-mute mb-1">
                      <span>score IA</span>
                      <span className="tabular text-dim">{p.score}/100</span>
                    </div>
                    <Meter value={p.score} tone={p.score < 30 ? 'coral' : 'amber'} />
                    <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-mute mb-1 mt-2.5">
                      <span>confiance</span>
                      <span className="tabular text-mint">{p.confidence}%</span>
                    </div>
                    <Meter value={p.confidence} tone="mint" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3.5">
                  <Btn tone={p.toxic ? 'coral' : 'mint'} onClick={() => api.issueToken(p.id)}>
                    <IcShield className="w-3.5 h-3.5" /> émettre l'ordre {p.level}
                  </Btn>
                  {p.toxic && (
                    <Btn ghost tone="amber" onClick={() => api.captureEvidence(p.id)} disabled={hasEvidence}>
                      <IcRadar className="w-3.5 h-3.5" /> {hasEvidence ? 'preuve capturée' : 'capturer forensics'}
                    </Btn>
                  )}
                  {!p.toxic && (
                    <Btn ghost onClick={() => api.keepPage(p.id)}>
                      <IcCheck className="w-3.5 h-3.5" /> conserver
                    </Btn>
                  )}
                  <span className="ml-auto font-mono text-[10px] text-mute uppercase tracking-wider hidden md:inline">
                    action cible : {decisionLabel[p.decision]}
                  </span>
                </div>
              </Panel>
            );
          })}

          {queue.length === 0 && (
            <Panel title="file vide" bodyClassName="p-10">
              <div className="text-center">
                <IcGhost className="w-8 h-8 text-mute mx-auto mb-3" />
                <p className="font-mono text-[11px] uppercase tracking-wider text-mute">
                  aucune candidate — le crawler en injectera au prochain passage
                </p>
              </div>
            </Panel>
          )}

          <Panel title={`Neutralisées — ${traitees.length}`} delay={140} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {traitees.map((p) => {
                const tok = state.tokens.find((t) => t.targetSlug === p.slug);
                return (
                  <li key={p.id} className="px-4 py-2.5 flex flex-wrap items-center gap-3">
                    <span className="w-6 h-6 grid place-items-center border border-coral/40 bg-coral/10 text-coral shrink-0">
                      <IcX className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[12px] text-dim line-through decoration-coral/60">{p.slug}</span>
                      <span className="text-[11px] text-mute ml-2 hidden sm:inline">{p.title}</span>
                    </div>
                    {tok ? (
                      <button
                        onClick={() => {
                          api.selectToken(tok.id);
                          api.nav('stopnet');
                        }}
                        className="font-mono text-[10.5px] text-mint hover:text-fog transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <IcLock className="w-3 h-3" /> {tok.id}
                        <Badge tone={TOKEN_STATUS[tok.status].tone}>{TOKEN_STATUS[tok.status].label}</Badge>
                      </button>
                    ) : (
                      <Badge tone="mute">{decisionLabel[p.decision]}</Badge>
                    )}
                  </li>
                );
              })}
              {traitees.length === 0 && (
                <li className="px-4 py-6 text-center font-mono text-[10.5px] uppercase tracking-wider text-mute">
                  rien de neutralisé pour l'instant
                </li>
              )}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Niveaux du protocole" delay={80}>
            <ul className="space-y-3.5">
              {(['L1', 'L2', 'L3'] as const).map((lv) => {
                const M = LEVEL_META[lv];
                const n = queue.filter((p) => p.level === lv).length;
                return (
                  <li key={lv} className="border border-line-soft p-3 hover:border-line transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={M.tone}>{M.label}</Badge>
                      <span className="font-mono text-[10px] text-mute tabular">{n} en file</span>
                    </div>
                    <p className="text-[11.5px] text-dim mt-2 leading-relaxed">{M.desc}</p>
                    <div className="font-mono text-[9.5px] text-mute mt-1.5">
                      réponse serveur : <span className={M.tone === 'coral' ? 'text-coral' : 'text-amber'}>HTTP {M.status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Contrat hébergeur — règles du jeu" delay={140}>
            <ul className="space-y-2.5 text-[11.5px]">
              {[
                ['Statut 410/403 immédiat', 'dès réception de l\u2019ordre signé'],
                ['Purge cache < 60 s', 'CDN + origine, sans délai manuel'],
                ['Maillage interne retiré', 'ou rel="nofollow" + sortie du sitemap'],
                ['Webhook externe', 'les sites du réseau passent en nofollow'],
                ['Preuve SHA-256', 'hash d\u2019exécution renvoyé et ancré'],
              ].map(([r, d], i) => (
                <li key={r} className="flex gap-2.5">
                  <span className="font-mono text-[10px] text-mint tabular mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="text-fog">{r}</span>
                    <span className="block font-mono text-[9.5px] text-mute">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-mono text-[9.5px] text-mute uppercase tracking-wider mt-4 leading-relaxed border-t border-line-soft pt-3">
              hôte muet ou récalcitrant → le réseau bascule en override : DNS/CDN pointent vers le bouclier
            </p>
          </Panel>

          <Panel title="Derniers ordres émis" delay={200} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {state.tokens.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      api.selectToken(t.id);
                      api.nav('stopnet');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-ink-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-mint">{t.id}</span>
                      <Badge tone={TOKEN_STATUS[t.status].tone}>{TOKEN_STATUS[t.status].label}</Badge>
                    </div>
                    <div className="font-mono text-[10px] text-mute truncate mt-0.5">{t.targetSlug}</div>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

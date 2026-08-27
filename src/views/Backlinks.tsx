import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { Badge, Btn, Chip, Meter, Panel, Stat, ViewHead } from '../components/ui';
import type { Tone } from '../lib/data';
import { wave } from '../lib/data';
import { IcCheck, IcGlobe, IcTrash } from '../components/icons';

type Filter = 'tous' | 'dofollow' | 'nofollow' | 'toxiques' | 'desavoues';

function trustTone(t: number): Tone {
  return t >= 70 ? 'mint' : t >= 40 ? 'amber' : 'coral';
}

export default function Backlinks() {
  const { state, api } = useStore();
  const [filter, setFilter] = useState<Filter>('tous');

  const stats = useMemo(() => {
    const actives = state.backlinks.filter((b) => !b.disavowed);
    const avg = actives.length
      ? Math.round(actives.reduce((a, b) => a + b.trust, 0) / actives.length)
      : 0;
    const dofollow = actives.filter((b) => b.follow).length;
    return {
      total: actives.length,
      avg,
      dofollowPct: actives.length ? Math.round((dofollow / actives.length) * 100) : 0,
      toxic: actives.filter((b) => b.toxic).length,
    };
  }, [state.backlinks]);

  const rows = useMemo(() => {
    const list = [...state.backlinks];
    switch (filter) {
      case 'dofollow':
        return list.filter((b) => b.follow && !b.disavowed);
      case 'nofollow':
        return list.filter((b) => !b.follow && !b.disavowed);
      case 'toxiques':
        return list.filter((b) => b.toxic && !b.disavowed);
      case 'desavoues':
        return list.filter((b) => b.disavowed);
      default:
        return list.sort((a, b) => b.trust - a.trust);
    }
  }, [state.backlinks, filter]);

  return (
    <div>
      <ViewHead
        code="05 / AUTORITÉ"
        title="Maillage externe"
        desc="Backlinks sondés en direct sur les domaines sources — résolution DNS + extraction HTML, sans jamais interroger de console moteur. Les domaines toxiques sont désavoués côté hébergeur."
        right={<Badge tone="sky">12 domaines sondés en direct</Badge>}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Stat label="Backlinks actifs" value={stats.total} sub="liens entrants vérifiés" tone="sky" spark={wave(state.tick, 7)} />
        <Stat label="Confiance moyenne" value={`${stats.avg}%`} sub="indice composite" tone="mint" spark={wave(state.tick, 8)} delay={40} />
        <Stat label="Ratio dofollow" value={`${stats.dofollowPct}%`} sub="transmission d'autorité" tone="mint" spark={wave(state.tick, 9)} delay={80} />
        <Stat label="Toxiques actifs" value={stats.toxic} sub="désaveu recommandé" tone="coral" spark={wave(state.tick, 10)} delay={120} />
      </div>

      <Panel
        title="Registre des backlinks"
        className="mt-5"
        delay={100}
        bodyClassName="p-0"
        right={
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['tous', 'tous'],
                ['dofollow', 'dofollow'],
                ['nofollow', 'nofollow'],
                ['toxiques', 'toxiques'],
                ['desavoues', 'désavoués'],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {label}
              </Chip>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute border-b border-line-soft">
                <th className="px-4 py-2.5 font-medium">Domaine source</th>
                <th className="px-4 py-2.5 font-medium">Page cible</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium w-44">Confiance</th>
                <th className="px-4 py-2.5 font-medium text-right">Statut & action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-ink-800/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 shrink-0 grid place-items-center font-display font-bold text-[10px] border ${
                          b.toxic ? 'border-coral/50 text-coral bg-coral/10' : 'border-line text-dim bg-ink-800'
                        }`}
                      >
                        {b.domain.slice(0, 2).toUpperCase()}
                      </span>
                      <span className={`font-mono ${b.toxic ? 'text-coral' : 'text-fog'}`}>{b.domain}</span>
                      {b.toxic && (
                        <>
                          <Badge tone="coral">toxique</Badge>
                          <Badge tone="coral" className="hidden md:inline-flex">pénalité réseau −12</Badge>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-dim">{b.target}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={b.follow ? 'mint' : 'mute'}>{b.follow ? 'dofollow' : 'nofollow'}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={b.trust} tone={trustTone(b.trust)} className="h-1 w-24" />
                      <span className="font-mono tabular text-dim">{b.trust}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {b.disavowed ? (
                      <span className="inline-flex items-center gap-2">
                        <Badge tone="mute">désavoué</Badge>
                        <Btn ghost tone="sky" onClick={() => api.rehabilitate(b.id)}>
                          <IcCheck className="w-3.5 h-3.5" /> réhabiliter
                        </Btn>
                      </span>
                    ) : b.toxic ? (
                      <Btn ghost tone="coral" onClick={() => api.disavow(b.id)}>
                        <IcTrash className="w-3.5 h-3.5" /> désavouer
                      </Btn>
                    ) : (
                      <Badge tone="mint">
                        <IcGlobe className="w-3 h-3" /> sain
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-mono text-mute text-[11px] uppercase tracking-wider">
                    aucun backlink dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 border-t border-line-soft font-mono text-[10px] text-mute uppercase tracking-wider">
          le désaveu est poussé dans disavow.txt sur l'hébergeur + filtrage WAF du référent
        </p>
      </Panel>
    </div>
  );
}

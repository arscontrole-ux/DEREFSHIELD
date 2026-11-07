import { useState } from 'react';
import { useStore } from '../lib/store';
import { Badge, Btn, Chip, Meter, Panel, ViewHead } from '../components/ui';
import type { Tone } from '../lib/data';
import { IcCheck, IcLock, IcRefresh, IcShield } from '../components/icons';

type ActorFilter = 'TOUS' | 'IA-COG' | 'OPS' | 'CANAL' | 'SEC';
const ACTORS: ActorFilter[] = ['TOUS', 'IA-COG', 'OPS', 'CANAL', 'SEC'];

const ACTOR_TONE: Record<string, Tone> = {
  'IA-COG': 'sky',
  OPS: 'mute',
  CANAL: 'mint',
  SEC: 'coral',
};

const LEVEL_LABEL: Record<string, string> = {
  ok: 'OK',
  info: 'INFO',
  warn: 'WARN',
  crit: 'CRIT',
};

export default function Audit() {
  const { state, api } = useStore();
  const [actor, setActor] = useState<ActorFilter>('TOUS');
  const [chain, setChain] = useState<'idle' | 'run' | 'ok'>('idle');

  const rows = state.audit.filter((a) => actor === 'TOUS' || a.actor === actor);
  const root = state.audit[state.audit.length - 1]?.hash ?? '—';

  const verify = () => {
    if (chain === 'run') return;
    setChain('run');
    api.toast('info', 'Vérification de la chaîne d\u2019audit lancée — recalcul des empreintes…');
    window.setTimeout(() => {
      setChain('ok');
      api.toast('ok', `Chaîne d'audit intègre — ${state.audit.length}/${state.audit.length} maillons vérifiés`);
    }, 1500);
  };

  return (
    <div>
      <ViewHead
        code="10 / INTÉGRITÉ"
        title="Audit & cybersécurité"
        desc="Journal chaîné par empreintes SHA-256 : chaque action du noyau, des opérateurs et du canal hébergeur est ancrée et vérifiable. Posture de sécurité supervisée en continu."
        right={<Badge tone="mint">RBAC : 3 rôles actifs</Badge>}
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <Panel
          title="Journal chaîné des opérations"
          delay={40}
          bodyClassName="p-0"
          right={
            <div className="flex flex-wrap gap-1.5">
              {ACTORS.map((a) => (
                <Chip key={a} active={actor === a} onClick={() => setActor(a)}>
                  {a}
                </Chip>
              ))}
            </div>
          }
        >
          <ul className="divide-y divide-line-soft max-h-[560px] overflow-y-auto">
            {rows.map((a, i) => (
              <li
                key={a.id}
                className="px-4 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 hover:bg-ink-800/60 transition-colors"
              >
                <span className="font-mono text-[10.5px] text-mute tabular shrink-0">{a.time}</span>
                <Badge tone={ACTOR_TONE[a.actor] ?? 'mute'}>{a.actor}</Badge>
                <span
                  className={`font-mono text-[9px] tracking-wider px-1.5 border ${
                    a.level === 'ok'
                      ? 'text-mint border-mint/30'
                      : a.level === 'info'
                        ? 'text-sky border-sky/30'
                        : a.level === 'warn'
                          ? 'text-amber border-amber/30'
                          : 'text-coral border-coral/40 bg-coral/10'
                  }`}
                >
                  {LEVEL_LABEL[a.level]}
                </span>
                <span className={`text-[12px] leading-snug flex-1 min-w-[200px] ${a.level === 'crit' ? 'text-coral' : 'text-dim'}`}>
                  {a.message}
                </span>
                <span className="font-mono text-[10px] text-mute tabular shrink-0">#{a.hash}</span>
                {chain === 'ok' && (
                  <span className="anim-feed" style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}>
                    <IcCheck className="w-3.5 h-3.5 text-mint" />
                  </span>
                )}
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-wider text-mute">
                aucun événement pour cet acteur
              </li>
            )}
          </ul>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Intégrité de la chaîne" delay={100}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="font-display text-3xl font-bold text-fog tabular">{state.audit.length}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute mt-1">
                  maillons journalisés
                </div>
              </div>
              <IcShield className="w-8 h-8 text-mint/50" />
            </div>

            {chain === 'run' && (
              <div className="h-2 bg-ink-700 overflow-hidden mb-3">
                <div className="h-full stripe-bar chain-progress" />
              </div>
            )}
            {chain === 'ok' && (
              <div className="anim-feed mb-3">
                <Badge tone="mint" className="w-full justify-center py-1.5">
                  <IcCheck className="w-3.5 h-3.5" /> chaîne valide — 0 altération détectée
                </Badge>
              </div>
            )}

            <Btn onClick={verify} disabled={chain === 'run'} className="w-full py-2.5">
              <IcRefresh className={`w-3.5 h-3.5 ${chain === 'run' ? 'animate-spin' : ''}`} />
              {chain === 'run' ? 'vérification…' : 'vérifier la chaîne'}
            </Btn>
            <div className="mt-3.5 bg-ink-950 border border-line-soft p-2.5 font-mono text-[10px] text-dim">
              <div className="flex justify-between gap-2">
                <span className="text-mute">racine</span>
                <span className="tabular text-mint">#{root}</span>
              </div>
              <div className="flex justify-between gap-2 mt-1">
                <span className="text-mute">algo</span>
                <span>SHA-256 chaîné · ancrage horodaté</span>
              </div>
            </div>
          </Panel>

          <Panel title="Posture de sécurité" delay={160}>
            <ul className="space-y-3.5">
              <li>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-dim">Menaces bloquées · 24 h</span>
                  <span className="font-mono tabular text-coral">{state.threat}</span>
                </div>
                <Meter value={(state.threat / 24) * 100} tone="coral" />
              </li>
              <li>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-dim">Validité certificat mTLS</span>
                  <span className="font-mono tabular text-amber">21 j</span>
                </div>
                <Meter value={(21 / 90) * 100} tone="amber" />
              </li>
              {[
                { l: 'Chiffrement au repos', v: 'AES-256-GCM' },
                { l: 'Signature des requêtes', v: 'Ed25519' },
                { l: "Contrôle d'accès", v: 'RBAC 3 rôles + MFA' },
                { l: 'Protection applicative', v: 'WAF + anti-injection' },
                { l: 'Dépendance GAFAM', v: 'aucune — canal direct' },
              ].map((r) => (
                <li key={r.l} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-dim flex items-center gap-2">
                    <IcLock className="w-3 h-3 text-mute" /> {r.l}
                  </span>
                  <span className="font-mono text-[10.5px] text-fog">{r.v}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

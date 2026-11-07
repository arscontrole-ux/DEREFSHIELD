import { useState } from 'react';
import { useStore } from '../lib/store';
import { Badge, Meter, Panel, ViewHead } from '../components/ui';
import type { CogComponent, CompRole } from '../lib/data';
import { PROVIDER_META, ROLE_META, wave } from '../lib/data';

const POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  gateway: { x: 460, y: 50, w: 380, h: 56 },
  qwen: { x: 460, y: 152, w: 200, h: 74 },
  llama: { x: 232, y: 292, w: 176, h: 68 },
  deepseek: { x: 688, y: 292, w: 176, h: 68 },
  gemma: { x: 345, y: 424, w: 176, h: 68 },
  oxalpha: { x: 575, y: 424, w: 176, h: 68 },
  mem0nv1: { x: 195, y: 516, w: 176, h: 62 },
  mem0nv2: { x: 725, y: 516, w: 176, h: 62 },
};

const ROLE_COLOR: Record<CompRole, string> = {
  superviseur: '#f2554d',
  llm: '#4fc1e9',
  memoire: '#f5b02e',
  mem0: '#3ce6a4',
};

const EDGES: { d: string; packet?: string; dur?: number }[] = [
  { d: 'M 460 78 L 460 114' },
  { d: 'M 415 188 Q 310 214 254 258', packet: '#4fc1e9', dur: 2.8 },
  { d: 'M 505 188 Q 610 214 666 258', packet: '#f2554d', dur: 3.6 },
  { d: 'M 242 326 Q 282 360 336 390', packet: '#f5b02e', dur: 3.1 },
  { d: 'M 678 326 Q 638 360 584 390', packet: '#f5b02e', dur: 3.4 },
  { d: 'M 434 424 L 486 424', packet: '#3ce6a4', dur: 4.2 },
  { d: 'M 216 326 Q 190 400 195 484' },
  { d: 'M 704 326 Q 730 400 725 484' },
  { d: 'M 283 516 Q 420 552 496 458' },
  { d: 'M 637 516 Q 610 486 588 458' },
];

function Node({ c, selected, onSelect }: { c: CogComponent; selected: boolean; onSelect: () => void }) {
  const p = POS[c.id];
  const color = ROLE_COLOR[c.role];
  return (
    <g transform={`translate(${p.x},${p.y})`} onClick={onSelect} className="cursor-pointer">
      {selected && (
        <rect
          x={-p.w / 2 - 5}
          y={-p.h / 2 - 5}
          width={p.w + 10}
          height={p.h + 10}
          fill="none"
          stroke={color}
          strokeOpacity="0.5"
          strokeDasharray="4 4"
        />
      )}
      <rect
        x={-p.w / 2}
        y={-p.h / 2}
        width={p.w}
        height={p.h}
        fill="#0d1a22"
        stroke={selected ? color : '#1c333d'}
        strokeWidth={selected ? 1.4 : 1}
      />
      <rect x={-p.w / 2} y={-p.h / 2} width={3} height={p.h} fill={color} />
      <circle cx={p.w / 2 - 12} cy={-p.h / 2 + 12} r={3} fill={c.status === 'actif' ? '#3ce6a4' : '#f5b02e'} />
      {c.status === 'actif' && (
        <circle cx={p.w / 2 - 12} cy={-p.h / 2 + 12} r={3} fill="none" stroke="#3ce6a4" className="anim-ring" />
      )}
      <text x={-p.w / 2 + 12} y={-p.h / 2 + 21} fontSize="10.5" fontFamily="Chakra Petch, sans-serif" fontWeight="700" fill="#d9e7ec" letterSpacing="1">
        {c.name}
      </text>
      <text x={-p.w / 2 + 12} y={-p.h / 2 + 35} fontSize="8.5" fontFamily="IBM Plex Mono, monospace" fill="#5e7a85">
        {c.model.length > 27 ? c.model.slice(0, 27) + '…' : c.model}
      </text>
      <rect x={-p.w / 2 + 12} y={p.h / 2 - 16} width={p.w - 24} height={3} fill="#17313d" />
      <rect x={-p.w / 2 + 12} y={p.h / 2 - 16} width={(p.w - 24) * (c.load / 100)} height={3} fill={color} style={{ transition: 'width 1s ease' }} />
      <text x={p.w / 2 - 12} y={p.h / 2 - 22} fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="#8fa9b3" textAnchor="end">
        {c.load}%
      </text>
    </g>
  );
}

export default function Cognitif() {
  const { state } = useStore();
  const [sel, setSel] = useState('qwen');
  const comp = state.components.find((c) => c.id === sel) ?? state.components[0];
  const totalTokens = state.components.reduce((a, c) => a + c.tokens, 0);
  const fmt = new Intl.NumberFormat('fr-FR');

  return (
    <div>
      <ViewHead
        code="02 / NOYAU"
        title="OS cognitif"
        desc="Un seul cerveau, sept organes : le superviseur Qwen route chaque tâche entre Llama 3.3 (voie rapide) et DeepSeek-R1 (raisonnement profond), s'appuie sur les mémoires Gemma et Ox-Alpha, consolide via deux mem0 sur NVIDIA NIM — derrière une API unique Hugging Face + NVIDIA."
        right={<Badge tone="mint">débit : {fmt.format(totalTokens)} tokens</Badge>}
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_370px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          <Panel
            title="Circuit du noyau — flux cognitifs en direct"
            delay={40}
            bodyClassName="p-2"
            right={<span className="font-mono text-[10px] text-mute tabular">{fmt.format(totalTokens)} tokens cumulés</span>}
          >
            <svg viewBox="0 0 920 560" className="w-full h-auto select-none">
              {EDGES.map((e, i) => (
                <g key={i}>
                  <path d={e.d} fill="none" stroke="#1f4250" strokeWidth="1" className="edge" />
                  {e.packet && (
                    <circle r="3" fill={e.packet}>
                      <animateMotion dur={`${e.dur}s`} repeatCount="indefinite" path={e.d} />
                    </circle>
                  )}
                </g>
              ))}

              <g>
                <rect
                  x={POS.gateway.x - POS.gateway.w / 2}
                  y={POS.gateway.y - POS.gateway.h / 2}
                  width={POS.gateway.w}
                  height={POS.gateway.h}
                  fill="#10212b"
                  stroke="#3ce6a4"
                  strokeOpacity="0.55"
                />
                <text x={POS.gateway.x} y={POS.gateway.y - 6} textAnchor="middle" fontSize="11" fontFamily="Chakra Petch, sans-serif" fontWeight="700" fill="#3ce6a4" letterSpacing="2">
                  API UNIFIÉE — 1 TOKEN · 2 FOURNISSEURS
                </text>
                <text x={POS.gateway.x} y={POS.gateway.y + 12} textAnchor="middle" fontSize="8.5" fontFamily="IBM Plex Mono, monospace" fill="#8fa9b3">
                  hf.co/inference ⇄ integrate.api.nvidia.com · bascule auto
                </text>
              </g>

              <text x={460} y={414} textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="#5e7a85" letterSpacing="1.5">
                CONSOLIDATION
              </text>

              {state.components.map((c) => (
                <Node key={c.id} c={c} selected={sel === c.id} onSelect={() => setSel(c.id)} />
              ))}
            </svg>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-wider text-mute">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-coral inline-block" /> superviseur</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-sky inline-block" /> LLM</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber inline-block" /> mémoire</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-mint inline-block" /> mem0</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-mint inline-block rounded-full" /> actif</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber inline-block rounded-full" /> repos</span>
            </div>
          </Panel>

          <Panel title="Passerelle d'inférence — une seule clé" delay={100}>
            <div className="grid md:grid-cols-[240px_1fr] gap-5">
              <div>
                <div className="bg-ink-950 border border-line-soft p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-mute">token unifié</div>
                  <div className="font-mono text-[12px] text-mint mt-1">ds-••••••••••hf-nv</div>
                  <div className="font-mono text-[9px] text-mute mt-2 leading-relaxed">
                    1 clé signée · routage HF ⇄ NVIDIA<br />bascule en 180 ms si timeout
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-mute mb-1">
                    <span>requêtes / min</span>
                    <span className="tabular text-dim">{34 + (state.tick % 9)}</span>
                  </div>
                  <svg width="100%" height="30" viewBox="0 0 220 30" preserveAspectRatio="none" className="text-mint">
                    <polyline
                      points={wave(state.tick, 13, 22).map((v, i) => `${(i / 21) * 218 + 1},${28 - (v / 100) * 26}`).join(' ')}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      opacity="0.85"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Hugging Face Inference', models: 'llama-3.3-70b · gemma-embed-2b', lat: 34 + (state.tick % 5), tone: 'amber' as const, note: 'voie rapide · quota dédié' },
                  { name: 'NVIDIA NIM', models: 'qwen-72b · deepseek-r1 · mem0 ×2', lat: 61 + (state.tick % 7), tone: 'mint' as const, note: 'raisonnement + mémoires agents' },
                ].map((p) => (
                  <div key={p.name} className="border border-line-soft p-3 hover:border-line transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px] text-fog">{p.name}</span>
                      <span className="font-mono text-[10px] tabular text-dim">{p.lat} ms</span>
                    </div>
                    <div className="font-mono text-[9.5px] text-mute mt-0.5">{p.models}</div>
                    <div className="mt-2"><Meter value={Math.min(100, p.lat)} tone={p.tone} /></div>
                    <div className="font-mono text-[9px] text-mute mt-1.5 uppercase tracking-wider">{p.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Inspecteur de composant" delay={80}>
            <div key={comp.id} className="anim-feed">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-display font-bold text-[15px] text-fog tracking-wide">{comp.name}</span>
                <Badge tone={ROLE_META[comp.role].tone}>{ROLE_META[comp.role].label}</Badge>
              </div>
              <div className="bg-ink-950 border border-line-soft p-2.5 font-mono text-[10.5px] text-dim space-y-1.5">
                <div className="flex justify-between gap-2"><span className="text-mute">modèle</span><span className="text-fog text-right">{comp.model}</span></div>
                <div className="flex justify-between gap-2"><span className="text-mute">endpoint</span><span className="text-sky text-right">{comp.endpoint}</span></div>
                <div className="flex justify-between gap-2 items-center">
                  <span className="text-mute">fournisseur</span>
                  <Badge tone={PROVIDER_META[comp.provider].tone}>{PROVIDER_META[comp.provider].label}</Badge>
                </div>
              </div>
              <p className="text-[11.5px] text-dim leading-relaxed mt-3">{comp.desc}</p>
              <div className="mt-3.5 space-y-3">
                <div>
                  <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-mute mb-1">
                    <span>charge</span><span className="tabular text-dim">{comp.load} %</span>
                  </div>
                  <Meter value={comp.load} tone={comp.load > 80 ? 'coral' : comp.load > 55 ? 'amber' : 'mint'} />
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-center">
                  <div className="bg-ink-800 border border-line-soft py-2">
                    <div className="font-display text-lg font-bold text-fog tabular">{comp.latency + (state.tick % 4)} ms</div>
                    <div className="text-[9px] uppercase tracking-wider text-mute mt-0.5">latence</div>
                  </div>
                  <div className="bg-ink-800 border border-line-soft py-2">
                    <div className="font-display text-lg font-bold text-fog tabular">{fmt.format(comp.tokens)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-mute mt-0.5">tokens</div>
                  </div>
                </div>
                <Badge tone={comp.status === 'actif' ? 'mint' : 'amber'}>
                  {comp.status === 'actif' ? 'actif — inférence en cours' : 'repos — réveillable par qwen'}
                </Badge>
              </div>
            </div>
          </Panel>

          <Panel title="Routage du superviseur" delay={140} bodyClassName="p-0" right={<Badge tone="coral">QWEN décide</Badge>}>
            <ul className="divide-y divide-line-soft max-h-[280px] overflow-y-auto">
              {state.routes.map((r, i) => (
                <li key={r.id} className={`px-3.5 py-2.5 ${i === 0 ? 'anim-feed' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11.5px] text-fog leading-snug">{r.task}</span>
                    <span className="font-mono text-[9.5px] text-mute tabular shrink-0">{r.time}</span>
                  </div>
                  <div className="font-mono text-[10px] mt-1">
                    <span className="text-coral">qwen</span>
                    <span className="text-mute"> → </span>
                    <span className={r.to.includes('deepseek') ? 'text-sky' : r.to.includes('gemma') || r.to.includes('ox') ? 'text-amber' : r.to.includes('MEM0') ? 'text-mint' : 'text-sky'}>
                      {r.to}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] text-mute mt-0.5">{r.reason}</div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Opérations mémoire" delay={200} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft max-h-[220px] overflow-y-auto">
              {state.memOps.map((m, i) => (
                <li key={m.id} className={`px-3.5 py-2 flex items-center gap-2.5 ${i === 0 ? 'anim-feed' : ''}`}>
                  <span className={`font-mono text-[8.5px] uppercase tracking-wider px-1.5 border shrink-0 ${
                    m.op === 'lecture' ? 'text-sky border-sky/30' : m.op === 'écriture' ? 'text-amber border-amber/30' : 'text-mint border-mint/30'
                  }`}>
                    {m.op}
                  </span>
                  <span className="font-mono text-[10.5px] text-dim truncate flex-1">{m.key}</span>
                  <span className="font-mono text-[9px] text-mute shrink-0">{m.mem.replace('MEM-1 ', '').replace('MEM-2 ', '')}</span>
                  <span className="font-mono text-[9px] text-mute tabular shrink-0">{m.size}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

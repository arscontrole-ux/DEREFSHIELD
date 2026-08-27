import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { useStore } from '../lib/store';
import { Badge, Btn, Chip, Meter, Panel, ViewHead } from '../components/ui';
import type { IntakeMode, IntakeType } from '../lib/data';
import { INTAKE_MODE, INTAKE_STATUS, INTAKE_TYPE } from '../lib/data';
import { IcAlert, IcArrow, IcCheck, IcGhost, IcRefresh, IcUpload, IcX } from '../components/icons';

type Filter = 'tous' | IntakeType;

const RE_URL = /^https?:\/\/\S+$/i;
const RE_SITE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export default function Depot() {
  const { state, api } = useStore();
  const [urls, setUrls] = useState('');
  const [sites, setSites] = useState('');
  const [mots, setMots] = useState('');
  const [prio, setPrio] = useState<'auto' | 'haute'>('auto');
  const [mode, setMode] = useState<IntakeMode>('analyser');
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('tous');
  const [urlOver, setUrlOver] = useState(false);

  const onDropUrl = (e: DragEvent) => {
    e.preventDefault();
    setUrlOver(false);
    const raw = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (/^https?:\/\//i.test(l) ? l : 'https://' + l));
    if (!lines.length) return;
    setUrls((prev) => (prev ? prev.replace(/\n?$/, '\n') + lines.join('\n') : lines.join('\n')));
    api.toast('ok', `${lines.length} URL déposée(s) dans le champ — prêtes à envoyer`);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { attente: 0, ingeree: 0, analysee: 0, signalee: 0, neutralisee: 0, bloquee: 0 };
    state.intake.forEach((it) => c[it.status]++);
    return c;
  }, [state.intake]);

  const rows = useMemo(
    () => state.intake.filter((it) => filter === 'tous' || it.type === filter),
    [state.intake, filter]
  );

  const nUrls = urls.split(/\n+/).filter((s) => s.trim()).length;
  const nSites = sites.split(/\n+/).filter((s) => s.trim()).length;
  const nMots = mots.split(/[,;\n]+/).filter((s) => s.trim()).length;

  const submit = () => {
    const items: { type: IntakeType; value: string }[] = [];
    const skipped: string[] = [];
    const existing = new Set(state.intake.map((it) => it.value.toLowerCase()));

    urls.split(/\n+/).map((s) => s.trim()).filter(Boolean).forEach((v) => {
      const full = RE_URL.test(v) ? v : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v) ? 'https://' + v : null;
      if (!full) skipped.push(v);
      else if (existing.has(full.toLowerCase())) skipped.push(`${v} (déjà déposée)`);
      else {
        existing.add(full.toLowerCase());
        items.push({ type: 'url', value: full });
      }
    });

    sites.split(/\n+/).map((s) => s.trim()).filter(Boolean).forEach((v) => {
      const bare = v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      if (!RE_SITE.test(bare)) skipped.push(v);
      else if (existing.has(bare.toLowerCase())) skipped.push(`${v} (déjà déposé)`);
      else {
        existing.add(bare.toLowerCase());
        items.push({ type: 'site', value: bare });
      }
    });

    mots.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).forEach((v) => {
      if (v.length < 2) skipped.push(`${v} (trop court)`);
      else if (existing.has(v.toLowerCase())) skipped.push(`${v} (déjà déposé)`);
      else {
        existing.add(v.toLowerCase());
        items.push({ type: 'motcle', value: v });
      }
    });

    if (!items.length) {
      setErr(
        skipped.length
          ? `Aucune cible valide — ${skipped.length} ligne(s) ignorée(s) : ${skipped[0]}`
          : 'Déposez au moins une URL, un site ou un mot-clé.'
      );
      return;
    }

    setErr(null);
    api.addIntake(items, prio, mode);
    if (skipped.length) {
      api.toast('warn', `${skipped.length} ligne(s) ignorée(s) — ${skipped[0]}`);
    }
    setUrls('');
    setSites('');
    setMots('');
  };

  const onKeySubmit = (e: { key: string; ctrlKey: boolean; metaKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div>
      <ViewHead
        code="03 / DÉPÔT"
        title="Dépôt de cibles"
        desc="L'entrée du pipeline : déposez des URLs, sites ou mots-clés et choisissez l'action. ANALYSER passe par le noyau cognitif, BLOQUER applique un WAF immédiat, DÉRÉFÉRENCER pousse la menace direct en file StopNet. La barre en haut de l'écran fait la même chose, partout."
        right={
          <Badge tone={counts.signalee ? 'coral' : 'mint'}>
            {counts.signalee ? `${counts.signalee} menace(s) signalée(s)` : 'aucune menace en file'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {(Object.keys(INTAKE_STATUS) as (keyof typeof INTAKE_STATUS)[]).map((st, i) => (
          <div key={st} className="panel corners px-4 py-3 anim-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{INTAKE_STATUS[st].label}</div>
            <div className={`font-display text-2xl font-bold tabular mt-1 ${
              st === 'attente' ? 'text-dim'
                : st === 'ingeree' ? 'text-sky'
                : st === 'analysee' ? 'text-amber'
                : st === 'signalee' || st === 'bloquee' ? 'text-coral'
                : 'text-mint'
            }`}>
              {counts[st] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-5">
        {/* -------- formulaire -------- */}
        <div className="flex flex-col gap-5">
          <Panel title="Déposer dans le pipeline" delay={60}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim" htmlFor="depot-urls">
                    URLs suspectes
                  </label>
                  <span className="font-mono text-[9.5px] text-mute tabular">{nUrls} ligne(s)</span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setUrlOver(true);
                  }}
                  onDragLeave={() => setUrlOver(false)}
                  onDrop={onDropUrl}
                  className={`relative transition-all duration-200 ${urlOver ? 'scale-[1.01]' : ''}`}
                >
                  <textarea
                    id="depot-urls"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    onKeyDown={onKeySubmit}
                    rows={3}
                    placeholder={'https://page-suspecte-01.example/login\nhttps://offre-limitee-24h.example/claim'}
                    className={`w-full bg-ink-950 border outline-none font-mono text-[11px] text-fog p-2.5 resize-y placeholder:text-mute/60 transition-colors ${
                      urlOver ? 'border-mint bg-mint/5' : 'border-line focus:border-mint/60'
                    }`}
                  />
                  {urlOver && (
                    <div className="absolute inset-0 grid place-items-center bg-mint/10 border border-mint pointer-events-none">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint anim-feed">
                        relâchez pour déposer
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-mono text-[9px] text-mute mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <IcUpload className="w-3 h-3 text-mint/70" />
                  glissez une URL depuis votre navigateur · Ctrl+Entrée pour envoyer
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim" htmlFor="depot-sites">
                    Sites / domaines
                  </label>
                  <span className="font-mono text-[9.5px] text-mute tabular">{nSites} ligne(s)</span>
                </div>
                <textarea
                  id="depot-sites"
                  value={sites}
                  onChange={(e) => setSites(e.target.value)}
                  onKeyDown={onKeySubmit}
                  rows={2}
                  placeholder={'domaine-douteux-01.net\nannuaire-spam.example'}
                  className="w-full bg-ink-950 border border-line focus:border-mint/60 outline-none font-mono text-[11px] text-fog p-2.5 resize-y placeholder:text-mute/60 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim" htmlFor="depot-mots">
                    Mots-clés
                  </label>
                  <span className="font-mono text-[9.5px] text-mute tabular">{nMots} mot(s)</span>
                </div>
                <textarea
                  id="depot-mots"
                  value={mots}
                  onChange={(e) => setMots(e.target.value)}
                  onKeyDown={onKeySubmit}
                  rows={2}
                  placeholder={'gagner un iphone, support officiel bancaire'}
                  className="w-full bg-ink-950 border border-line focus:border-mint/60 outline-none font-mono text-[11px] text-fog p-2.5 resize-y placeholder:text-mute/60 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">Action</span>
                <div className="flex gap-1.5">
                  {(Object.keys(INTAKE_MODE) as IntakeMode[]).map((m) => (
                    <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                      {INTAKE_MODE[m].label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div
                className={`border p-2.5 font-mono text-[10px] leading-relaxed transition-colors ${
                  mode === 'bloquer'
                    ? 'border-coral/40 bg-coral/5 text-coral'
                    : mode === 'deref'
                      ? 'border-amber/40 bg-amber/5 text-amber'
                      : 'border-sky/30 bg-sky/5 text-sky'
                }`}
              >
                {mode === 'bloquer'
                  ? '→ blocage WAF immédiat sur l\u2019hébergeur, visible dans Forensics. Pas d\u2019analyse.'
                  : mode === 'deref'
                    ? '→ menace poussée directement en file de déréférencement (L2/L3), ordre StopNet prêt à partir.'
                    : '→ pipeline cognitif complet : le noyau trie, analyse et décide automatiquement.'}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">Priorité</span>
                <div className="flex gap-1.5">
                  <Chip active={prio === 'auto'} onClick={() => setPrio('auto')}>auto</Chip>
                  <Chip active={prio === 'haute'} onClick={() => setPrio('haute')}>haute</Chip>
                </div>
              </div>

              {err && (
                <div className="anim-feed flex items-start gap-2 border border-coral/40 bg-coral/10 p-2.5">
                  <IcAlert className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
                  <span className="text-[11px] text-coral leading-snug">{err}</span>
                </div>
              )}

              <Btn
                onClick={submit}
                disabled={nUrls + nSites + nMots === 0}
                tone={mode === 'bloquer' ? 'coral' : mode === 'deref' ? 'amber' : 'mint'}
                className="w-full py-3"
              >
                {mode === 'bloquer' ? (
                  <><IcX className="w-4 h-4" /> bloquer {nUrls + nSites + nMots || ''} cible(s)</>
                ) : mode === 'deref' ? (
                  <><IcGhost className="w-4 h-4" /> déréférencer {nUrls + nSites + nMots || ''} cible(s)</>
                ) : (
                  <><IcUpload className="w-4 h-4" /> déposer {nUrls + nSites + nMots || ''} cible(s)</>
                )}
              </Btn>
            </div>
          </Panel>

          <Panel title="Cycles selon l'action choisie" delay={120}>
            <ol className="space-y-2.5">
              {[
                ['analyser', 'attente → ingérée → analysée → signalée → neutralisée'],
                ['bloquer', 'dépôt → blocage WAF immédiat (registre Forensics)'],
                ['déréférencer', 'dépôt → menace en file StopNet → ordre signé → neutralisée'],
              ].map(([st, d], i) => (
                <li key={st} className="flex gap-3 text-[11.5px]">
                  <span className="font-mono text-[10px] text-mute tabular mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className={st === 'analyser' ? 'text-sky' : st === 'bloquer' ? 'text-coral' : 'text-amber'}>
                      {st}
                    </span>
                    <span className="text-mute"> — {d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="font-mono text-[9.5px] text-mute uppercase tracking-wider mt-4 border-t border-line-soft pt-3 leading-relaxed">
              le cycle avance tout seul, tick après tick — priorisez en « haute » pour un passage immédiat
            </p>
          </Panel>
        </div>

        {/* -------- file du dépôt -------- */}
        <Panel
          title="File du dépôt"
          delay={100}
          bodyClassName="p-0"
          right={
            <div className="flex flex-wrap gap-1.5">
              {(['tous', 'url', 'site', 'motcle'] as Filter[]).map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f === 'tous' ? 'tous' : INTAKE_TYPE[f].label}
                </Chip>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute border-b border-line-soft">
                  <th className="px-4 py-2.5 font-medium">Cible</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Mode</th>
                  <th className="px-4 py-2.5 font-medium w-40">Risque</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {rows.map((it) => (
                  <tr key={it.id} className="hover:bg-ink-800/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className={`font-mono text-[11.5px] break-all ${it.status === 'signalee' ? 'text-coral' : 'text-fog'}`}>
                        {it.value}
                      </div>
                      {it.priority === 'haute' && <Badge tone="coral" className="mt-1">priorité haute</Badge>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={INTAKE_TYPE[it.type].tone}>{INTAKE_TYPE[it.type].label}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={INTAKE_MODE[it.mode].tone}>{INTAKE_MODE[it.mode].label}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {it.score != null ? (
                        <div className="flex items-center gap-2">
                          <Meter value={it.score} tone={it.score >= 60 ? 'coral' : 'amber'} className="h-1 w-16" />
                          <span className="font-mono tabular text-dim">{it.score}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-mute">en attente…</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={INTAKE_STATUS[it.status].tone}>{INTAKE_STATUS[it.status].label}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {it.status === 'signalee' && it.pageId && (
                        <Btn
                          ghost
                          tone="coral"
                          onClick={() => {
                            api.issueToken(it.pageId!);
                            api.nav('stopnet');
                          }}
                        >
                          émettre l'ordre <IcArrow className="w-3.5 h-3.5" />
                        </Btn>
                      )}
                      {it.status === 'signalee' && !it.pageId && (
                        <Btn ghost tone="coral" onClick={() => api.nav('deref')}>
                          voir la file <IcArrow className="w-3.5 h-3.5" />
                        </Btn>
                      )}
                      {it.status === 'bloquee' && (
                        <Btn ghost tone="sky" onClick={() => api.nav('forensics')}>
                          registre WAF <IcArrow className="w-3.5 h-3.5" />
                        </Btn>
                      )}
                      {it.status === 'neutralisee' && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-mint uppercase tracking-wider">
                          <IcCheck className="w-3.5 h-3.5" /> stopnet confirmé
                        </span>
                      )}
                      {it.status === 'analysee' && (it.score ?? 0) < 60 && (
                        <Btn ghost onClick={() => api.reanalyze(it.id)}>
                          <IcRefresh className="w-3.5 h-3.5" /> ré-analyser
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center font-mono text-mute text-[11px] uppercase tracking-wider">
                      aucune cible dans cette catégorie
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 border-t border-line-soft font-mono text-[10px] text-mute uppercase tracking-wider">
            toute cible signalée devient une page candidate — l'ordre StopNet part de la file de déréférencement
          </p>
        </Panel>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { Badge, Btn, Chip, Meter, Panel, ViewHead } from '../components/ui';
import { disavowTxt, htaccess, robotsTxt, sitemapXml } from '../lib/data';
import { IcCopy, IcLock, IcServer, IcUpload } from '../components/icons';

const FILES = ['robots.txt', 'sitemap.xml', '.htaccess', 'disavow.txt'] as const;
type FileName = (typeof FILES)[number];

export default function Hebergeur() {
  const { state, api } = useStore();
  const [tab, setTab] = useState<FileName>('robots.txt');

  const contents = useMemo<Record<FileName, string>>(
    () => ({
      'robots.txt': robotsTxt(state.pages),
      'sitemap.xml': sitemapXml(state.pages),
      '.htaccess': htaccess(state.pages),
      'disavow.txt': disavowTxt(state.backlinks),
    }),
    [state.pages, state.backlinks]
  );

  const pending = state.pushes.filter((p) => p.status === 'pending').length;
  const enLigne = state.hosts.filter((h) => h.status === 'en-ligne').length;

  const copy = () => {
    const text = contents[tab];
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => api.toast('ok', `${tab} copié dans le presse-papiers`))
        .catch(() => api.toast('warn', 'copie impossible dans ce contexte'));
    } else {
      api.toast('warn', 'presse-papiers indisponible');
    }
  };

  return (
    <div>
      <ViewHead
        code="08 / CANAL HÉBERGEUR"
        title="Liaison directe hébergeur"
        desc="Connecteurs multi-panneaux : API cPanel, Plesk, DirectAdmin, accès SFTP/SSH, edge Cloudflare et DNS OVH. Les artefacts sont poussés à la source, en contournant totalement les consoles des moteurs."
        right={
          <Badge tone={pending > 0 ? 'amber' : 'mint'}>
            {pending > 0 ? `${pending} push en cours` : `${enLigne}/6 connecteurs en ligne`}
          </Badge>
        }
      />

      {/* -------- matrice connecteurs -------- */}
      <Panel title="Matrice des connecteurs" delay={40} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute border-b border-line-soft">
                <th className="px-4 py-2.5 font-medium">Panneau</th>
                <th className="px-4 py-2.5 font-medium">Cible</th>
                <th className="px-4 py-2.5 font-medium">Protocole</th>
                <th className="px-4 py-2.5 font-medium">Doc root</th>
                <th className="px-4 py-2.5 font-medium">Latence</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {state.hosts.map((h) => (
                <tr key={h.id} className="hover:bg-ink-800/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-mono text-fog">{h.panel}</div>
                    <div className="font-mono text-[9px] text-mute">{h.name}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-dim">{h.domain}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="sky">{h.protocol}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-mute text-[10.5px]">{h.docRoot}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={Math.min(100, (h.latency / 80) * 100)} tone={h.latency < 45 ? 'mint' : 'amber'} className="h-1 w-16" />
                      <span className="font-mono tabular text-dim">{h.latency} ms</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={h.status === 'en-ligne' ? 'mint' : h.status === 'degrade' ? 'amber' : 'coral'}>
                      {h.status === 'en-ligne' ? 'en ligne' : h.status === 'degrade' ? 'dégradé' : 'hors ligne'}
                    </Badge>
                    <div className="font-mono text-[9px] text-mute mt-1 tabular">
                      {h.mtls ? 'mTLS ✓' : 'clé SSH'} · {h.pushes} push
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Btn ghost onClick={() => api.syncHost(h.id)}>
                      <IcUpload className="w-3.5 h-3.5" /> sync
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-5 mt-5">
        <Panel
          title="Artefacts générés — régénération en direct"
          delay={80}
          bodyClassName="p-0"
          right={
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILES.map((f) => (
                <Chip key={f} active={tab === f} onClick={() => setTab(f)}>
                  {f}
                </Chip>
              ))}
              <button
                onClick={copy}
                className="ml-1 p-1.5 border border-line text-mute hover:text-mint hover:border-mint/50 transition-colors cursor-pointer"
                title="Copier le contenu"
              >
                <IcCopy className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <pre
            key={tab}
            className="anim-feed font-mono text-[11px] leading-relaxed text-dim bg-ink-950 border-t border-line-soft p-4 overflow-auto max-h-[420px] whitespace-pre"
          >
            {contents[tab]}
          </pre>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Actions de synchronisation" delay={120}>
            <div className="grid grid-cols-2 gap-2">
              {FILES.map((f) => (
                <Btn key={f} ghost onClick={() => api.pushFile(f)} className="w-full py-2.5">
                  <IcUpload className="w-3.5 h-3.5" /> pousser {f}
                </Btn>
              ))}
            </div>
            <p className="font-mono text-[9.5px] uppercase tracking-wider text-mute mt-3 leading-relaxed">
              chaque push est journalisé, checksummé SHA-256 et confirmé par l'hébergeur
            </p>
          </Panel>

          <Panel title="Historique des push" delay={160} bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute border-b border-line-soft">
                    <th className="px-4 py-2.5 font-medium">Fichier</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium">Latence</th>
                    <th className="px-4 py-2.5 font-medium">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {state.pushes.slice(0, 8).map((p) => (
                    <tr key={p.id} className="hover:bg-ink-800/60 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-fog text-[11px]">{p.file}</td>
                      <td className="px-4 py-2.5">
                        {p.status === 'ok' && <Badge tone="mint">confirmé</Badge>}
                        {p.status === 'pending' && <Badge tone="amber">en cours…</Badge>}
                        {p.status === 'echec' && <Badge tone="coral">échec</Badge>}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular text-dim">
                        {p.status === 'ok' ? `${p.latency} ms` : p.status === 'pending' ? '…' : 'timeout'}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular text-mute">{p.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 border-t border-line-soft font-mono text-[10px] text-mute uppercase tracking-wider flex items-center gap-1.5">
              <IcLock className="w-3 h-3" /> transport chiffré de bout en bout — aucun service tiers
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

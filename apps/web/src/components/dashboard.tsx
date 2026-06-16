import { SOFTWARE_CATEGORIES } from '@winrepo/shared';
import { UploadPanel } from './upload-panel';

function fmtBytes(n: number) {
  return `${Intl.NumberFormat('en', { notation: 'compact' }).format(n)}B`;
}

export function Dashboard({ data, software }: { data: any; software: any[] }) {
  return (
    <main className="min-h-screen p-6 lg:p-10">
      <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Windows Engineering Platform</p>
          <h1 className="mt-2 text-4xl font-bold">WinRepo Software Repository</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Upload software, publish GitHub Release assets, generate PowerShell install commands, and track Windows endpoint inventory.
          </p>
        </div>
        <code className="rounded-xl bg-slate-950 p-3 text-sm text-blue-200">
          iwr /api/powershell/bootstrap | iex
        </code>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total Software" value={data.totalSoftware} />
        <Metric label="Storage Usage" value={fmtBytes(Number(data.storageUsageBytes))} />
        <Metric label="Updates Available" value={data.updateStatistics?.update_available ?? 0} />
        <Metric label="Inventory Checks" value={data.updateStatistics?.checked ?? 0} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold">Software Catalog</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-300">
                  <tr><th className="p-3">Name</th><th>Vendor</th><th>Category</th><th>Latest</th><th>PowerShell</th></tr>
                </thead>
                <tbody>
                  {software.map((s) => (
                    <tr key={s.id} className="border-t border-slate-800">
                      <td className="p-3 font-medium">{s.name}</td><td>{s.vendor}</td><td>{s.category}</td><td>{s.latestVersion?.version ?? '—'}</td>
                      <td><code className="rounded bg-slate-950 px-2 py-1 text-blue-200">Install-App {s.name}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <UploadPanel />
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold">Categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOFTWARE_CATEGORIES.map((category) => <span key={category} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">{category}</span>)}
            </div>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold">Most Downloaded</h2>
            <ul className="mt-4 space-y-3">
              {data.mostDownloaded?.map((x: any) => <li key={`${x.name}-${x.version}`} className="flex justify-between"><span>{x.name} {x.version}</span><span>{x.download_count}</span></li>)}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="card"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>;
}

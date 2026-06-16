const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
export async function getDashboard() {
  try { const r = await fetch(`${baseUrl}/api/dashboard`, { next: { revalidate: 30 } }); if (r.ok) return r.json(); } catch {}
  return { totalSoftware: 0, latestUploads: [], mostDownloaded: [], categories: [], storageUsageBytes: 0, updateStatistics: { update_available: 0, checked: 0 } };
}
export async function getSoftware() { try { const r = await fetch(`${baseUrl}/api/software`, { next: { revalidate: 30 } }); if (r.ok) return r.json(); } catch {} return []; }

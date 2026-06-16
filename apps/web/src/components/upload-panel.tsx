'use client';

import { SOFTWARE_CATEGORIES } from '@winrepo/shared';
import { useState } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function UploadPanel() {
  const [message, setMessage] = useState('');

  async function upload(formData: FormData) {
    setMessage('Uploading package to WinRepo and GitHub Releases...');
    const token = String(formData.get('token') || '');
    formData.delete('token');
    const response = await fetch(`${apiBaseUrl}/api/software/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    setMessage(response.ok ? `Uploaded ${payload.file_name} successfully.` : `Upload failed: ${payload.error}`);
  }

  return (
    <form action={upload} className="card space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Upload Software</h2>
        <p className="mt-1 text-sm text-slate-400">Add EXE, MSI, ZIP, BAT, or PS1 packages and publish the binary to GitHub Releases.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input name="name" required placeholder="Software Name e.g. Chrome" className="rounded-lg bg-slate-950 p-3" />
        <input name="version" required placeholder="Version e.g. 126.0.1" className="rounded-lg bg-slate-950 p-3" />
        <input name="vendor" required placeholder="Vendor e.g. Google" className="rounded-lg bg-slate-950 p-3" />
        <select name="category" className="rounded-lg bg-slate-950 p-3">
          {SOFTWARE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
      <textarea name="description" placeholder="Notes, install switches, support links" className="min-h-24 w-full rounded-lg bg-slate-950 p-3" />
      <input name="file" required type="file" accept=".exe,.msi,.zip,.bat,.ps1" className="block w-full rounded-lg bg-slate-950 p-3" />
      <input name="token" required type="password" placeholder="Admin/Engineer JWT bearer token" className="w-full rounded-lg bg-slate-950 p-3" />
      <button className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-500/20">Upload Package</button>
      {message && <p className="rounded-lg bg-slate-950 p-3 text-sm text-blue-200">{message}</p>}
    </form>
  );
}

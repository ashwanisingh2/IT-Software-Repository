'use client';
import { Check, Copy, Terminal, Download, Shield, Hash, Clock, FileCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SoftwareDetail({ params }: { params: { id: string } }) {
  const [copied, setCopied] = useState(false);
  const [software, setSoftware] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetch(`/api/software/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setSoftware(data.data);
        } else {
          setError(data.error?.message || 'Software not found');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch software details');
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const psCommand = software ? `Install-App -Name "${software.name}"` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(psCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!software) return;
    try {
      const res = await fetch(`/api/software/${software.id}/download`);
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert('Download failed: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to initiate download');
    }
  };

  const handleDownloadBatch = async () => {
    if (!software) return;
    try {
      const res = await fetch(`/api/software/${software.id}/download`);
      const data = await res.json();
      if (data.success && data.data?.url) {
        const downloadUrl = data.data.url;
        const batContent = `@echo off
echo ========================================================
echo Installing ${software.name} v${software.version}
echo ========================================================
echo Downloading installer...
powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile 'installer.exe'"
echo Running installer...
powershell -Command "Start-Process 'installer.exe' -Wait"
echo Done!
pause
`;
        const blob = new Blob([batContent], { type: 'application/x-bat' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `install_${software.name.replace(/\\s+/g, '_').toLowerCase()}.bat`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to get download URL: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate batch file');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading software details...</div>;
  }

  if (error || !software) {
    return <div className="py-12 text-center text-red-500">{error || 'Software not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{software.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {software.category}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">by {software.vendor}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleDownloadBatch}
            className="inline-flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-md font-medium shadow-sm transition-colors"
            title="Download an auto-install .bat script"
          >
            <FileCode className="h-5 w-5" />
            .BAT Installer
          </button>
          
          <button 
            onClick={handleDownload}
            className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium shadow-sm transition-colors"
          >
            <Download className="h-5 w-5" />
            Download Latest (v{software.version})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Command */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Terminal className="h-5 w-5" />
                <h3 className="font-medium">PowerShell Install Command</h3>
              </div>
              <button 
                onClick={copyToClipboard}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-gray-800 px-3 py-1.5 rounded transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block w-full bg-black p-4 rounded text-green-400 font-mono text-sm overflow-x-auto">
              {psCommand}
            </code>
            <p className="text-gray-400 text-xs mt-3">
              Requires <Link href="/docs/winrepo-client" className="text-blue-400 hover:underline">WinRepoClient.ps1</Link> module to be loaded.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
             <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
               <Shield className="h-5 w-5 text-gray-400" />
               Security & File Info
             </h3>
             <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(software.file_size / (1024*1024)).toFixed(2)} MB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Downloads</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{software.download_count || 0}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Hash className="h-4 w-4" /> SHA256 Checksum
                  </dt>
                  <dd className="mt-1 text-xs text-gray-900 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                    {software.sha256}
                  </dd>
                </div>
             </dl>
          </div>

        </div>

        {/* Right Column: Version History */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium">Version History</h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {software.versions && software.versions.map((ver: any, idx: number) => (
                  <li key={ver.version} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div>
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">v{ver.version}</span>
                      {idx === 0 && <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">(Latest)</span>}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(ver.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {idx !== 0 && (
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                        Download
                      </button>
                    )}
                  </li>
                ))}
                {(!software.versions || software.versions.length === 0) && (
                   <li className="px-6 py-4 text-sm text-gray-500">No version history available</li>
                )}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function ScriptManagementPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScript, setNewScript] = useState({ name: '', description: '', scriptType: 'powershell', content: '' });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const res = await api.get('/scripts');
      setScripts(res.data.data);
    } catch (error) {
      console.error('Failed to fetch scripts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/scripts', newScript);
      setIsModalOpen(false);
      setNewScript({ name: '', description: '', scriptType: 'powershell', content: '' });
      fetchScripts();
    } catch (error) {
      console.error('Failed to create script', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Script Management</h1>
            <p className="mt-2 text-sm text-slate-400">Deploy PowerShell and Bash scripts to your endpoints.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg font-medium text-white shadow-lg shadow-indigo-500/20"
          >
            + Create Script
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scripts.map((script: any) => (
              <div key={script.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                    {script.script_type.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{script.name}</h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">{script.description}</p>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-hidden h-24 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>
                  {script.content}
                </div>
                <div className="mt-4 flex space-x-3">
                  <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-sm font-medium py-2 rounded-lg transition-colors">
                    Deploy
                  </button>
                  <button className="flex-1 border border-slate-700 hover:bg-slate-800 text-sm font-medium py-2 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">New Script</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreateScript} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Script Name</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      value={newScript.name} onChange={e => setNewScript({...newScript, name: e.target.value})} placeholder="e.g. Flush DNS Cache" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      value={newScript.description} onChange={e => setNewScript({...newScript, description: e.target.value})} placeholder="What does this do?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newScript.scriptType} onChange={e => setNewScript({...newScript, scriptType: e.target.value})}>
                      <option value="powershell">PowerShell</option>
                      <option value="bash">Bash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Code</label>
                    <textarea required rows={8} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      value={newScript.content} onChange={e => setNewScript({...newScript, content: e.target.value})} placeholder="ipconfig /flushdns" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-white transition-colors">Save Script</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

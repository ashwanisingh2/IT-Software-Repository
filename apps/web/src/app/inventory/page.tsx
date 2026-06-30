"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { AgentDownloadModal } from "../../components/inventory/AgentDownloadModal";
import { Monitor, Server, Trash, Plus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState<'agents' | 'manual' | 'tokens'>('agents');

  const fetchData = async () => {
    try {
      const [epRes, tkRes] = await Promise.all([
        api.get('/inventory/endpoints?limit=100'),
        api.get('/agent/enrollment-tokens')
      ]);
      setEndpoints(epRes.data.data);
      setTokens(tkRes.data.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isModalOpen]);

  const decommissionEndpoint = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this endpoint? It will no longer be tracked.")) return;
    try {
      await api.delete(`/inventory/endpoints/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to decommission");
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm("Revoke this token? Existing agents won't be affected, but new ones cannot enroll with it.")) return;
    try {
      await api.delete(`/agent/enrollment-tokens/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-8 w-8 text-primary" />
          Endpoints & Inventory
        </h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={16} /> Add Endpoint / Agent
        </Button>
      </div>

      <AgentDownloadModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      <div className="flex border-b border-border">
        <button className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'agents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('agents')}>
          Managed Endpoints
        </button>
        <button className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'tokens' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setTab('tokens')}>
          Enrollment Tokens
        </button>
      </div>

      {tab === 'agents' && (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hostname / Machine ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">OS Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Check-in</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {endpoints.map((ep) => (
                <tr key={ep.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Monitor className="h-5 w-5 text-muted-foreground mr-3" />
                      <div>
                        <div className="font-medium">{ep.hostname}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ep.machineId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{ep.osName}</div>
                    <div className="text-xs text-muted-foreground">{ep.osVersion} • {ep.osArch}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ep.status === 'active' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle size={12}/> Active</span>}
                    {ep.status === 'stale' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><AlertTriangle size={12}/> Stale</span>}
                    {ep.status === 'decommissioned' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"><XCircle size={12}/> Decommissioned</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(ep.lastCheckin).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/inventory/${ep.machineId}`} className="text-primary hover:underline">View</Link>
                    {ep.status !== 'decommissioned' && (
                      <button onClick={() => decommissionEndpoint(ep.id)} className="text-destructive hover:underline">Decommission</button>
                    )}
                  </td>
                </tr>
              ))}
              {endpoints.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No endpoints found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'tokens' && (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Token Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Token Snippet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Uses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tokens.map((tk) => (
                <tr key={tk.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{tk.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">{tk.token.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{tk.useCount} / {tk.maxUses || '∞'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tk.expiresAt ? new Date(tk.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => revokeToken(tk.id)} className="text-destructive hover:underline flex items-center justify-end gap-1 w-full"><Trash size={14}/> Revoke</button>
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No active tokens.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

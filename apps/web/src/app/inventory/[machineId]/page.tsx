"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Monitor, UploadCloud, Trash, Download } from "lucide-react";
import { DeploySoftwareModal } from "../../../components/inventory/DeploySoftwareModal";

export default function EndpointDetails({ params }: { params: { machineId: string } }) {
  const [endpoint, setEndpoint] = useState<any>(null);
  const [installedSoftware, setInstalledSoftware] = useState<any[]>([]);
  const [pendingDeployments, setPendingDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [epRes, instRes] = await Promise.all([
        api.get(`/inventory/endpoints/${params.machineId}`),
        api.get(`/inventory/endpoints/${params.machineId}/software`)
      ]);
      setEndpoint(epRes.data.data);
      setInstalledSoftware(instRes.data.data);
      
      // We would also fetch pending deployments here if the API supported getting them as an admin
      // For now, it's just the schema requirement.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.machineId, deployModalOpen]);

  const uninstallAgent = async () => {
    try {
      window.open(`/api/agent/uninstall-script`, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!endpoint) return <div>Endpoint not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{endpoint.hostname}</h1>
          <p className="text-muted-foreground">{endpoint.machineId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={uninstallAgent}>
            <Download size={16} /> Get Uninstall Script
          </Button>
          <Button className="gap-2" onClick={() => setDeployModalOpen(true)}>
            <UploadCloud size={16} /> Deploy Software
          </Button>
        </div>
      </div>

      <DeploySoftwareModal open={deployModalOpen} onOpenChange={setDeployModalOpen} machineId={params.machineId} />

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor size={18}/> System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Operating System</div>
              <div>{endpoint.osName} {endpoint.osVersion}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Architecture</div>
              <div>{endpoint.osArch}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">IP Address</div>
              <div>{endpoint.ipAddress || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Agent Version</div>
              <div>{endpoint.agentVersion || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Check-in</div>
              <div>{new Date(endpoint.lastCheckin).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Installed Software ({installedSoftware.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {installedSoftware.map(s => (
                    <tr key={s.name} className="hover:bg-muted/20">
                      <td className="px-4 py-2 text-sm font-medium">{s.name}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{s.vendor}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{s.version}</td>
                    </tr>
                  ))}
                  {installedSoftware.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No software reported.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

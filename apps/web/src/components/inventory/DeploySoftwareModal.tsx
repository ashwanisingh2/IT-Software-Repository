"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { api } from "../../lib/api";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

export function DeploySoftwareModal({ open, onOpenChange, machineId }: { open: boolean, onOpenChange: (open: boolean) => void, machineId: string }) {
  const [software, setSoftware] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.get('/software').then(res => {
        setSoftware(res.data.data);
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [open]);

  const deploy = async (softwareId: string) => {
    setDeployingId(softwareId);
    try {
      await api.post(`/inventory/endpoints/${machineId}/deploy`, { softwareId });
      alert("Deployment queued. It will run on the next agent check-in.");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Failed to queue deployment");
    } finally {
      setDeployingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deploy Software to Endpoint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search software..." className="pl-9" />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading software catalog...</div>
            ) : software.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No software available.</div>
            ) : (
              software.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30">
                  <div>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.vendor} • v{pkg.latestVersion || '1.0.0'}</div>
                  </div>
                  <Button size="sm" onClick={() => deploy(pkg.id)} disabled={deployingId === pkg.id}>
                    {deployingId === pkg.id ? "Queueing..." : "Deploy"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

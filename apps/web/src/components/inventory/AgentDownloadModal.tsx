"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api } from "../../lib/api";
import { Copy, Download, Check } from "lucide-react";

export function AgentDownloadModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [maxUses, setMaxUses] = useState("");
  const [result, setResult] = useState<{ token: string, downloadUrl: string, installCommand: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        label: label || "default",
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        maxUses: maxUses ? parseInt(maxUses) : undefined
      };
      const res = await api.post('/agent/enrollment-tokens', payload);
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setResult(null);
    setLabel("");
    setExpiresInDays("7");
    setMaxUses("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll New Endpoint</DialogTitle>
        </DialogHeader>

        {!result ? (
          <form onSubmit={generateLink} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Label (Optional)</label>
              <Input placeholder="e.g. Sales Department Batch 1" value={label} onChange={e => setLabel(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expires In</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)}>
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="">Never</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Uses</label>
                <Input type="number" placeholder="Unlimited" value={maxUses} onChange={e => setMaxUses(e.target.value)} min="1" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate Link"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="bg-muted p-4 rounded-md space-y-2 relative">
              <label className="text-xs font-semibold uppercase text-muted-foreground">PowerShell One-Liner (Run as Admin)</label>
              <code className="block text-sm break-all font-mono">
                {result.installCommand}
              </code>
              <Button size="sm" variant="secondary" className="absolute top-2 right-2 h-8" onClick={copyToClipboard}>
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground">OR</span>
              <Button className="w-full gap-2" variant="outline" onClick={() => window.open(result.downloadUrl, '_blank')}>
                <Download size={16} /> Download WinRepoAgent.ps1
              </Button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

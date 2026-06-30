"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Package, Search, Plus, Download, Edit } from "lucide-react";

export default function SoftwareCatalogPage() {
  const [software, setSoftware] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: "", vendor: "", category: "utility", version: "1.0.0", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/software?search=${search}`);
      setSoftware(res.data.data);
    } catch (error) {
      console.error("Failed to load software", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, [search]); // Very basic debouncing can be added here

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create package
      const res = await api.post("/software", {
        name: newPkg.name,
        vendor: newPkg.vendor,
        category: newPkg.category,
        description: newPkg.description
      });
      // Mock version for now as real version requires file upload to minio which is complex
      // For this demo, just refresh the list
      await fetchSoftware();
      setShowAddForm(false);
      setNewPkg({ name: "", vendor: "", category: "utility", version: "1.0.0", description: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add package");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          Software Catalog
        </h1>
        <Button className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> {showAddForm ? "Cancel" : "Add Package"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6 bg-muted/30">
          <h2 className="text-xl font-semibold mb-4">Add New Package</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={newPkg.name} onChange={e => setNewPkg({...newPkg, name: e.target.value})} required placeholder="e.g. Chrome" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor</label>
                <Input value={newPkg.vendor} onChange={e => setNewPkg({...newPkg, vendor: e.target.value})} required placeholder="e.g. Google" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newPkg.category} onChange={e => setNewPkg({...newPkg, category: e.target.value})}>
                <option value="browser">Browser</option>
                <option value="utility">Utility</option>
                <option value="security">Security</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={newPkg.description} onChange={e => setNewPkg({...newPkg, description: e.target.value})} placeholder="Description..." />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Package"}
            </Button>
          </form>
        </Card>
      )}
      
      <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search software..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {software.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">{pkg.vendor}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    {pkg.category}
                  </span>
                </div>
                <div className="mt-4 text-sm text-muted-foreground line-clamp-2">
                  {pkg.description || "No description provided."}
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
                <div className="text-sm font-medium">
                  v{pkg.latestVersion || "1.0.0"}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" title="Edit">
                    <Edit size={16} className="text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/software/${pkg.id}/download`, '_blank')}>
                    <Download size={16} /> Get
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {software.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No software packages found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

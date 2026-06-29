"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Package, MonitorSmartphone, Download, AlertTriangle } from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data.data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Loading platform metrics...</div>;
  if (!stats) return <div className="text-destructive p-4 bg-destructive/10 rounded-lg">Failed to load statistics. Ensure you are logged in as admin.</div>;

  const statCards = [
    { title: "Total Packages", value: stats.totalPackages, icon: Package, color: "text-blue-500" },
    { title: "Active Endpoints", value: stats.totalEndpoints, icon: MonitorSmartphone, color: "text-emerald-500" },
    { title: "Total Downloads", value: stats.totalDownloads, icon: Download, color: "text-indigo-500" },
    { title: "Updates Needed", value: stats.updatesNeeded, icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUploads?.map((pkg: any) => (
                <div key={pkg.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.vendor} • v{pkg.latestVersion}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(pkg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Downloaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topDownloaded?.map((pkg: any) => (
                <div key={pkg.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.category}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Download size={14} className="text-muted-foreground"/>
                    {pkg.downloadCount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

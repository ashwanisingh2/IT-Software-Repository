"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Shield } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Audit Logs
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No recent activity logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

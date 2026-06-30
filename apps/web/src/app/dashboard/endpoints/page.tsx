"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { MonitorSmartphone } from "lucide-react";

export default function EndpointsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MonitorSmartphone className="h-8 w-8 text-primary" />
          Endpoints
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <MonitorSmartphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No endpoints connected yet.</p>
            <p className="text-sm mt-2">Run the installation script on a client machine to connect it.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

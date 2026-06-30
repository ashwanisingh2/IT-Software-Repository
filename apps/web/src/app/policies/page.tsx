"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stub fetch - In a real app we'd build the /admin/policies endpoint like we did for scripts
    // For demo purposes, we'll just simulate loading from the DB
    setTimeout(() => {
      setPolicies([
        { id: '1', name: 'Disable USB Storage', policy_type: 'registry', description: 'Sets USBSTOR start value to 4', created_at: new Date().toISOString() },
        { id: '2', name: 'Power Plan - High Performance', policy_type: 'power', description: 'Sets standby timeouts to 0', created_at: new Date().toISOString() },
        { id: '3', name: 'Deploy Office Printer', policy_type: 'printer', description: 'Adds TCP/IP Printer at 192.168.1.50', created_at: new Date().toISOString() },
      ] as any);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Configuration Policies</h1>
            <p className="mt-2 text-sm text-slate-400">Enforce Registry, Power, and Device configurations across the fleet.</p>
          </div>
          <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-lg font-medium text-white shadow-lg shadow-emerald-500/20">
            + New Policy
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Description</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Created At</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-transparent">
                {policies.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{p.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        {p.policy_type}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-300">{p.description}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-emerald-400 hover:text-emerald-300 mr-4">Deploy</button>
                      <button className="text-slate-400 hover:text-white">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

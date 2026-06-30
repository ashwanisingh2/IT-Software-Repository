"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-rose-500/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Security & Compliance</h1>
            <p className="mt-2 text-sm text-slate-400">Endpoint compliance evaluations based on BitLocker, Firewall, and AV.</p>
          </div>
          <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 transition-colors rounded-lg font-medium text-white shadow-lg shadow-rose-500/20">
            Run Assessment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Summary Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Overall Compliance</h3>
              <div className="mt-4 flex items-baseline text-6xl font-extrabold text-white">
                85<span className="text-2xl text-slate-500 ml-1">%</span>
              </div>
              <p className="mt-4 text-sm text-emerald-400">↑ 5% from last week</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Risk Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">BitLocker Disabled</span>
                    <span className="text-rose-400 font-medium">12 Devices</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">Missing AntiVirus</span>
                    <span className="text-amber-400 font-medium">4 Devices</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">Unpatched Vulnerabilities (Critical)</span>
                    <span className="text-rose-500 font-medium">28 Devices</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-rose-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden lg:col-span-3 mt-6">
              <div className="px-6 py-5 border-b border-slate-800">
                <h3 className="text-lg font-medium text-white">Non-Compliant Endpoints</h3>
              </div>
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Hostname</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Violation</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Seen</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-6">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-transparent">
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">DESKTOP-HR2810</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-rose-400 font-medium">BitLocker Suspended</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">2 mins ago</td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                      <button className="text-indigo-400 hover:text-indigo-300">Enforce Policy</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">LAPTOP-DEV04</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-amber-400 font-medium">AV Not Running</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">1 hour ago</td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                      <button className="text-indigo-400 hover:text-indigo-300">Restart AV Service</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

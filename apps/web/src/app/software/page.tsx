'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { SOFTWARE_CATEGORIES } from '@winrepo/shared';

export default function SoftwareCatalog() {
  const [softwareList, setSoftwareList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/software')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.items) {
          setSoftwareList(data.data.items);
        }
      })
      .catch(err => console.error("Failed to fetch software", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Software Repository</h1>
        <Link 
          href="/software/upload" 
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload Package
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search software packages..."
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-gray-400" />
          <select className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="">All Categories</option>
            {SOFTWARE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Software Grid */}
      {loading ? (
         <div className="py-12 text-center text-gray-500">Loading software...</div>
      ) : softwareList.length === 0 ? (
         <div className="py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">No software packages found. Upload one to get started!</div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {softwareList.map((software) => (
          <div key={software.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <Link href={`/software/${software.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {software.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{software.vendor}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {software.category}
                </span>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 font-mono">v{software.version}</span>
                <span className="flex items-center text-gray-500 dark:text-gray-400">
                  <Download className="h-4 w-4 mr-1" />
                  {software.downloads || 0}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href={`/software/${software.id}`} 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View Details &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

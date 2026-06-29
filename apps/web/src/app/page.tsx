import Link from "next/link";
import { Server, Download, ShieldCheck, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">WinRepo Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Downloads</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">1,204</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Software Packages</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">45</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Endpoints Managed</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">128</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">KB Articles</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
         <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Recent Uploads</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
               <li className="py-3 flex justify-between">
                 <span className="text-sm font-medium">Google Chrome (124.0.0)</span>
                 <span className="text-sm text-gray-500">2 hours ago</span>
               </li>
               <li className="py-3 flex justify-between">
                 <span className="text-sm font-medium">Visual Studio Code (1.90.0)</span>
                 <span className="text-sm text-gray-500">5 hours ago</span>
               </li>
            </ul>
            <div className="mt-4">
              <Link href="/software" className="text-sm font-medium text-blue-600 hover:text-blue-500">View all software &rarr;</Link>
            </div>
         </div>
      </div>
    </div>
  );
}

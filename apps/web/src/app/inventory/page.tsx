import { Monitor, AlertTriangle, CheckCircle } from 'lucide-react';

const MOCK_INVENTORY = [
  { machine_id: 'DESKTOP-1A2B3C', hostname: 'DEV-WKSTN-01', os: 'Windows 11 Pro 23H2', last_checkin: '10 mins ago', status: 'healthy', updates_needed: 0 },
  { machine_id: 'LAPTOP-X9Y8Z7', hostname: 'SALES-LT-42', os: 'Windows 10 Pro 22H2', last_checkin: '2 hours ago', status: 'warning', updates_needed: 3 },
  { machine_id: 'SERVER-DB-01', hostname: 'PROD-DB-01', os: 'Windows Server 2022', last_checkin: '1 min ago', status: 'healthy', updates_needed: 0 },
  { machine_id: 'DESKTOP-M4N5P6', hostname: 'HR-WKSTN-05', os: 'Windows 10 Pro 21H2', last_checkin: '5 days ago', status: 'offline', updates_needed: 5 },
];

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Endpoint Inventory</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hostname / ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  OS Version
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Check-in
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {MOCK_INVENTORY.map((endpoint) => (
                <tr key={endpoint.machine_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Monitor className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{endpoint.hostname}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">{endpoint.machine_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{endpoint.os}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {endpoint.status === 'healthy' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                         <CheckCircle className="w-3 h-3 mr-1" /> Up to date
                       </span>
                    )}
                    {endpoint.status === 'warning' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                         <AlertTriangle className="w-3 h-3 mr-1" /> {endpoint.updates_needed} Updates
                       </span>
                    )}
                    {endpoint.status === 'offline' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                         Offline
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {endpoint.last_checkin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/inventory/${endpoint.machine_id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

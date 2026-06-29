import { Shield, ShieldAlert, Key } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', email: 'admin@winrepo.local', role: 'super_admin', created_at: '2024-01-01' },
  { id: '2', email: 'john.deployer@company.com', role: 'deployer', created_at: '2024-02-15' },
  { id: '3', email: 'support.viewer@company.com', role: 'viewer', created_at: '2024-03-10' },
];

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
          Invite User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">ID: {user.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.role === 'super_admin' && <Key className="h-4 w-4 text-purple-500" />}
                    {user.role === 'deployer' && <ShieldAlert className="h-4 w-4 text-blue-500" />}
                    {user.role === 'viewer' && <Shield className="h-4 w-4 text-gray-400" />}
                    <select 
                      defaultValue={user.role}
                      disabled={user.role === 'super_admin'}
                      className="bg-transparent text-sm border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="deployer">Deployer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.created_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.role !== 'super_admin' && (
                    <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-4">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

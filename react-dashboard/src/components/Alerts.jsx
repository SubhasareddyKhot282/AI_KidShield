import React, { useEffect, useState } from 'react';
import { fetchAlerts } from '../api';
import { Bell, Search, Filter } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    fetchAlerts(50).then(setAlerts).catch(console.error);
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Full Alert History</h2>
          <p className="text-gray-500 mt-1">Review all intercepted activities and assigned risk levels.</p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No alerts found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Timestamp</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Category</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Severity</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alerts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-500 font-mono">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-700 capitalize">
                    {a.category.replace('_', ' ')}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                      a.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      a.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700 max-w-sm truncate" title={a.content}>
                    {a.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

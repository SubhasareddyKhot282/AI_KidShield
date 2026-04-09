import React, { useEffect, useState } from 'react';
import { fetchActivity } from '../api';
import { RefreshCw, AlertCircle, ShieldCheck, Activity } from 'lucide-react';

export default function History() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivity();
      setActivities(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch activity history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="text-center mt-32"><div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div><p className="mt-6 text-blue-300/80 animate-pulse font-medium tracking-wide">Syncing monitoring logs...</p></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Machine Logs</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Real-time analysis of intercepted activities and keystrokes.</p>
        </div>
        <button onClick={loadData} className="flex items-center px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl shadow-lg hover:shadow-blue-500/20 hover:bg-white/10 hover:-translate-y-0.5 text-sm font-semibold text-slate-200 transition-all duration-300 backdrop-blur-md">
          <RefreshCw size={16} className="mr-2 text-blue-400" /> Refresh Log
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <AlertCircle className="mr-3" /> {error}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/50">
                <th className="py-5 px-6 font-semibold text-slate-300 text-sm tracking-wide">Timestamp</th>
                <th className="py-5 px-6 font-semibold text-slate-300 text-sm tracking-wide">Application</th>
                <th className="py-5 px-6 font-semibold text-slate-300 text-sm tracking-wide">Content Hash / Transcript</th>
                <th className="py-5 px-6 font-semibold text-slate-300 text-sm tracking-wide">Analysis</th>
                <th className="py-5 px-6 font-semibold text-slate-300 text-sm text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity size={24} className="text-slate-500" />
                    </div>
                    <span className="text-slate-500 font-medium">No activity registered on endpoint.</span>
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-6 text-sm text-slate-400 font-mono text-xs">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 shadow-inner">
                        {item.application}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300 max-w-md truncate" title={item.content}>
                      {item.content}
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        let severity = 'Safe';
                        let colorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
                        if (item.is_harmful) {
                           const cat = (item.category || '').toLowerCase();
                           if (['drugs', 'dangerous_challenges', 'violence'].includes(cat)) {
                             severity = 'Critical';
                             colorClass = 'bg-red-500/10 text-red-500 border border-red-500/30';
                           } else if (['adult', 'phishing'].includes(cat)) {
                             severity = 'High';
                             colorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
                           } else {
                             severity = 'Medium';
                             colorClass = 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
                           }
                        }
                        return (
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm ${colorClass}`}>
                            {severity} • {item.category.replace('_', ' ')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.is_harmful ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                          <AlertCircle size={16} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                           <ShieldCheck size={16} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

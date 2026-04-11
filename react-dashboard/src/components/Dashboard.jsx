import React, { useEffect, useState } from 'react';
import { fetchStats, fetchAlerts, fetchTrend } from '../api';
import { io } from 'socket.io-client';
import { ShieldAlert, AlertTriangle, Activity, Ban, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, alertsData, trendData] = await Promise.all([
        fetchStats(), fetchAlerts(15), fetchTrend()
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      
      if (trendData && trendData.length > 0) {
        setTrend({
          labels: trendData.map(d => d.date),
          datasets: [
            {
              label: 'Total Incidents',
              data: trendData.map(d => d.total),
              borderColor: 'rgba(59, 130, 246, 1)', // Blue-500
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'High/Critical',
              data: trendData.map(d => d.drugs + d.violence + d.phishing),
              borderColor: 'rgba(239, 68, 68, 1)', // Red-500
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => console.log('Connected to real-time events'));

    newSocket.on('new_alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev].slice(0, 15));
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_alerts: prev.total_alerts + 1,
          alerts_today: prev.alerts_today + 1,
          critical_today: newAlert.severity === 'critical' ? prev.critical_today + 1 : prev.critical_today
        };
      });
    });

    return () => newSocket.close();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium tracking-wide">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Real-Time Monitoring</h2>
          <p className="text-gray-500 mt-1">Live status of {stats?.child_name || 'Protected Device'}.</p>
        </div>
        <button onClick={loadData} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
          <RefreshCw size={16} className="mr-2 text-gray-400" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[ 
          { label: 'Risk Score', value: stats?.risk_score || 0, suffix: '/100', icon: Activity, color: 'blue' },
          { label: 'Critical Alerts', value: stats?.critical_today || 0, suffix: '', icon: (stats?.critical_today > 0 ? AlertTriangle : ShieldCheck), color: (stats?.critical_today > 0 ? 'red' : 'green') },
          { label: 'Blocked URLs', value: stats?.blocked_urls || 0, suffix: '', icon: Ban, color: 'orange' },
          { label: 'Total Intercepts', value: stats?.total_alerts || 0, suffix: '', icon: ShieldAlert, color: 'indigo' }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">
                {card.value}<span className="text-lg text-gray-400 font-medium ml-1">{card.suffix}</span>
              </h3>
            </div>
            <div className={`p-3 rounded-xl bg-${card.color}-50 text-${card.color}-600`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Alerts Feed */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center mb-6">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-lg font-bold text-gray-900">Live Alerts Feed</h3>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No recent alerts found.</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity} • {alert.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate" title={alert.content}>{alert.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">7-Day Incident Trend</h3>
          <div className="flex-1 w-full relative min-h-[300px]">
            {trend ? (
              <Line 
                data={trend} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { grid: { color: '#f3f4f6' }, border: { dash: [4, 4] } },
                    x: { grid: { color: '#f3f4f6' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#6b7280', usePointStyle: true } }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Loading chart data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

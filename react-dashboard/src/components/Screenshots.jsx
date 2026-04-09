import React, { useEffect, useState } from 'react';
import { fetchScreenshots } from '../api';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';

export default function Screenshots({ childEmail }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScreenshots(childEmail);
      setImages(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch screenshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childEmail]);

  if (loading) return <div className="text-center mt-32"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div><p className="mt-6 text-indigo-300/80 animate-pulse font-medium tracking-wide">Decrypting visual evidence...</p></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Captured Screens</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Auto-recorded visual evidence during high-risk alerts.</p>
        </div>
        <button onClick={loadData} className="flex items-center px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:bg-white/10 hover:-translate-y-0.5 text-sm font-semibold text-slate-200 transition-all duration-300 backdrop-blur-md">
          <RefreshCw size={16} className="mr-2 text-indigo-400" /> Refresh Data
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <AlertCircle className="mr-3" /> {error}
        </div>
      )}

      {images.length === 0 && !error ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg backdrop-blur-xl">
          <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No screenshots found in archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((img) => (
            <div key={img.id} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)] hover:-translate-y-2 transition-all duration-500 group backdrop-blur-md">
              <div className="relative aspect-video bg-black/60 flex items-center justify-center overflow-hidden border-b border-white/5">
                <img 
                  src={img.url} 
                  alt="Screenshot" 
                  className="object-cover w-full h-full opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                  <a href={img.url} target="_blank" rel="noreferrer" className="bg-indigo-500/80 backdrop-blur-md text-white p-3 rounded-full hover:bg-indigo-500 hover:scale-110 transition-all shadow-[0_0_30px_rgba(99,102,241,0.6)]">
                    <Download size={22} />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-200 truncate">{img.originalName}</h3>
                    <p className="text-xs text-slate-400 mt-2 flex items-center font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span> 
                      {new Date(img.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

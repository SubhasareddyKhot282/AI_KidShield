import React, { useEffect, useState } from 'react';
import { fetchAudio } from '../api';
import { RefreshCw, Mic, AlertCircle, Headphones } from 'lucide-react';

export default function AudioLogs({ childEmail }) {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAudio(childEmail);
      setAudios(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch audio recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childEmail]);

  if (loading) return <div className="text-center mt-32"><div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div><p className="mt-6 text-purple-300/80 animate-pulse font-medium tracking-wide">Retrieving voice transcripts...</p></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Voice Archives</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Encrypted audio intercepts flagged by sentiment analysis.</p>
        </div>
        <button onClick={loadData} className="flex items-center px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl shadow-lg hover:shadow-purple-500/20 hover:bg-white/10 hover:-translate-y-0.5 text-sm font-semibold text-slate-200 transition-all duration-300 backdrop-blur-md">
          <RefreshCw size={16} className="mr-2 text-purple-400" /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <AlertCircle className="mr-3" /> {error}
        </div>
      )}

      {audios.length === 0 && !error ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg backdrop-blur-xl">
          <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No audio interceptions found.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-5">
          {audios.map((audio) => (
            <div key={audio.id} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 backdrop-blur-md group">
              <div className="flex items-center space-x-6 flex-grow border-b md:border-b-0 pb-5 md:pb-0 border-slate-700/50">
                <div className="bg-purple-500/10 p-4 rounded-2xl text-purple-400 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                  <Headphones size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-lg">{audio.originalName}</h3>
                  <p className="text-sm font-medium text-slate-400 mt-1 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></span>
                    {new Date(audio.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-end">
                <audio controls className="w-full h-12 outline-none rounded-2xl shadow-inner bg-slate-900/50 grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100 styled-audio">
                  <source src={audio.url} type={audio.mimeType || 'audio/wav'} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

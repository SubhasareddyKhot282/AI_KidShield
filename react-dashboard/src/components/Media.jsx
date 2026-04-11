import React, { useState, useEffect } from 'react';
import { Image, Lock, Unlock, Trash2, Mic, PlayCircle, Download } from 'lucide-react';
import { fetchScreenshots, fetchAudio, lockMedia, deleteMedia } from '../api';

export default function Media() {
  const [activeTab, setActiveTab] = useState('images');
  const [images, setImages] = useState([]);
  const [audioItems, setAudioItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const childEmail = 'child@safeguard.local'; // Fixed testing email

  const loadMedia = async () => {
    setLoading(true);
    try {
      if (activeTab === 'images') {
        const data = await fetchScreenshots(childEmail);
        setImages(data || []);
      } else {
        const data = await fetchAudio(childEmail);
        setAudioItems(data || []);
      }
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [activeTab]);

  const handleAction = async (actionFn, id) => {
    const key = window.prompt("Enter Secret Key to proceed:");
    if (!key) return;
    try {
      await actionFn(id, key);
      await loadMedia(); // refresh list
    } catch (e) {
      window.alert("Action failed: Invalid secret key or server error.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Media Evidence</h2>
          <p className="text-gray-500 mt-1">Review captured screenshots and audio recordings.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'images' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('images')}
          >
            <Image size={16} className="inline mr-2" /> Screenshots
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'audio' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('audio')}
          >
            <Mic size={16} className="inline mr-2" /> Audio Recordings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'images' ? (
        images.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Image size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No screenshots captured yet</h3>
              <p className="text-gray-500">When the device is active, intercepted images will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map(img => (
              <div key={img.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group">
                <div className="aspect-video bg-gray-100 relative group overflow-hidden">
                  {img.isLocked ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50 text-blue-500">
                      <Lock size={32} className="mb-2" />
                      <span className="font-semibold text-sm">Evidence Locked</span>
                    </div>
                  ) : (
                    <>
                      <img src={img.url} alt="Screenshot" className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                        <a href={img.url} target="_blank" rel="noreferrer" className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                          <Download size={20} />
                        </a>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[200px] flex items-center">
                      {img.isLocked && <Lock size={12} className="inline mr-1 text-blue-500" />} {img.originalName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{new Date(img.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleAction(lockMedia, img.id)} className={`transition-colors ${img.isLocked ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`} title={img.isLocked ? "Unlock Access" : "Lock File"}>
                      {img.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    {!img.isLocked && (
                      <button onClick={() => handleAction(deleteMedia, img.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete File">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        audioItems.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                <Mic size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No audio recordings available</h3>
              <p className="text-gray-500">Triggered audio segments over the threshold will be logged here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {audioItems.map(audio => (
              <div key={audio.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm mr-4 ${audio.isLocked ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-600'}`}>
                    {audio.isLocked ? <Lock size={24} /> : <Mic size={24} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      {audio.isLocked && <Lock size={12} className="inline mr-1 text-blue-500" />} {audio.originalName}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">{new Date(audio.createdAt).toLocaleString()} • High Risk Interception</p>
                    {audio.isLocked ? (
                      <div className="h-8 mt-2 flex items-center text-blue-600 text-sm font-semibold italic bg-blue-50 px-3 rounded-lg w-fit">
                        Access to audio is locked.
                      </div>
                    ) : (
                      <audio controls src={audio.url} type="audio/wav" className="h-8 mt-2 w-64"></audio>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {!audio.isLocked && (
                    <a href={audio.url} download className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors" title="Download">
                      <Download size={20} />
                    </a>
                  )}
                  <button onClick={() => handleAction(lockMedia, audio.id)} className={`p-2 rounded-lg transition-colors ${audio.isLocked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`} title="Toggle Lock">
                    {audio.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                  </button>
                  {!audio.isLocked && (
                    <button onClick={() => handleAction(deleteMedia, audio.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

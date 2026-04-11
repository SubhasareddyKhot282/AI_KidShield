import React, { useState } from 'react';
import { Search, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { checkContent } from '../api';

export default function SuspiciousChecker() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await checkContent(text);
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult({ error: "Failed to analyze content." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8 text-center mt-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
          <Search size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Content Analyzer</h2>
        <p className="text-gray-500 mt-2">Paste a sentence or URL to scan for potential threats manually.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Input Content or Link</label>
        <textarea 
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none placeholder-gray-400"
          placeholder="e.g. Look at this cool new challenge game..."
        ></textarea>
        
        <div className="mt-6 flex justify-end">
          <button 
            disabled={loading || !text}
            onClick={handleCheck}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center disabled:bg-gray-300"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : <Search size={18} className="mr-2" />} 
            Analyze Content
          </button>
        </div>

        {result && !result.error && (
            <div className={`mt-8 p-6 rounded-2xl border ${result.is_harmful ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center">
                    {result.is_harmful ? <AlertTriangle className="text-red-500 mr-3" /> : <ShieldCheck className="text-green-500 mr-3" />}
                    <h3 className={`text-lg font-bold ${result.is_harmful ? 'text-red-800' : 'text-green-800'}`}>
                        {result.is_harmful ? `Suspicious: ${result.category}` : 'Safe Content'}
                    </h3>
                </div>
                <p className={`mt-2 text-sm ${result.is_harmful ? 'text-red-600' : 'text-green-600'}`}>
                    Confidence Score: {result.confidence.toFixed(2)}%
                </p>
            </div>
        )}
      </div>
      
      <div className="mt-6 flex items-start p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm">
        <Info size={20} className="mr-3 flex-shrink-0 mt-0.5" />
        <p>This tool utilizes the same Natural Language Processing (NLP) model running on the protected device. Data submitted here is not stored in the permanent threat logs.</p>
      </div>
    </div>
  );
}

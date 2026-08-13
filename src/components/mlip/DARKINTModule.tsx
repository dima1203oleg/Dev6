import React, { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export const DARKINTModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/mlip/darkint/ahmia?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-lg shadow-sm border border-red-900/50">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-red-500" />
          DARKINT Module — DarkNet Intelligence
        </h3>
        <p className="text-sm text-red-400 mb-4 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1" />
          WARNING: This module requires RED or BLACK access level. Search results may contain sensitive or illicit materials.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 rounded-md border border-slate-700 bg-slate-800 text-white px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="Enter keyword for Tor Hidden Services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium disabled:opacity-50 shadow-lg shadow-red-900/20"
          >
            {loading ? 'Scanning Tor...' : 'Execute Scan'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-700">
          <h4 className="font-semibold text-white mb-4">DarkNet Onion Links</h4>
          <pre className="bg-black text-red-400 p-4 rounded-md overflow-x-auto text-sm font-mono border border-slate-800">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

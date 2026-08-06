import React, { useState } from 'react';
import { Search, Server, Globe } from 'lucide-react';

export const OSIModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/mlip/osi/whois?domain=${encodeURIComponent(query)}`);
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-500" />
          OSI Module — Whois & Domain Intel
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter domain (e.g., example.com)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Scan'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Server className="w-4 h-4 mr-2" /> Results
          </h4>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

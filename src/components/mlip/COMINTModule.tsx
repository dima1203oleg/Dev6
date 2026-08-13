import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';

export const COMINTModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const type = query.includes('@') ? 'EMAIL' : 'PHONE';
      const res = await fetch(`/api/v1/mlip/comint/breach?q=${encodeURIComponent(query)}&type=${type}`);
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
          <Fingerprint className="w-5 h-5 mr-2 text-indigo-500" />
          COMINT Module — Breach DB & Identity
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Enter Email or Phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Scan'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-4">Breach Results</h4>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

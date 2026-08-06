import React, { useState } from 'react';
import { Share2, Link, Filter } from 'lucide-react';

export const EntityResolutionPanel: React.FC = () => {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);

  const resolveEntity = async () => {
    if (!target) return;
    setLoading(true);
    // Simulated call to EntityResolutionEngine (mocked for UI context)
    setTimeout(() => {
      setGraphData({
        nodes: [
          { id: '1', label: target, type: 'PERSON' },
          { id: '2', label: 'Company A LLC', type: 'COMPANY' },
          { id: '3', label: 'example@gmail.com', type: 'EMAIL' }
        ],
        edges: [
          { from: '1', to: '2', label: 'DIRECTOR' },
          { from: '1', to: '3', label: 'OWNS' }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2 text-indigo-500" />
          Entity Resolution Engine
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Resolve complex identities, merge duplicates using Jaro-Winkler, and build Neo4j graph schemas.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Enter Entity Name or ID (e.g., EDRPOU)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button
            onClick={resolveEntity}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Resolving...' : 'Resolve Graph'}
          </button>
        </div>
      </div>

      {graphData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
            <Share2 className="w-4 h-4 mr-2 text-indigo-500" /> Graph Preview
          </h4>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-md min-h-[300px] flex items-center justify-center relative">
            {/* Visual placeholder for React Flow / Neo4j Viewer */}
            <div className="absolute top-4 right-4 bg-white px-3 py-1 text-xs border border-slate-200 rounded-full shadow-sm text-slate-600 flex items-center">
              <Filter className="w-3 h-3 mr-1" />
              Nodes: {graphData.nodes.length} | Edges: {graphData.edges.length}
            </div>
            
            <div className="text-center">
              <pre className="text-left bg-slate-900 text-indigo-300 p-4 rounded text-xs font-mono max-w-lg overflow-auto">
                {JSON.stringify(graphData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

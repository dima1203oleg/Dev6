import React from 'react';
import { Share2 } from 'lucide-react';

// Wrapper for Graph UI, separating the MLIP module logic from visual representation
export const GraphViewer: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div className="p-4 text-slate-500 text-center">No graph data available.</div>;

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center text-white/50 text-sm">
        <Share2 className="w-4 h-4 mr-2" />
        Neo4j / Vis.js Canvas Placeholder
      </div>
      
      <div className="mt-8">
        <h4 className="text-indigo-400 font-mono text-sm mb-2">Nodes</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {data.nodes?.map((n: any) => (
            <div key={n.id} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 rounded-full text-xs">
              {n.label} <span className="opacity-50 ml-1">({n.type})</span>
            </div>
          ))}
        </div>

        <h4 className="text-fuchsia-400 font-mono text-sm mb-2">Edges</h4>
        <div className="flex flex-col gap-2">
          {data.edges?.map((e: any, i: number) => (
            <div key={i} className="px-3 py-2 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-200 rounded text-xs flex justify-between max-w-sm">
              <span>Node {e.from}</span>
              <span className="font-bold px-2">--[{e.label}]-&gt;</span>
              <span>Node {e.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

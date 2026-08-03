import { useState } from "react";

export function useInvestigationSync(id?: string, initialNodes?: any[], initialLinks?: any[]) {
  const [nodes, setNodes] = useState(initialNodes || []);
  const [links, setLinks] = useState(initialLinks || []);

  return {
    syncStatus: "synced",
    nodes,
    links,
    setNodes: (n: any) => setNodes(n),
    setLinks: (l: any) => setLinks(l),
    lastSyncedAt: new Date().toISOString(),
    cloudSynced: true,
    saveNow: async (...args: any[]) => console.log("Saving now...", args),
  };
}

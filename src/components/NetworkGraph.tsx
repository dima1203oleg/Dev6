import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Network } from "lucide-react";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
  confidence: number;
}

interface NetworkGraphProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
}

export default function NetworkGraph({ data }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height] as any);

    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.confidence / 10));

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d: any) => d.type === "PERSON" ? 12 : 8)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .call(drag(simulation) as any);

    node.append("title")
      .text(d => `${d.name} (${d.type})`);

    const label = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .text(d => d.name);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => simulation.stop();
  }, [data]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Network size={16} className="text-blue-400" />
          Relationship Graph
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-slate-500 uppercase">Person</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[10px] text-slate-500 uppercase">Company</span>
          </div>
        </div>
      </div>
      <div className="w-full aspect-[16/10] bg-slate-950/50 rounded-xl overflow-hidden cursor-move">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      <div className="absolute bottom-10 left-10 p-4 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-800 text-[10px] text-slate-500 space-y-1">
        <div>• Scroll to Zoom</div>
        <div>• Drag to Pan</div>
        <div>• Double click node to Expand</div>
      </div>
    </div>
  );
}

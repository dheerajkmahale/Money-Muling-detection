import React, { useRef, useEffect, useCallback } from "react";
import { GraphNode, GraphEdge } from "@/types/fraud";
import ForceGraph2D from "react-force-graph-2d";

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  suspiciousSet: Set<string>;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  suspiciousSet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 500 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const graphData = {
    nodes: nodes.map(n => ({
      id: n.id,
      suspicious: n.suspicious,
      score: n.score,
      val: n.suspicious ? Math.max(2, n.score / 20) : 1,
    })),
    links: edges.slice(0, 1000).map(e => ({
      source: e.source,
      target: e.target,
      amount: e.amount,
    })),
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.id;
    const fontSize = Math.max(8, 12 / globalScale);
    const r = node.suspicious ? Math.max(6, 3 + node.score / 15) : 4;

    // Draw glow for suspicious
    if (node.suspicious) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.score >= 70
        ? "rgba(239,68,68,0.2)"
        : node.score >= 40
        ? "rgba(234,179,8,0.2)"
        : "rgba(59,130,246,0.15)";
      ctx.fill();
    }

    // Draw node
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.suspicious
      ? node.score >= 70
        ? "hsl(0,84%,60%)"
        : node.score >= 40
        ? "hsl(45,100%,55%)"
        : "hsl(210,100%,60%)"
      : "hsl(155,100%,40%)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Label
    if (globalScale >= 0.8) {
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(200,255,200,0.85)";
      ctx.fillText(label.length > 8 ? label.slice(0, 8) + "…" : label, node.x, node.y + r + 2);
    }
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        No graph data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-background/80 backdrop-blur-sm p-3 rounded-md border border-border/50">
        <p className="text-xs font-mono text-muted-foreground mb-1">Legend</p>
        {[
          { color: "hsl(0,84%,60%)", label: "High risk (70+)" },
          { color: "hsl(45,100%,55%)", label: "Medium risk (40+)" },
          { color: "hsl(210,100%,60%)", label: "Low risk" },
          { color: "hsl(155,100%,40%)", label: "Clean account" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-mono text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-md border border-border/50">
        <p className="text-xs font-mono text-muted-foreground">{nodes.length} nodes · {Math.min(edges.length, 1000)} edges</p>
      </div>

      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={() => "rgba(100,255,150,0.15)"}
        linkWidth={0.8}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        nodeLabel={(node: any) =>
          `${node.id}${node.suspicious ? ` — Score: ${node.score}` : " — Clean"}`
        }
        cooldownTicks={100}
        onEngineStop={() => {}}
      />
    </div>
  );
};

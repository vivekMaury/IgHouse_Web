"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "../nodes";
import { FlowToolbar } from "./flow-toolbar";
import type { NodeData, FlowDefinition } from "@/lib/engine/schema";

let nodeIdCounter = 0;
function getNodeId() {
  return `node_${++nodeIdCounter}_${Date.now()}`;
}

export function FlowCanvas({
  initialDefinition,
  onSave,
  saving,
}: {
  initialDefinition?: FlowDefinition;
  onSave: (definition: FlowDefinition) => void;
  saving?: boolean;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const initialNodes: Node[] = (initialDefinition?.nodes ?? []).map((n) => ({
    id: n.id,
    type: n.data.type,
    position: n.position ?? { x: 250, y: 0 },
    data: n.data,
  }));

  const initialEdges: Edge[] = (initialDefinition?.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    animated: true,
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const handleAddNode = useCallback(
    (data: NodeData) => {
      const id = getNodeId();
      const newNode: Node = {
        id,
        type: data.type,
        position: { x: 250, y: (nodes.length + 1) * 120 },
        data,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const handleSave = useCallback(() => {
    const definition: FlowDefinition = {
      nodes: nodes.map((n) => ({
        id: n.id,
        data: n.data as NodeData,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
      })),
    };
    onSave(definition);
  }, [nodes, edges, onSave]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <FlowToolbar onAddNode={handleAddNode} />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
      </div>

      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[16, 16]}
          fitView
          deleteKeyCode="Delete"
          className="bg-muted/20"
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor="hsl(var(--border))"
            nodeColor="hsl(var(--muted))"
            maskColor="hsl(var(--background) / 0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

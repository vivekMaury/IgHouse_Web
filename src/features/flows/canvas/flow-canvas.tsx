"use client";

import { useCallback, useRef, useState } from "react";
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
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "../nodes";
import { FlowToolbar } from "./flow-toolbar";
import { NodeConfigPanel } from "../panels/node-config-panel";
import { validateFlow, type ValidationError } from "./flow-validation";
import type { NodeData, FlowDefinition } from "@/lib/engine/schema";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidation, setShowValidation] = useState(false);

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
          eds,
        ),
      );
    },
    [setEdges],
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
      setSelectedNodeId(id);
    },
    [nodes.length, setNodes],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDataChange = useCallback(
    (nodeId: string, newData: NodeData) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n)),
      );
    },
    [setNodes],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const getDefinition = useCallback((): FlowDefinition => ({
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
  }), [nodes, edges]);

  const handleSave = useCallback(() => {
    const def = getDefinition();
    const errors = validateFlow(def);
    setValidationErrors(errors);
    setShowValidation(true);

    const hasErrors = errors.some((e) => e.severity === "error");
    if (hasErrors) return;

    onSave(def);
  }, [getDefinition, onSave]);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  const errorCount = validationErrors.filter((e) => e.severity === "error").length;
  const warnCount = validationErrors.filter((e) => e.severity === "warning").length;

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
          <FlowToolbar onAddNode={handleAddNode} />
          <div className="flex items-center gap-2">
            {showValidation && validationErrors.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> {errorCount} error{errorCount > 1 ? "s" : ""}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> {warnCount} warning{warnCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
            {showValidation && validationErrors.length === 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Valid
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>

        {showValidation && validationErrors.length > 0 && (
          <div className="border-b border-border/60 bg-muted/30 px-4 py-2 space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                {err.severity === "error" ? (
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                )}
                <span className={err.severity === "error" ? "text-destructive" : "text-amber-600"}>
                  {err.message}
                </span>
              </div>
            ))}
          </div>
        )}

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
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

      {selectedNode && (
        <NodeConfigPanel
          nodeId={selectedNode.id}
          data={selectedNode.data as NodeData}
          onChange={(newData) => handleNodeDataChange(selectedNode.id, newData)}
          onClose={() => setSelectedNodeId(null)}
          onDelete={() => handleDeleteNode(selectedNode.id)}
        />
      )}
    </div>
  );
}

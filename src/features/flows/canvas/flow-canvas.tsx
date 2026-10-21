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
  ConnectionLineType,
  MarkerType,
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
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

let nodeIdCounter = 0;
function getNodeId() {
  return `node_${++nodeIdCounter}_${Date.now()}`;
}

const defaultEdgeOptions: Omit<Edge, "id" | "source" | "target"> = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "hsl(var(--muted-foreground))",
    width: 16,
    height: 16,
  },
};

const connectionLineStyle = {
  stroke: "hsl(var(--ring))",
  strokeWidth: 2,
};

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
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
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
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "hsl(var(--muted-foreground))",
      width: 16,
      height: 16,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 1.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "hsl(var(--muted-foreground))",
              width: 16,
              height: 16,
            },
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
        position: { x: 250, y: (nodes.length + 1) * 140 },
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
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const getDefinition = useCallback(
    (): FlowDefinition => ({
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
    }),
    [nodes, edges],
  );

  const handleSave = useCallback(() => {
    const def = getDefinition();
    const errors = validateFlow(def);
    setValidationErrors(errors);
    setShowValidation(true);

    const hasErrors = errors.some((e) => e.severity === "error");
    if (hasErrors) return;

    onSave(def);
  }, [getDefinition, onSave]);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  const errorCount = validationErrors.filter(
    (e) => e.severity === "error",
  ).length;
  const warnCount = validationErrors.filter(
    (e) => e.severity === "warning",
  ).length;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar + save */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
          <FlowToolbar onAddNode={handleAddNode} />
          <div className="flex items-center gap-2">
            {showValidation && validationErrors.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> {errorCount} error
                    {errorCount > 1 ? "s" : ""}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> {warnCount}{" "}
                    warning{warnCount > 1 ? "s" : ""}
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
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>

        {/* Validation errors banner */}
        {showValidation && validationErrors.length > 0 && (
          <div className="border-b border-border/60 bg-muted/30 px-4 py-2 space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                {err.severity === "error" ? (
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                )}
                <span
                  className={
                    err.severity === "error"
                      ? "text-destructive"
                      : "text-amber-600"
                  }
                >
                  {err.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div
          ref={reactFlowWrapper}
          className="relative min-h-0 flex-1"
          style={{ width: "100%", height: "100%" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={connectionLineStyle}
            snapToGrid
            snapGrid={[16, 16]}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode="Delete"
            className="bg-muted/20"
          >
            <Background gap={16} size={1} />
            <Controls
              showInteractive={false}
              className="rounded-lg border border-border/60 bg-background shadow-sm"
            />
            <MiniMap
              nodeStrokeColor="hsl(var(--border))"
              nodeColor="hsl(var(--muted))"
              maskColor="hsl(var(--background) / 0.7)"
              className="rounded-lg border border-border/60"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background/90 px-8 py-6 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Start building your flow
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a Trigger node from the toolbar to begin
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Config panel */}
      {selectedNode && (
        <NodeConfigPanel
          nodeId={selectedNode.id}
          data={selectedNode.data as NodeData}
          onChange={(newData) =>
            handleNodeDataChange(selectedNode.id, newData)
          }
          onClose={() => setSelectedNodeId(null)}
          onDelete={() => handleDeleteNode(selectedNode.id)}
        />
      )}
    </div>
  );
}

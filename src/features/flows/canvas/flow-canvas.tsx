"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
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
import { useUndoRedo } from "./use-undo-redo";
import type { NodeData, FlowDefinition } from "@/lib/engine/schema";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
} from "lucide-react";

let nodeIdCounter = 0;
function getNodeId() {
  return `node_${++nodeIdCounter}_${Date.now()}`;
}

function isDataHandle(id: string | null | undefined): boolean {
  return id?.startsWith("data-") ?? false;
}

function edgePropsFor(srcHandle?: string | null, tgtHandle?: string | null) {
  if (isDataHandle(srcHandle) || isDataHandle(tgtHandle)) {
    return {
      type: "smoothstep" as const,
      animated: false,
      className: "edge-data",
      style: { stroke: "var(--primary)", strokeWidth: 2.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--primary)",
        width: 14,
        height: 14,
      },
    };
  }
  return {
    type: "smoothstep" as const,
    animated: false,
    className: "edge-exec",
    style: {
      stroke: "var(--muted-foreground)",
      strokeWidth: 1.75,
      strokeDasharray: "6 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--muted-foreground)",
      width: 16,
      height: 16,
    },
  };
}

const defaultEdgeOptions = edgePropsFor();

const connectionLineStyle = {
  stroke: "var(--ring)",
  strokeWidth: 2.5,
};

export function FlowCanvas(props: {
  initialDefinition?: FlowDefinition;
  onSave: (definition: FlowDefinition) => void;
  saving?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowCanvasInner({
  initialDefinition,
  onSave,
  saving,
}: {
  initialDefinition?: FlowDefinition;
  onSave: (definition: FlowDefinition) => void;
  saving?: boolean;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
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
    sourceHandle: e.sourceHandle ?? "exec-out",
    targetHandle: e.targetHandle ?? "exec-in",
    ...edgePropsFor(e.sourceHandle, e.targetHandle),
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(
    nodes,
    edges,
    setNodes,
    setEdges,
  );

  // Clipboard for copy/paste
  const clipboard = useRef<Node[]>([]);

  const copySelectedNodes = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0 && selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) clipboard.current = [structuredClone(node)];
    } else {
      clipboard.current = structuredClone(selected);
    }
  }, [nodes, selectedNodeId]);

  const pasteNodes = useCallback(() => {
    if (clipboard.current.length === 0) return;
    takeSnapshot();
    const newNodes: Node[] = clipboard.current.map((n) => ({
      ...structuredClone(n),
      id: getNodeId(),
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: false,
    }));
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    if (newNodes.length === 1) setSelectedNodeId(newNodes[0]!.id);
  }, [setNodes, takeSnapshot]);

  const duplicateSelected = useCallback(() => {
    copySelectedNodes();
    pasteNodes();
  }, [copySelectedNodes, pasteNodes]);

  // Real-time validation: re-compute on every node/edge change once validation is shown
  const liveErrors = (() => {
    if (!showValidation) return validationErrors;
    const def: FlowDefinition = {
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
        targetHandle: e.targetHandle ?? undefined,
      })),
    };
    return validateFlow(def);
  })();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key === "c") {
        e.preventDefault();
        copySelectedNodes();
      } else if (mod && e.key === "v") {
        e.preventDefault();
        pasteNodes();
      } else if (mod && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, copySelectedNodes, pasteNodes, duplicateSelected]);

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (connection.source === connection.target) return false;
      const srcIsData = isDataHandle(connection.sourceHandle);
      const tgtIsData = isDataHandle(connection.targetHandle);
      if (srcIsData !== tgtIsData) return false;
      const duplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          (e.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
          (e.targetHandle ?? null) === (connection.targetHandle ?? null),
      );
      return !duplicate;
    },
    [edges],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      const props = edgePropsFor(params.sourceHandle, params.targetHandle);
      setEdges((eds) => addEdge({ ...params, ...props }, eds));
    },
    [setEdges, takeSnapshot],
  );

  const handleAddNode = useCallback(
    (data: NodeData) => {
      takeSnapshot();
      const id = getNodeId();
      const wrapper = reactFlowWrapper.current;
      const rect = wrapper?.getBoundingClientRect();
      const centerX = rect ? rect.width / 2 : 400;
      const centerY = rect ? rect.height / 2 : 300;
      const position = screenToFlowPosition({
        x: (rect?.left ?? 0) + centerX,
        y: (rect?.top ?? 0) + centerY,
      });
      const newNode: Node = {
        id,
        type: data.type,
        position,
        data,
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    [setNodes, screenToFlowPosition, takeSnapshot],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDataChange = useCallback(
    (nodeId: string, newData: NodeData) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n)),
      );
    },
    [setNodes, takeSnapshot],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [setNodes, setEdges, takeSnapshot],
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
        targetHandle: e.targetHandle ?? undefined,
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

  const errorCount = liveErrors.filter(
    (e) => e.severity === "error",
  ).length;
  const warnCount = liveErrors.filter(
    (e) => e.severity === "warning",
  ).length;

  return (
    <div className="relative flex h-full min-h-0 min-w-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Toolbar + save */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 px-3 py-2 md:flex-row md:items-center md:justify-between md:px-4">
          <FlowToolbar onAddNode={handleAddNode} />
          <div className="flex items-center justify-between gap-2 md:justify-end">
            {/* Undo / Redo / Copy / Paste */}
            <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
              <div className="mx-0.5 h-4 w-px bg-border/60" />
              <button
                onClick={copySelectedNodes}
                title="Copy (Ctrl+C)"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={pasteNodes}
                title="Paste (Ctrl+V)"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </button>
            </div>

            {showValidation && liveErrors.length > 0 && (
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
            {showValidation && liveErrors.length === 0 && (
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
        {showValidation && liveErrors.length > 0 && (
          <div className="border-b border-border/60 bg-muted/30 px-4 py-2 space-y-1">
            {liveErrors.map((err, i) => (
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
          style={{ width: "100%", height: "100%", touchAction: "none" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            connectOnClick
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
            zoomOnPinch
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

import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

type Snapshot = { nodes: Node[]; edges: Edge[] };

const MAX_HISTORY = 50;

export function useUndoRedo(
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: Node[] | ((nds: Node[]) => Node[])) => void,
  setEdges: (updater: Edge[] | ((eds: Edge[]) => Edge[])) => void,
) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const skipRecord = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  const takeSnapshot = useCallback(() => {
    if (skipRecord.current) return;
    past.current = [
      ...past.current.slice(-MAX_HISTORY + 1),
      { nodes: structuredClone(nodes), edges: structuredClone(edges) },
    ];
    future.current = [];
    syncFlags();
  }, [nodes, edges, syncFlags]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    skipRecord.current = true;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    skipRecord.current = false;
    syncFlags();
  }, [nodes, edges, setNodes, setEdges, syncFlags]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });
    skipRecord.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    skipRecord.current = false;
    syncFlags();
  }, [nodes, edges, setNodes, setEdges, syncFlags]);

  return { takeSnapshot, undo, redo, canUndo, canRedo };
}

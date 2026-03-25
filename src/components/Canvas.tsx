import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Transformer } from "react-konva";
import { io, Socket } from "socket.io-client";
import { CanvasShape, UserCursor } from "../types";
import { cn } from "../lib/utils";
import { MousePointer2, Square, Circle as CircleIcon, Type, Image as ImageIcon, Trash2, Download, Eraser } from "lucide-react";

interface CanvasProps {
  onShapeSelect: (shape: CanvasShape | null) => void;
  selectedShapeId: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ onShapeSelect, selectedShapeId }) => {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [cursors, setCursors] = useState<Record<string, UserCursor>>({});
  const [tool, setTool] = useState<string>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    socketRef.current = io();
    (window as any).konvaStage = stageRef.current;

    socketRef.current.on("canvas:init", (initialShapes: CanvasShape[]) => {
      setShapes(initialShapes);
    });

    socketRef.current.on("canvas:sync", (updatedShapes: CanvasShape[]) => {
      setShapes(updatedShapes);
    });

    socketRef.current.on("cursor:sync", (data: UserCursor) => {
      setCursors((prev) => ({ ...prev, [data.id]: data }));
    });

    socketRef.current.on("cursor:remove", (id: string) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleMouseDown = (e: any) => {
    if (tool === "select") {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        onShapeSelect(null);
      }
      return;
    }

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    const newShape: CanvasShape = {
      id: Math.random().toString(36).substr(2, 9),
      type: tool as any,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      stroke: "#000",
      strokeWidth: 2,
      points: tool === "line" ? [pos.x, pos.y] : undefined,
    };

    setShapes((prev) => [...prev, newShape]);
    onShapeSelect(newShape);
  };

  const handleMouseMove = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    
    // Sync cursor
    socketRef.current?.emit("cursor:move", {
      x: pos.x,
      y: pos.y,
      name: "User", // This could be dynamic
      color: "#FF0000",
    });

    if (!isDrawing) return;

    const lastShape = shapes[shapes.length - 1];
    if (!lastShape) return;

    const updatedShapes = shapes.slice();
    const currentShape = { ...lastShape };

    if (tool === "line") {
      currentShape.points = [...(currentShape.points || []), pos.x, pos.y];
    } else {
      currentShape.width = pos.x - currentShape.x;
      currentShape.height = pos.y - currentShape.y;
    }

    updatedShapes[updatedShapes.length - 1] = currentShape;
    setShapes(updatedShapes);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    socketRef.current?.emit("canvas:update", shapes);
  };

  const handleShapeClick = (shape: CanvasShape) => {
    if (tool === "select") {
      onShapeSelect(shape);
    }
  };

  const deleteSelected = () => {
    if (!selectedShapeId) return;
    const nextShapes = shapes.filter((s) => s.id !== selectedShapeId);
    setShapes(nextShapes);
    onShapeSelect(null);
    socketRef.current?.emit("canvas:update", nextShapes);
  };

  useEffect(() => {
    if (selectedShapeId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne("#" + selectedShapeId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedShapeId]);

  return (
    <div className="relative w-full h-full bg-[#E4E3E0] overflow-hidden border-2 border-black">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button 
          onClick={() => setTool("select")}
          className={cn("p-2 hover:bg-black hover:text-white transition-colors", tool === "select" && "bg-black text-white")}
        >
          <MousePointer2 size={20} />
        </button>
        <button 
          onClick={() => setTool("rect")}
          className={cn("p-2 hover:bg-black hover:text-white transition-colors", tool === "rect" && "bg-black text-white")}
        >
          <Square size={20} />
        </button>
        <button 
          onClick={() => setTool("circle")}
          className={cn("p-2 hover:bg-black hover:text-white transition-colors", tool === "circle" && "bg-black text-white")}
        >
          <CircleIcon size={20} />
        </button>
        <button 
          onClick={() => setTool("line")}
          className={cn("p-2 hover:bg-black hover:text-white transition-colors", tool === "line" && "bg-black text-white")}
        >
          <Eraser size={20} />
        </button>
        <div className="h-[1px] bg-black my-1" />
        <button 
          onClick={deleteSelected}
          className="p-2 hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === "rect") {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  {...shape}
                  onClick={() => handleShapeClick(shape)}
                  draggable={tool === "select"}
                />
              );
            }
            if (shape.type === "circle") {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  {...shape}
                  radius={Math.abs((shape.width || 0) / 2)}
                  onClick={() => handleShapeClick(shape)}
                  draggable={tool === "select"}
                />
              );
            }
            if (shape.type === "line") {
              return (
                <Line
                  key={shape.id}
                  id={shape.id}
                  points={shape.points}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            return null;
          })}
          {selectedShapeId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          )}
          {/* Remote Cursors */}
          {Object.values(cursors).map((cursor) => (
            <React.Fragment key={cursor.id}>
              <Circle x={cursor.x} y={cursor.y} radius={5} fill={cursor.color} />
              <Text x={cursor.x + 10} y={cursor.y + 10} text={cursor.name} fontSize={10} />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;

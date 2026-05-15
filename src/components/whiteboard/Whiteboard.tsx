
"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { AdminPanel } from './AdminPanel';
import { useWhiteboardAuth } from '@/hooks/use-whiteboard-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, ZoomIn, ZoomOut, Maximize, Hand } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Whiteboard() {
  const { user, loading, isAdmin, logout } = useWhiteboardAuth();
  const [brushColor, setBrushColor] = useState('#8B77FF');
  const [brushWidth, setBrushWidth] = useState(4);
  const [aiRefineEnabled, setAiRefineEnabled] = useState(false);
  
  // Navigation State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch Zoom State
  const lastPinchDistance = useRef<number | null>(null);

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const next = prev * delta;
      return Math.min(Math.max(next, 0.1), 5); // 10% to 500%
    });
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1 - e.deltaY * 0.001;
      handleZoom(zoomFactor);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Pan Logic
  const startPanning = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { 
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const pan = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const stopPanning = () => setIsPanning(false);

  // Pinch Zoom Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = dist / lastPinchDistance.current;
      handleZoom(delta);
      lastPinchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative h-screen w-full overflow-hidden bg-background ${isPanning ? 'cursor-grabbing' : ''}`}
      onMouseDown={startPanning}
      onMouseMove={pan}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #8B77FF 1px, transparent 1px)', 
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      >
      </div>

      <Canvas 
        brushColor={brushColor} 
        brushWidth={brushWidth} 
        aiRefineEnabled={aiRefineEnabled}
        scale={scale}
        offset={offset}
      />

      {/* Header / Auth */}
      <div className="absolute top-6 right-6 z-50 flex gap-3">
        {isAdmin && (
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-muted-foreground hidden sm:block">Admin Active: {user?.displayName}</span>
             <Button variant="outline" size="sm" onClick={logout} className="glass-panel text-xs gap-2">
               <LogOut className="w-3 h-3" /> Logout
             </Button>
          </div>
        )}
      </div>

      {/* Floating Tools Sidebar */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6">
        <Toolbar 
          brushColor={brushColor} 
          setBrushColor={setBrushColor} 
          brushWidth={brushWidth} 
          setBrushWidth={setBrushWidth}
          aiRefineEnabled={aiRefineEnabled}
          setAiRefineEnabled={setAiRefineEnabled}
        />
        
        {isAdmin && <AdminPanel />}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 p-1 glass-panel rounded-xl">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoom(0.8)} className="h-9 w-9">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <div className="px-2 text-xs font-medium min-w-[3rem] text-center text-muted-foreground">
            {Math.round(scale * 100)}%
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoom(1.2)} className="h-9 w-9">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetView} className="h-9 w-9">
                <Maximize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation Help */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-4 px-4 py-2 glass-panel rounded-full text-[10px] text-muted-foreground uppercase tracking-widest pointer-events-none">
        <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> Middle Click to Pan</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>Scroll to Zoom</span>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
        <h1 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          WhiteBoard <span className="text-xs font-body font-normal text-muted-foreground px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">Collaborative</span>
        </h1>
      </div>
    </div>
  );
}


"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { AdminPanel } from './AdminPanel';
import { useWhiteboardAuth } from '@/hooks/use-whiteboard-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, ZoomIn, ZoomOut, Maximize, Hand, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

export default function Whiteboard() {
  const { user, loading, isAdmin, logout } = useWhiteboardAuth();
  const [brushColor, setBrushColor] = useState('#8B77FF');
  const [brushWidth, setBrushWidth] = useState(4);
  const [aiRefineEnabled, setAiRefineEnabled] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  
  // Navigation State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch Zoom State
  const lastPinchDistance = useRef<number | null>(null);

  const handleZoom = useCallback((delta: number) => {
    setScale(prev => {
      const next = prev * delta;
      return Math.min(Math.max(next, 0.1), 5); // 10% to 500%
    });
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Wheel Zoom Effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = e.ctrlKey ? 0.05 : 0.001;
      const zoomFactor = 1 - e.deltaY * zoomSpeed;
      handleZoom(zoomFactor);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleZoom]);

  // Unified Pan Logic for Mouse and Touch
  const startPanning = (e: React.MouseEvent) => {
    // Pan with middle click, Alt+Left click, or regular left click if isPanMode is active
    if (e.button === 1 || (e.button === 0 && (e.altKey || isPanMode))) { 
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

  // Touch Handlers for Pinch Zoom and Single-Finger Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastPinchDistance.current = dist;
    } else if (e.touches.length === 1 && isPanMode) {
      setIsPanning(true);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
    } else if (e.touches.length === 1 && isPanning && isPanMode) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastPinchDistance.current = null;
    setIsPanning(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const zoomPercent = Math.round(scale * 100);
  const isLocked = zoomPercent < 100;

  return (
    <div 
      ref={containerRef}
      className={`relative h-screen w-full overflow-hidden bg-background ${isPanning || isPanMode ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
      onMouseDown={startPanning}
      onMouseMove={pan}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Toaster />

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
        isPanMode={isPanMode}
      />

      {/* Header / Auth */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex gap-3 items-center">
        {isAdmin && (
          <div className="flex items-center gap-2 md:gap-3 bg-card/40 backdrop-blur-md p-1 md:p-2 rounded-lg border border-white/5">
             <span className="text-[10px] md:text-sm font-medium text-muted-foreground hidden sm:block">Admin: {user?.displayName}</span>
             <Button variant="outline" size="sm" onClick={logout} className="glass-panel h-7 md:h-9 text-[10px] md:text-xs gap-1 md:gap-2 px-2 md:px-3">
               <LogOut className="w-3 h-3" /> Logout
             </Button>
          </div>
        )}
      </div>

      {/* Floating Tools Sidebar */}
      <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:top-1/2 md:-translate-y-1/2 md:bottom-auto z-50 flex flex-row md:flex-col gap-4 md:gap-6 items-end md:items-center">
        <Toolbar 
          brushColor={brushColor} 
          setBrushColor={setBrushColor} 
          brushWidth={brushWidth} 
          setBrushWidth={setBrushWidth}
          aiRefineEnabled={aiRefineEnabled}
          setAiRefineEnabled={setAiRefineEnabled}
          isPanMode={isPanMode}
          setIsPanMode={setIsPanMode}
        />
        
        {isAdmin && <AdminPanel />}
      </div>

      {/* Locked Status Indicator */}
      {isLocked && (
        <div className="absolute top-4 left-4 md:top-20 md:left-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[8px] md:text-[10px] font-bold uppercase tracking-widest animate-pulse">
          <Lock className="w-3 h-3" /> Drawing Locked: Zoom &lt; 100%
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-1 md:gap-2 p-1 glass-panel rounded-xl">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoom(0.8)} className="h-8 w-8 md:h-9 md:w-9">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <div className={`px-1 md:px-2 text-[10px] md:text-xs font-bold min-w-[2.5rem] md:min-w-[3.5rem] text-center transition-colors ${isLocked ? 'text-destructive' : 'text-primary'}`}>
            {zoomPercent}%
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoom(1.2)} className="h-8 w-8 md:h-9 md:w-9">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetView} className={`h-8 w-8 md:h-9 md:w-9 ${isLocked ? 'text-primary' : 'text-muted-foreground'}`}>
                <Maximize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View (100%)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation Help */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-4 px-4 py-2 glass-panel rounded-full text-[10px] text-muted-foreground uppercase tracking-widest pointer-events-none">
        <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> {isPanMode ? 'Drag to Pan' : 'Middle Click to Pan'}</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>Scroll to Zoom</span>
      </div>

      {/* Footer Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:top-auto md:bottom-6 md:left-6 z-40 pointer-events-none">
        <h1 className="text-sm md:text-xl font-headline font-bold text-primary flex items-center gap-2">
          WhiteBoard <span className="text-[8px] md:text-xs font-body font-normal text-muted-foreground px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">Collaborative</span>
        </h1>
      </div>
    </div>
  );
}

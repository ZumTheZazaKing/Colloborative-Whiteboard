"use client"

import React, { useRef, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { refineHandDrawnStrokes } from '@/ai/flows/refine-hand-drawn-strokes-flow';
import { useToast } from '@/hooks/use-toast';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

interface CanvasProps {
  brushColor: string;
  brushWidth: number;
  aiRefineEnabled: boolean;
  scale: number;
  offset: { x: number, y: number };
}

export function Canvas({ brushColor, brushWidth, aiRefineEnabled, scale, offset }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const { toast } = useToast();
  const lastToastTime = useRef(0);

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'drawings'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteStrokes: Stroke[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stroke[];
      setStrokes(remoteStrokes);
    });

    return () => unsubscribe();
  }, []);

  // Handle Resize and Redraw
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        redrawAll();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, scale, offset]);

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    requestAnimationFrame(() => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clear
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply Viewport Transform
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      strokes.forEach(s => drawStroke(ctx, s));
      
      // Draw active stroke
      if (isDrawing && currentPoints.length >= 2) {
        drawStroke(ctx, { id: 'active', points: currentPoints, color: brushColor, width: brushWidth });
      }
      
      ctx.restore();
    });
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width / scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e as React.MouseEvent).button === 1) return;
    if ('touches' in e && e.touches.length > 1) return;
    
    const currentZoomPercent = Math.round(scale * 100);
    if (currentZoomPercent < 100) {
      const now = Date.now();
      if (now - lastToastTime.current > 3000) { // 3 second throttle
        toast({
          variant: "destructive",
          title: "Drawing Restricted",
          description: `Drawing is disabled when zoomed out (${currentZoomPercent}%). Please reset to 100% or more.`,
        });
        lastToastTime.current = now;
      }
      return;
    }
    
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPoints([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e && e.touches.length > 1) {
      endDrawing(); 
      return;
    }
    
    const pos = getPos(e);
    const newPoints = [...currentPoints, pos];
    setCurrentPoints(newPoints);
    redrawAll();
  };

  const endDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }

    const pointsToRefine = currentPoints;
    setCurrentPoints([]);

    let pointsToSave = pointsToRefine;

    if (aiRefineEnabled) {
      try {
        const refined = await refineHandDrawnStrokes({
          points: pointsToRefine,
          color: brushColor,
          width: brushWidth
        });
        if (refined.refinedPoints) {
          pointsToSave = refined.refinedPoints;
        }
      } catch (err) {
        console.error("AI refinement failed", err);
      }
    }

    try {
      await addDoc(collection(db, 'drawings'), {
        points: pointsToSave,
        color: brushColor,
        width: brushWidth,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to save stroke", err);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  };

  const isLocked = Math.round(scale * 100) < 100;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full touch-none transition-opacity ${isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-crosshair'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
    />
  );
}

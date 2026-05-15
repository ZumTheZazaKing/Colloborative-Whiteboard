"use client"

import React, { useRef, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { refineHandDrawnStrokes } from '@/ai/flows/refine-hand-drawn-strokes-flow';

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
}

export function Canvas({ brushColor, brushWidth, aiRefineEnabled }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

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

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const { width, height } = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        redrawAll();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes]);

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use single frame redraw to prevent flicker
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(drawStroke);
    });
  };

  const drawStroke = (stroke: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPoints([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const newPoints = [...currentPoints, pos];
    setCurrentPoints(newPoints);

    // Local drawing for zero latency
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && newPoints.length >= 2) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const last = newPoints[newPoints.length - 2];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length < 2) return;

    let pointsToSave = currentPoints;

    if (aiRefineEnabled) {
      try {
        const refined = await refineHandDrawnStrokes({
          points: currentPoints,
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
    
    setCurrentPoints([]);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
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

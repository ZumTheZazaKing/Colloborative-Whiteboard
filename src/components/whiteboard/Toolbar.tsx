"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Minus, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COLORS = [
  '#8B77FF', // Primary Violet
  '#5978F5', // Accent Blue
  '#FF77A9', // Pink
  '#77FFB6', // Green
  '#FFD977', // Yellow
  '#FFFFFF', // White
];

interface ToolbarProps {
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushWidth: number;
  setBrushWidth: (w: number) => void;
  aiRefineEnabled: boolean;
  setAiRefineEnabled: (v: boolean) => void;
}

export function Toolbar({
  brushColor,
  setBrushColor,
  brushWidth,
  setBrushWidth,
  aiRefineEnabled,
  setAiRefineEnabled
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <Card className="glass-panel w-full md:w-16 p-2 flex flex-row md:flex-col items-center gap-3 md:gap-4 py-2 md:py-4 px-3 md:px-2 overflow-x-auto no-scrollbar">
        {/* Colors */}
        <div className="flex flex-row md:flex-col gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0 ${
                brushColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <Separator className="bg-white/10 h-8 md:h-px w-px md:w-full" />

        {/* Brush Width Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10 shrink-0">
              <div 
                className="rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(4, brushWidth)}px`, height: `${Math.max(4, brushWidth)}px` }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-48 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Width</span>
                <span className="text-xs font-bold text-primary">{brushWidth}px</span>
              </div>
              <div className="flex items-center gap-3">
                <Minus className="w-3 h-3 text-muted-foreground" />
                <Slider
                  value={[brushWidth]}
                  max={40}
                  min={1}
                  step={1}
                  onValueChange={(v) => setBrushWidth(v[0])}
                  className="flex-1"
                />
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator className="bg-white/10 h-8 md:h-px w-px md:w-full" />

        {/* AI Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
              <Sparkles className={`w-4 h-4 md:w-5 md:h-5 ${aiRefineEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch 
                checked={aiRefineEnabled} 
                onCheckedChange={setAiRefineEnabled}
                className="data-[state=checked]:bg-primary scale-75 md:scale-100"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            AI Path Refinement
          </TooltipContent>
        </Tooltip>
      </Card>
    </TooltipProvider>
  );
}

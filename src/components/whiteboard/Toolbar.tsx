"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Palette, MousePointer2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      <Card className="glass-panel w-16 p-2 flex flex-col items-center gap-4 py-4">
        {/* Colors */}
        <div className="flex flex-col gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                brushColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <Separator className="bg-white/10" />

        {/* Width Slider (Vertical Popover) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full bg-foreground/20 flex items-center justify-center overflow-hidden"
              >
                <div 
                  className="bg-primary rounded-full transition-all"
                  style={{ width: `${brushWidth * 2}px`, height: `${brushWidth * 2}px` }}
                />
              </div>
              <div className="h-24 py-2">
                <Slider
                  defaultValue={[brushWidth]}
                  max={20}
                  min={1}
                  step={1}
                  orientation="vertical"
                  onValueChange={(v) => setBrushWidth(v[0])}
                  className="h-full"
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            Brush Width: {brushWidth}px
          </TooltipContent>
        </Tooltip>

        <Separator className="bg-white/10" />

        {/* AI Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className={`w-5 h-5 ${aiRefineEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch 
                checked={aiRefineEnabled} 
                onCheckedChange={setAiRefineEnabled}
                className="data-[state=checked]:bg-primary"
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

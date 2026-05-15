"use client"

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Eraser, Settings2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

export function AdminPanel() {
  const [strokes, setStrokes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'drawings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStrokes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const deleteStroke = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drawings', id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const wipeBoard = async () => {
    if (!confirm("Are you sure you want to wipe the entire board?")) return;
    try {
      const q = query(collection(db, 'drawings'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (err) {
      console.error("Wipe failed", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="glass-panel w-16 h-16 rounded-2xl border-white/10 hover:bg-white/5 group">
          <Settings2 className="w-6 h-6 text-secondary group-hover:rotate-45 transition-transform" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="glass-panel border-l border-white/10 sm:max-w-md">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-headline flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-secondary" /> Administrative Panel
          </SheetTitle>
          <SheetDescription>
            Moderate collaborative strokes and manage board lifecycle.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 h-full pb-20">
          <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <div>
              <p className="font-medium text-destructive">Wipe Canvas</p>
              <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={wipeBoard} className="gap-2">
              <Eraser className="w-4 h-4" /> Wipe Board
            </Button>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
              Live Stroke History <span>{strokes.length} strokes</span>
            </h3>
            <ScrollArea className="flex-1 rounded-xl border border-white/5 bg-black/20 p-2">
              <div className="space-y-2">
                {strokes.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    Board is currently empty.
                  </div>
                ) : (
                  strokes.map((stroke) => (
                    <div key={stroke.id} className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: stroke.color }} />
                        <div className="text-xs">
                          <p className="font-medium text-foreground">Stroke {stroke.id.slice(0, 5)}</p>
                          <p className="text-muted-foreground">Width: {stroke.width}px • {stroke.points?.length || 0} pts</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteStroke(stroke.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

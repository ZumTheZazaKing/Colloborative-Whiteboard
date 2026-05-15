"use client"

import React, { useState } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { AdminPanel } from './AdminPanel';
import { useWhiteboardAuth } from '@/hooks/use-whiteboard-auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Whiteboard() {
  const { user, loading, isAdmin, login, logout } = useWhiteboardAuth();
  const { toast } = useToast();
  const [brushColor, setBrushColor] = useState('#8B77FF');
  const [brushWidth, setBrushWidth] = useState(4);
  const [aiRefineEnabled, setAiRefineEnabled] = useState(false);
  
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(passphrase);
    if (success) {
      setIsLoginDialogOpen(false);
      setPassphrase('');
      toast({
        title: "Access Granted",
        description: "You now have administrative privileges.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Passphrase",
        description: "The secret code you entered is incorrect.",
      });
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #8B77FF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <Canvas 
        brushColor={brushColor} 
        brushWidth={brushWidth} 
        aiRefineEnabled={aiRefineEnabled}
      />

      {/* Header / Auth */}
      <div className="absolute top-6 right-6 z-50 flex gap-3">
        {isAdmin ? (
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-muted-foreground hidden sm:block">Admin Active: {user?.displayName}</span>
             <Button variant="outline" size="sm" onClick={logout} className="glass-panel text-xs gap-2">
               <LogOut className="w-3 h-3" /> Logout
             </Button>
          </div>
        ) : (
          <Button variant="default" size="sm" onClick={() => setIsLoginDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-2">
            <LogIn className="w-3 h-3" /> Admin Login
          </Button>
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-secondary" /> Administrative Access
            </DialogTitle>
            <DialogDescription>
              Enter the secret passphrase to unlock the board moderator tools.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit}>
            <div className="grid gap-4 py-4">
              <Input
                type="password"
                placeholder="Enter passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="bg-white/5 border-white/10 focus:ring-primary"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Unlock Panel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Footer Info */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
        <h1 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          WhiteBoard <span className="text-xs font-body font-normal text-muted-foreground px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">Collaborative</span>
        </h1>
      </div>
    </div>
  );
}

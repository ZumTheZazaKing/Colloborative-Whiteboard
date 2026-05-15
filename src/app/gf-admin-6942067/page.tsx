
"use client"

import React, { useState, useEffect } from 'react';
import { useWhiteboardAuth } from '@/hooks/use-whiteboard-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { login, isAdmin, loading } = useWhiteboardAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [passphrase, setPassphrase] = useState('');

  // Move navigation to useEffect to avoid "updating component during render" error
  useEffect(() => {
    if (isAdmin && !loading) {
      router.replace('/');
    }
  }, [isAdmin, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(passphrase);
    if (success) {
      toast({
        title: "Access Granted",
        description: "Administrative privileges activated.",
      });
      router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "The secret passphrase provided is incorrect.",
      });
    }
  };

  if (loading || isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #8B77FF 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <Card className="glass-panel w-full max-w-md border-white/10 relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Restricted Access</CardTitle>
          <CardDescription>
            This area is reserved for board administrators. Please enter your passphrase to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="bg-white/5 border-white/10 focus:ring-primary h-12"
                autoFocus
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
              Unlock Administrator Panel
            </Button>
            <Button variant="ghost" asChild className="w-full gap-2 text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" /> Back to Whiteboard
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

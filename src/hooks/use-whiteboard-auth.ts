"use client"

import { useState, useEffect } from 'react';

// "admin123" encoded in Base64
const ENCODED_PASSPHRASE = "YWRtaW4xMjM=";

export function useWhiteboardAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('wb_admin_session');
    if (saved === 'true') {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const login = async (passphrase: string) => {
    // Decode the stored secret to compare with user input
    try {
      const decodedSecret = atob(ENCODED_PASSPHRASE);
      if (passphrase === decodedSecret) {
        setIsAdmin(true);
        localStorage.setItem('wb_admin_session', 'true');
        return true;
      }
    } catch (e) {
      console.error("Decoding error", e);
    }
    return false;
  };

  const logout = async () => {
    setIsAdmin(false);
    localStorage.removeItem('wb_admin_session');
  };

  return { 
    user: isAdmin ? { email: 'admin@whiteboard.local', displayName: 'Board Admin' } : null, 
    loading, 
    isAdmin, 
    login, 
    logout 
  };
}

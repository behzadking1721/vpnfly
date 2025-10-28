import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionProfile, ConnectionStatus, Subscription } from '../shared/types';
import VpnDashboard from './components/VpnDashboard';
import { api } from '../main/preload';

declare global {
  interface Window {
    api: typeof api;
  }
}

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const savedSubs = localStorage.getItem('subscriptions');
    return savedSubs ? JSON.parse(savedSubs) : [];
  });
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [activeProfile, setActiveProfile] = useState<ConnectionProfile | null>(null);

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const fetchAllProfiles = useCallback(async () => {
    if (subscriptions.length === 0) {
      setProfiles([]);
      return;
    };
    setIsLoading(true);
    setError(null);
    setProfiles([]);
    try {
      const allProfiles: ConnectionProfile[] = [];
      for (const sub of subscriptions) {
        // FIX: Pass sub.name as the second argument to getProfilesFromSub.
        const result = await window.api.getProfilesFromSub(sub.url, sub.name);
        if (result.success && result.data) {
          allProfiles.push(...result.data);
        } else {
          console.error(`Failed to fetch from ${sub.name}:`, result.error);
        }
      }
      setProfiles(allProfiles);
    } catch (e: any) {
      setError('خطا در دریافت پروفایل‌ها. از اتصال اینترنت خود مطمئن شوید.');
    }
    setIsLoading(false);
  }, [subscriptions]);

  useEffect(() => {
    fetchAllProfiles();
  }, [fetchAllProfiles]);
  

  const handleConnect = async (profile: ConnectionProfile) => {
    if (connectionStatus === ConnectionStatus.CONNECTED && activeProfile?.id === profile.id) return;
    
    setConnectionStatus(ConnectionStatus.CONNECTING);
    setActiveProfile(profile);
    setError(null);
    try {
      const result = await window.api.startV2Ray(profile);
      if (result.success) {
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } else {
        throw new Error(result.error || "اتصال برقرار نشد.");
      }
    } catch (e: any) {
        setConnectionStatus(ConnectionStatus.ERROR);
        setError(e.message);
        setActiveProfile(null);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus(ConnectionStatus.DISCONNECTING);
    window.api.stopV2Ray();
    setActiveProfile(null);
    setTimeout(() => setConnectionStatus(ConnectionStatus.DISCONNECTED), 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 text-white font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-cyan-400 drop-shadow-lg">vpnfly Client</h1>
          <p className="text-gray-400">ابزار مدیریت اتصال امن برای تریدرها</p>
        </header>
        
        <VpnDashboard
          subscriptions={subscriptions}
          setSubscriptions={setSubscriptions}
          profiles={profiles}
          setProfiles={setProfiles}
          isLoading={isLoading}
          error={error}
          connectionStatus={connectionStatus}
          activeProfile={activeProfile}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefreshProfiles={fetchAllProfiles}
        />
      </div>
    </div>
  );
}

export default App;
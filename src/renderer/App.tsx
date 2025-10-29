import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionProfile, ConnectionStatus, Subscription } from '../shared/types';
import VpnDashboard from './components/VpnDashboard';
import ProfileList from './components/ProfileList';
import SubscriptionManager from './components/SubscriptionManager';
import { api } from '../main/preload';

declare global {
  interface Window {
    api: typeof api;
  }
}

const ICONS = {
  POWER: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  HOME: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  PROXIES: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  CONFIG: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  SETTINGS: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  LOGS: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ABOUT: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

type Page = 'home' | 'proxies' | 'config' | 'settings' | 'logs' | 'about';

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
  const [currentPage, setCurrentPage] = useState<Page>('home');

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

  const handleQuickConnect = () => {
    if (profiles.length > 0) {
      // Simple logic: connect to the first profile with a decent ping, or just the first one.
      const bestProfile = profiles.find(p => p.ping && p.ping > 0 && p.ping < 500) || profiles[0];
      handleConnect(bestProfile);
    }
  }

  const PageContent = () => {
    switch (currentPage) {
      case 'home':
        return <VpnDashboard
            profiles={profiles}
            error={error}
            connectionStatus={connectionStatus}
            activeProfile={activeProfile}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefreshProfiles={fetchAllProfiles}
            isLoading={isLoading}
        />;
      case 'proxies':
        return (
          <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
              <div className="xl:col-span-2 h-full">
                  <ProfileList
                      profiles={profiles}
                      setProfiles={setProfiles}
                      isLoading={isLoading}
                      activeProfile={activeProfile}
                      onConnect={handleConnect}
                      connectionStatus={connectionStatus}
                  />
              </div>
              <div className="xl:col-span-1 h-full">
                  <SubscriptionManager
                      subscriptions={subscriptions}
                      setSubscriptions={setSubscriptions}
                      onRefreshProfiles={fetchAllProfiles}
                      isBusy={isLoading || connectionStatus !== ConnectionStatus.DISCONNECTED}
                  />
              </div>
          </div>
        );
      default:
        return <div className="p-10 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2 capitalize">{currentPage}</h2>
            <p>این صفحه در حال ساخت است.</p>
        </div>;
    }
  }

  const NavItem = ({ page, icon: Icon, children }) => {
    const isActive = currentPage === page;
    return (
        <a href="#" onClick={() => setCurrentPage(page)}
           className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
            <Icon className="w-6 h-6"/>
            <span className="font-semibold">{children}</span>
        </a>
    )
  }

  return (
    <div className="flex h-screen bg-[#202124] text-gray-200 font-sans">
        <aside className="w-64 bg-[#2f3136] flex flex-col p-4 space-y-2">
            <div className="flex items-center gap-3 p-2 mb-4">
                <img src="https://hiddify.com/assets/images/logo-without-text.png" alt="Logo" className="w-8 h-8"/>
                <h1 className="text-xl font-bold">Hiddify</h1>
                <span className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded">2.5.7</span>
            </div>
            <button
                onClick={connectionStatus === ConnectionStatus.CONNECTED ? handleDisconnect : handleQuickConnect}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 w-full ${connectionStatus === ConnectionStatus.CONNECTED ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                <ICONS.POWER/>
                <span className="font-semibold">
                  {connectionStatus === ConnectionStatus.CONNECTED ? 'قطع اتصال' : 'اتصال سریع'}
                </span>
            </button>
            <hr className="border-gray-600/50"/>
            <nav className="flex-1 space-y-1">
                <NavItem page="home" icon={ICONS.HOME}>Home</NavItem>
                <NavItem page="proxies" icon={ICONS.PROXIES}>Proxies</NavItem>
                <NavItem page="config" icon={ICONS.CONFIG}>Config Options</NavItem>
                <NavItem page="settings" icon={ICONS.SETTINGS}>Settings</NavItem>
                <NavItem page="logs" icon={ICONS.LOGS}>Logs</NavItem>
                <NavItem page="about" icon={ICONS.ABOUT}>About</NavItem>
            </nav>
        </aside>
        <main className="flex-1 flex flex-col overflow-y-auto">
            <PageContent />
        </main>
    </div>
  );
}

export default App;

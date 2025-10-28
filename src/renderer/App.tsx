import React, { useState } from 'react';
import { ConnectionProfile, ConnectionStatus } from '../shared/types';
import { api } from '../main/preload'; // برای استفاده از تایپ‌ها
import ProfileItem from './components/ProfileItem';

declare global {
  interface Window {
    api: typeof api;
  }
}

function App() {
  const [subLink, setSubLink] = useState('');
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const handleFetchProfiles = async () => {
    if (!subLink) return;
    setIsLoading(true);
    setError(null);
    setProfiles([]);
    const result = await window.api.getProfilesFromSub(subLink);
    if (result.success && result.data) {
      setProfiles(result.data);
    } else {
      setError(result.error || 'خطای نامشخص در دریافت پروفایل‌ها');
    }
    setIsLoading(false);
  };

  const handleTestAllPings = async () => {
    setConnectionStatus(ConnectionStatus.TESTING);
    const updatedProfiles = [...profiles];
    
    await Promise.all(updatedProfiles.map(async (profile, index) => {
      updatedProfiles[index] = { ...profile, status: 'testing' };
      setProfiles([...updatedProfiles]);

      const ping = await window.api.testNodeLatency(profile);
      
      updatedProfiles[index] = { ...profile, ping: ping, status: 'tested' };
      setProfiles([...updatedProfiles]);
    }));

    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  };

  const handleConnect = async (profile: ConnectionProfile) => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    setActiveProfileId(profile.id);
    const result = await window.api.startV2Ray(profile);
    if (result.success) {
      setConnectionStatus(ConnectionStatus.CONNECTED);
    } else {
      setConnectionStatus(ConnectionStatus.ERROR);
      setError(result.error || "اتصال برقرار نشد.");
      setActiveProfileId(null);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus(ConnectionStatus.DISCONNECTING);
    window.api.stopV2Ray();
    setActiveProfileId(null);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  };
  
  const isBusy = isLoading || connectionStatus === ConnectionStatus.CONNECTING || connectionStatus === ConnectionStatus.DISCONNECTING || connectionStatus === ConnectionStatus.TESTING;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 text-white font-sans">
      <div className="w-full max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold text-center text-cyan-400 drop-shadow-lg">vpnfly Client</h1>
        
        {/* بخش مدیریت لینک اشتراک */}
        <div className="flex gap-2">
          <input
            type="text" value={subLink} onChange={(e) => setSubLink(e.target.value)}
            placeholder="لینک اشتراک خود را وارد کنید"
            className="flex-grow p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={isBusy}
          />
          <button onClick={handleFetchProfiles} disabled={isBusy || !subLink}
            className="px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 transition-colors"
          >
            {isLoading ? 'در حال دریافت...' : 'دریافت پروفایل‌ها'}
          </button>
        </div>

        {error && <p className="text-center text-red-400 bg-red-900/50 p-2 rounded-md">{error}</p>}
        
        {/* بخش کنترل اصلی */}
        <div className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center">
          <div>
            <span className="font-bold">وضعیت: </span>
            <span className={`font-semibold ${connectionStatus === ConnectionStatus.CONNECTED ? 'text-green-400' : 'text-yellow-400'}`}>{connectionStatus}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleTestAllPings} disabled={isBusy || profiles.length === 0}
              className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
            >
              {connectionStatus === ConnectionStatus.TESTING ? 'در حال تست...' : 'تست پینگ همه'}
            </button>
            {connectionStatus === ConnectionStatus.CONNECTED && (
              <button onClick={handleDisconnect} disabled={isBusy}
                className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-600 transition-colors"
              >
                قطع اتصال
              </button>
            )}
          </div>
        </div>

        {/* لیست پروفایل‌ها */}
        <div className="bg-gray-800/50 rounded-lg p-2 space-y-1 max-h-[60vh] overflow-y-auto">
          {profiles.map(profile => (
            <ProfileItem 
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onConnect={() => handleConnect(profile)}
              isBusy={isBusy}
            />
          ))}
          {profiles.length === 0 && !isLoading && (
            <p className="text-center text-gray-500 p-8">برای شروع، لینک اشتراک را وارد و پروفایل‌ها را دریافت کنید.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

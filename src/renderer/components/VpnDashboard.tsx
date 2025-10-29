import React, { useState, useMemo } from 'react';
import { ConnectionProfile, ConnectionStatus } from '../../shared/types';
import ConnectionButton from './ConnectionButton';

interface VpnDashboardProps {
  profiles: ConnectionProfile[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  activeProfile: ConnectionProfile | null;
  onConnect: (profile: ConnectionProfile) => void;
  onDisconnect: () => void;
  onRefreshProfiles: () => void;
}

const ICONS = {
    REFRESH: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    CHEVRON_DOWN: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    ARROW_UP: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    ARROW_DOWN: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
};

const VpnDashboard: React.FC<VpnDashboardProps> = (props) => {
  const { connectionStatus, activeProfile, onConnect, onDisconnect, onRefreshProfiles, isLoading, profiles } = props;
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(activeProfile?.id || null);
  const [showStats, setShowStats] = useState(false);

  React.useEffect(() => {
    if (activeProfile) {
      setSelectedProfileId(activeProfile.id);
    } else if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [activeProfile, profiles, selectedProfileId]);

  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedProfileId) || profiles[0];
  }, [selectedProfileId, profiles]);

  const handleConnect = () => {
    if (selectedProfile) {
      onConnect(selectedProfile);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-[#2f3136]">
        <div className="w-full max-w-lg mx-auto flex items-center gap-2">
            <button onClick={onRefreshProfiles} disabled={isLoading} className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors disabled:opacity-50">
                <ICONS.REFRESH className={isLoading ? 'animate-spin' : ''}/>
            </button>
            <div className="relative flex-1">
                <select
                    value={selectedProfileId || ''}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    disabled={profiles.length === 0 || connectionStatus !== ConnectionStatus.DISCONNECTED}
                    className="w-full bg-[#2f3136] border border-transparent text-white font-semibold py-3 pl-4 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
                >
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    {profiles.length === 0 && <option>...لیست خالی است</option>}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <ICONS.CHEVRON_DOWN className="text-gray-400"/>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <ConnectionButton
          status={connectionStatus}
          onConnect={handleConnect}
          onDisconnect={onDisconnect}
          ping={activeProfile?.ping}
        />
        {props.error && (
            <p className="text-center text-red-400 bg-red-900/50 p-2 rounded-md text-sm">
              {props.error}
            </p>
        )}
      </main>

      <footer className="flex-shrink-0 w-full max-w-3xl mx-auto p-4">
          <div className="bg-[#2f3136]/70 rounded-lg">
              <button onClick={() => setShowStats(!showStats)} className="w-full text-left p-3 font-semibold flex justify-between items-center hover:bg-gray-700/30 rounded-t-lg">
                  <span>{showStats ? 'Hide' : 'Show'} More</span>
                  <ICONS.CHEVRON_DOWN className={`transition-transform ${showStats ? 'rotate-180' : ''}`}/>
              </button>
              {showStats && (
                  <div className="p-4 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-bold text-gray-400 mb-2">Connection</h4>
                        <div className="flex justify-between"><span>User:</span> <span className="font-mono text-cyan-300">@KevinZakarian</span></div>
                        <div className="flex justify-between"><span>Check IP:</span> <span className="font-mono text-cyan-300">192.168.1.1</span></div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-400 mb-2">Traffic</h4>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><ICONS.ARROW_DOWN/> Download:</span>
                            <span className="font-mono text-green-300">24.79 MiB</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><ICONS.ARROW_UP/> Upload:</span>
                            <span className="font-mono text-yellow-300">1.23 MiB</span>
                        </div>
                    </div>
                  </div>
              )}
          </div>
      </footer>
    </div>
  );
};

export default VpnDashboard;

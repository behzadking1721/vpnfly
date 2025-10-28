import React from 'react';
import { ConnectionProfile } from '../../shared/types';

interface ProfileItemProps {
  profile: ConnectionProfile;
  isActive: boolean;
  isBusy: boolean;
  onConnect: () => void;
}

const PingIndicator: React.FC<{ ping?: number, status?: 'testing' | 'tested' }> = ({ ping, status }) => {
  if (status === 'testing') {
    return <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>;
  }

  if (typeof ping !== 'number') {
    return <span className="text-sm font-mono text-gray-500 w-20 text-right">--- ms</span>;
  }
  
  if (ping === -1) {
    return <span className="text-sm font-semibold text-red-500 w-20 text-right">Timeout</span>;
  }

  const colorClass = ping < 150 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-red-500';

  return <span className={`text-sm font-mono font-semibold ${colorClass} w-20 text-right`}>{ping} ms</span>;
};

const ProfileItem: React.FC<ProfileItemProps> = ({ profile, isActive, isBusy, onConnect }) => {
  const baseClasses = "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer";
  const activeClasses = isActive ? "bg-green-600/30 ring-2 ring-green-500" : "bg-gray-800 hover:bg-gray-700/80";
  const disabledClasses = isBusy && !isActive ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className={`${baseClasses} ${activeClasses} ${disabledClasses}`} onClick={() => !isBusy && !isActive && onConnect()}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate" title={profile.name}>{profile.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-mono text-cyan-400 uppercase">{profile.type}</span>
            <span className="truncate hidden sm:inline">{profile.server}:{profile.port}</span>
            <span className="bg-gray-700 px-2 py-0.5 rounded text-gray-300">{profile.subscriptionName}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-2">
        <PingIndicator ping={profile.ping} status={profile.status} />
        <div className="w-24 text-center">
            {isActive ? (
              <span className="px-3 py-1 text-sm font-semibold text-green-300 bg-green-800/50 rounded-full">
                متصل
              </span>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onConnect(); }}
                disabled={isBusy}
                className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                اتصال
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfileItem;
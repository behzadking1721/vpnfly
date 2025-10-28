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
    return <span className="text-gray-500">--- ms</span>;
  }

  const colorClass = ping < 150 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-red-500';

  return <span className={`font-mono font-semibold ${colorClass}`}>{ping} ms</span>;
};

const ProfileItem: React.FC<ProfileItemProps> = ({ profile, isActive, isBusy, onConnect }) => {
  const baseClasses = "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200";
  const activeClasses = isActive ? "bg-green-600/30 ring-2 ring-green-500" : "bg-gray-700/50 hover:bg-gray-700";

  return (
    <div className={`${baseClasses} ${activeClasses}`}>
      <div className="flex flex-col">
        <p className="font-semibold text-white">{profile.name}</p>
        <span className="text-xs font-mono text-cyan-400">{profile.type} - {profile.server}:{profile.port}</span>
      </div>
      <div className="flex items-center gap-4">
        <PingIndicator ping={profile.ping} status={profile.status} />
        {!isActive && (
          <button 
            onClick={onConnect}
            disabled={isBusy}
            className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            اتصال
          </button>
        )}
        {isActive && (
          <span className="px-3 py-1 text-sm font-semibold text-green-300 bg-green-800/50 rounded-full">
            متصل ✅
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfileItem;

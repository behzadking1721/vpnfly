import React, { useState, useMemo } from 'react';
import { ConnectionProfile, ConnectionStatus } from '../../shared/types';
import ProfileItem from './ProfileItem';

interface ProfileListProps {
  profiles: ConnectionProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ConnectionProfile[]>>;
  isLoading: boolean;
  activeProfile: ConnectionProfile | null;
  onConnect: (profile: ConnectionProfile) => void;
  connectionStatus: ConnectionStatus;
}

const ProfileList: React.FC<ProfileListProps> = ({ profiles, setProfiles, isLoading, activeProfile, onConnect, connectionStatus }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [filter, setFilter] = useState('');

  const handleTestAllPings = async () => {
    setIsTesting(true);
    const updatedProfiles = [...profiles];
    
    const testPromises = updatedProfiles.map(async (profile, index) => {
      // Set status to testing immediately for UI feedback
      const testingProfile = { ...profile, status: 'testing' as const };
      setProfiles(prev => prev.map(p => p.id === profile.id ? testingProfile : p));
      
      const ping = await window.api.testNodeLatency(profile);
      
      const testedProfile = { ...testingProfile, ping, status: 'tested' as const };
      // Update the profile in the original array to maintain order for batch update
      updatedProfiles[index] = testedProfile;
    });

    await Promise.all(testPromises);
    setProfiles(updatedProfiles);
    setIsTesting(false);
  };

  const handleSortByPing = () => {
    const sortedProfiles = [...profiles].sort((a, b) => {
      if (a.ping === undefined) return 1;
      if (b.ping === undefined) return -1;
      return a.ping - b.ping;
    });
    setProfiles(sortedProfiles);
  };

  const filteredProfiles = useMemo(() => {
    if (!filter) {
      return profiles;
    }
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [profiles, filter]);

  const isBusy = isLoading || isTesting || connectionStatus === ConnectionStatus.CONNECTING || connectionStatus === ConnectionStatus.DISCONNECTING;

  return (
    <div className="bg-gray-800/70 rounded-xl shadow-lg backdrop-blur-sm flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">لیست پروفایل‌ها ({filteredProfiles.length})</h2>
            <div className="flex gap-2">
            <button onClick={handleSortByPing} disabled={isBusy || profiles.length === 0} className="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 transition-colors">
                مرتب سازی
            </button>
            <button onClick={handleTestAllPings} disabled={isBusy || profiles.length === 0} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-600 transition-colors">
                {isTesting ? 'در حال تست...' : 'تست پینگ'}
            </button>
            </div>
        </div>
        <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="جستجوی پروفایل بر اساس نام..."
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500"
            disabled={isBusy || profiles.length === 0}
        />
      </div>
      
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {isLoading && <p className="text-center text-gray-400 p-8">در حال دریافت اطلاعات از لینک اشتراک...</p>}
        {!isLoading && profiles.length === 0 && (
          <p className="text-center text-gray-500 p-8">
            هیچ پروفایلی یافت نشد.
            <br/>
            لطفاً از بخش مدیریت اشتراک، یک لینک معتبر اضافه کنید.
          </p>
        )}
        {!isLoading && filteredProfiles.length === 0 && profiles.length > 0 && (
            <p className="text-center text-gray-500 p-8">
                هیچ پروفایلی با عبارت جستجو شده مطابقت ندارد.
            </p>
        )}
        {filteredProfiles.map(profile => (
          <ProfileItem
            key={profile.id}
            profile={profile}
            isActive={profile.id === activeProfile?.id}
            onConnect={() => onConnect(profile)}
            isBusy={isBusy}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileList;

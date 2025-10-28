import React, { useState } from 'react';
import { ConnectionProfile } from '../shared/types';

// تعریف window.api برای TypeScript
declare global {
  interface Window {
    api: {
      getProfilesFromSub: (subLink: string) => Promise<ConnectionProfile[]>;
    }
  }
}

function App() {
  const [subLink, setSubLink] = useState('');
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchProfiles = async () => {
    if (!subLink) return;
    setIsLoading(true);
    try {
      const fetchedProfiles = await window.api.getProfilesFromSub(subLink);
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      // اینجا می‌توانید یک پیام خطا به کاربر نمایش دهید
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 text-white">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-center text-cyan-400">کلاینت V2Ray برای تریدرها</h1>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={subLink}
            onChange={(e) => setSubLink(e.target.value)}
            placeholder="لینک اشتراک خود را وارد کنید"
            className="flex-grow p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            onClick={handleFetchProfiles}
            disabled={isLoading}
            className="px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500"
          >
            {isLoading ? 'در حال دریافت...' : 'دریافت پروفایل‌ها'}
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 space-y-2 max-h-96 overflow-y-auto">
          {profiles.map(profile => (
            <div key={profile.id} className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/50">
              <p className="font-semibold">{profile.name}</p>
              <span className="text-xs font-mono text-cyan-400">{profile.type}</span>
            </div>
          ))}
          {profiles.length === 0 && !isLoading && (
            <p className="text-center text-gray-500 p-4">هنوز پروفایلی بارگذاری نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

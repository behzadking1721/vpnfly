import React, { useState } from 'react';
import { Subscription } from '../../shared/types';

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
  onRefreshProfiles: () => void;
  isBusy: boolean;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ subscriptions, setSubscriptions, onRefreshProfiles, isBusy }) => {
  const [newSubUrl, setNewSubUrl] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const handleAddSubscription = () => {
    if (!newSubUrl.trim() || !newSubName.trim()) return;
    
    const newSub: Subscription = {
      id: Date.now().toString(),
      name: newSubName,
      url: newSubUrl,
    };
    
    setSubscriptions(prev => [...prev, newSub]);
    setNewSubUrl('');
    setNewSubName('');
  };

  const handleRemoveSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };
  
  return (
    <div className="bg-gray-800/70 rounded-xl p-6 shadow-lg backdrop-blur-sm space-y-4">
      <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">مدیریت اشتراک‌ها</h2>
      
      <div className="space-y-2">
        <input
          type="text"
          value={newSubName}
          onChange={(e) => setNewSubName(e.target.value)}
          placeholder="نام اشتراک (مثلا: خانه)"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          disabled={isBusy}
        />
        <input
          type="text"
          value={newSubUrl}
          onChange={(e) => setNewSubUrl(e.target.value)}
          placeholder="لینک اشتراک"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          disabled={isBusy}
        />
        <button
          onClick={handleAddSubscription}
          disabled={isBusy || !newSubUrl || !newSubName}
          className="w-full px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 transition-colors"
        >
          افزودن اشتراک
        </button>
      </div>

      <div className="space-y-2 pt-4 max-h-40 overflow-y-auto">
        {subscriptions.map(sub => (
          <div key={sub.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
            <span className="font-semibold truncate" title={sub.url}>{sub.name}</span>
            <button
              onClick={() => handleRemoveSubscription(sub.id)}
              disabled={isBusy}
              className="text-red-400 hover:text-red-300 disabled:text-gray-500 text-xs font-bold"
            >
              حذف
            </button>
          </div>
        ))}
         {subscriptions.length === 0 && (
            <p className="text-center text-sm text-gray-500">هیچ اشتراکی اضافه نشده است.</p>
         )}
      </div>
      
       <button
          onClick={onRefreshProfiles}
          disabled={isBusy || subscriptions.length === 0}
          className="w-full mt-2 px-4 py-2 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 transition-colors"
        >
          به‌روزرسانی همه پروفایل‌ها
        </button>
    </div>
  );
};

export default SubscriptionManager;

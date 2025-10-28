import React, { useState } from 'react';
import { ConnectionProfile, ConnectionStatus, Subscription } from '../../shared/types';
import SubscriptionManager from './SubscriptionManager';
import ProfileList from './ProfileList';
import ConnectionButton from './ConnectionButton';

interface VpnDashboardProps {
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
  profiles: ConnectionProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ConnectionProfile[]>>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  activeProfile: ConnectionProfile | null;
  onConnect: (profile: ConnectionProfile) => void;
  onDisconnect: () => void;
  onRefreshProfiles: () => void;
}

const VpnDashboard: React.FC<VpnDashboardProps> = (props) => {
  const { connectionStatus, activeProfile, onDisconnect } = props;

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Controls & Subscriptions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gray-800/70 rounded-xl p-6 shadow-lg backdrop-blur-sm">
          <ConnectionButton
            status={connectionStatus}
            onDisconnect={onDisconnect}
            activeProfileName={activeProfile?.name}
          />
          {props.error && (
            <p className="mt-4 text-center text-red-400 bg-red-900/50 p-2 rounded-md text-sm">
              {props.error}
            </p>
          )}
        </div>
        <SubscriptionManager
          subscriptions={props.subscriptions}
          setSubscriptions={props.setSubscriptions}
          onRefreshProfiles={props.onRefreshProfiles}
          isBusy={props.isLoading || connectionStatus !== ConnectionStatus.DISCONNECTED}
        />
      </div>

      {/* Right Column - Profile List */}
      <div className="lg:col-span-2">
        <ProfileList
          profiles={props.profiles}
          setProfiles={props.setProfiles}
          isLoading={props.isLoading}
          activeProfile={props.activeProfile}
          onConnect={props.onConnect}
          connectionStatus={connectionStatus}
        />
      </div>
    </main>
  );
};

export default VpnDashboard;

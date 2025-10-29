import React from 'react';
import { ConnectionStatus } from '../../shared/types';

interface ConnectionButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  ping?: number;
}

const SignalIcon: React.FC = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" opacity=".3"/>
        <path d="M3.53 10.95l8.46 10.54.01.01.01-.01 8.46-10.54C20.04 10.62 16.81 8 12 8s-8.04 2.62-8.47 2.95z"/>
    </svg>
);

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ status, onConnect, onDisconnect, ping }) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.DISCONNECTING;
  
  const getStatusText = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.DISCONNECTING:
        return 'Disconnecting...';
      case ConnectionStatus.ERROR:
        return 'Error';
      default:
        return 'Standby';
    }
  };

  const statusColor = 
    isConnected ? 'text-green-400' :
    status === ConnectionStatus.ERROR ? 'text-red-400' :
    'text-gray-400';

  const buttonColor =
    isConnected ? 'bg-green-500/10 border-green-500' :
    'bg-gray-800/50 border-gray-600';
  
  const iconColor =
    isConnected ? 'text-green-400' :
    isConnecting ? 'text-cyan-400' :
    'text-gray-500';

  const handleClick = () => {
    if (isConnected) {
        onDisconnect();
    } else {
        onConnect();
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
        <button
            onClick={handleClick}
            disabled={isConnecting}
            className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 border-2 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:cursor-wait ${buttonColor} ${isConnected ? 'focus:ring-green-400' : 'focus:ring-cyan-500'}`}
        >
            {isConnecting && (
                <div className="absolute inset-0 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
            )}
            <div className={`transition-colors duration-300 ${iconColor}`}>
                <SignalIcon />
            </div>

            {/* Glowing effect */}
            {isConnected && <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"></div>}

        </button>
        <div className="text-center">
            <p className={`text-xl font-bold transition-colors ${statusColor}`}>{getStatusText()}</p>
            {isConnected && typeof ping === 'number' && (
                <p className="text-sm text-gray-400 font-mono mt-1">
                    {ping > 0 ? `${ping} ms` : '...'}
                </p>
            )}
        </div>
    </div>
  );
};

export default ConnectionButton;

import React from 'react';
import { ConnectionStatus } from '../../shared/types';

interface ConnectionButtonProps {
  status: ConnectionStatus;
  onDisconnect: () => void;
  activeProfileName?: string;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ status, onDisconnect, activeProfileName }) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING || status === ConnectionStatus.DISCONNECTING;
  
  const getStatusText = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'متصل';
      case ConnectionStatus.CONNECTING:
        return 'در حال اتصال...';
      case ConnectionStatus.DISCONNECTED:
        return 'قطع';
      case ConnectionStatus.DISCONNECTING:
        return 'در حال قطع اتصال...';
      case ConnectionStatus.ERROR:
        return 'خطا';
      case ConnectionStatus.TESTING:
        return 'در حال تست پینگ...';
      default:
        return 'نامشخص';
    }
  };
  
  const buttonColor = isConnected ? 'bg-green-500' : 'bg-gray-600';
  const ringColor = isConnected ? 'ring-green-400' : 'ring-gray-500';
  const textColor = isConnected ? 'text-white' : 'text-gray-300';

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isConnected ? onDisconnect : undefined}
        disabled={isConnecting || !isConnected}
        className={`relative w-40 h-40 rounded-full flex items-center justify-center font-bold text-2xl transition-all duration-300 shadow-2xl focus:outline-none ${buttonColor} ${textColor} ring-8 ${ringColor} ring-opacity-50 hover:ring-opacity-80 disabled:opacity-70 disabled:cursor-wait`}
      >
        {isConnecting && (
          <div className="absolute inset-0 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
        )}
        <span>{getStatusText()}</span>
      </button>
      {isConnected && activeProfileName && (
        <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">متصل به:</p>
            <p className="font-semibold text-cyan-300 truncate max-w-xs">{activeProfileName}</p>
        </div>
      )}
      {!isConnected && status !== ConnectionStatus.CONNECTING && (
         <p className="text-center mt-4 text-gray-500">برای اتصال، یک پروفایل را از لیست انتخاب کنید.</p>
      )}
    </div>
  );
};

export default ConnectionButton;

import React from 'react';
import { Hash, Shield, Network } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';

interface HeaderProps {
  channelName: string;
  channelTopic: string;
}

export const Header: React.FC<HeaderProps> = ({ channelName, channelTopic }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338] shadow-sm select-none">
      {/* Channel Title */}
      <div className="flex items-center gap-2 min-w-0">
        <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
        <span className="font-bold text-white text-sm truncate">{channelName}</span>
        <div className="h-4 w-[1px] bg-[#4e5058] mx-2 hidden sm:block" />
        <span className="text-xs text-[#949ba4] truncate hidden sm:block">
          {channelTopic}
        </span>
      </div>

      {/* Network / Wallet Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b2d31] border border-[#383a40] text-xs">
          <Network className="w-3.5 h-3.5 text-[#5865F2]" />
          <span className="text-[#dbdee1] font-medium">
            {chainId === 31337 ? 'Local Anvil (31337)' : `Chain ID: ${chainId}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b2d31] border border-[#383a40] text-xs">
          <Shield className="w-3.5 h-3.5 text-[#23a55a]" />
          <span className="text-[#dbdee1] font-mono">
            {isConnected && address
              ? `${address.substring(0, 6)}...${address.substring(38)}`
              : 'Auto-Simulated Node'}
          </span>
        </div>
      </div>
    </div>
  );
};

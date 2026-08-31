import React from 'react';
import { Hash, Shield, Network, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';

interface HeaderProps {
  channelName: string;
  channelTopic: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelName,
  channelTopic,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="h-14 border-b border-[#1e293b] px-4 flex items-center justify-between bg-[#0f172a] shadow-sm select-none">
      {/* Channel Title & Hamburger Toggle */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white transition-colors cursor-pointer border border-[#334155]"
            title={isSidebarOpen ? 'Collapse Channels (Cmd/Ctrl + B)' : 'Expand Channels'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        )}

        <Hash className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-100 text-sm truncate">{channelName}</span>
        <div className="h-3.5 w-[1px] bg-[#334155] mx-2 hidden sm:block" />
        <span className="text-xs text-slate-400 truncate hidden sm:block font-normal">
          {channelTopic}
        </span>
      </div>

      {/* Network / Wallet Status Badge */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e293b] border border-[#334155] text-xs font-mono">
          <Network className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300">
            {chainId === 31337 ? 'Local Anvil (31337)' : `Chain: ${chainId}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e293b] border border-[#334155] text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">
            {isConnected && address
              ? `${address.substring(0, 6)}...${address.substring(38)}`
              : 'Guest Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};




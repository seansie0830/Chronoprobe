import React from 'react';
import { Hash, Plus, ChevronDown, Radio } from 'lucide-react';
import type { Channel, Persona } from '../lib/types';

interface SidebarProps {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  pendingCount: number;
  onAnchorBatch: () => void;
  isAnchoring: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  personas,
  activePersonaId,
  onSelectPersona,
  pendingCount,
  onAnchorBatch,
  isAnchoring,
}) => {
  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col h-full select-none border-r border-[#1f2023]">
      {/* Server Header */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between font-bold text-white shadow-sm">
        <span className="truncate">Chronoprobe Sandbox</span>
        <ChevronDown className="w-4 h-4 text-[#949ba4]" />
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div>
          <div className="flex items-center justify-between text-[#949ba4] text-[11px] font-bold px-2 mb-1 tracking-wider uppercase">
            <span>Text Channels</span>
            <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          </div>
          <div className="space-y-0.5">
            {channels.map((ch) => {
              const isActive = ch.id === activeChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#35373c] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                  }`}
                >
                  <Hash className="w-4 h-4 text-[#80848e]" />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Batch Status Card */}
        <div className="p-3 bg-[#1e1f22] rounded-lg border border-[#35373c]/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#dbdee1] flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-[#f0b232] animate-pulse' : 'text-[#23a55a]'}`} />
              Merkle Batch Queue
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#313338] text-white">
              {pendingCount}
            </span>
          </div>
          <p className="text-[11px] text-[#949ba4] mb-2.5 leading-relaxed">
            {pendingCount > 0
              ? `${pendingCount} signed messages waiting to be bundled into an on-chain root.`
              : 'All channel messages are anchored on-chain.'}
          </p>
          <button
            onClick={onAnchorBatch}
            disabled={pendingCount === 0 || isAnchoring}
            className={`w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              pendingCount > 0 && !isAnchoring
                ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer shadow-md'
                : 'bg-[#313338] text-[#80848e] cursor-not-allowed'
            }`}
          >
            {isAnchoring ? 'Committing...' : 'Anchor Batch On-Chain'}
          </button>
        </div>
      </div>

      {/* User / Persona Control Footer */}
      <div className="h-14 bg-[#232428] px-2.5 flex items-center justify-between border-t border-[#1f2023]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold select-none text-white shrink-0"
            style={{ backgroundColor: activePersona?.color || '#5865F2' }}
          >
            {activePersona?.avatar || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate">
                {activePersona?.name || 'Anonymous'}
              </span>
              <span className="text-[10px] px-1 rounded bg-[#5865F2]/20 text-[#5865F2] font-semibold">
                Signer
              </span>
            </div>
            <div className="text-[10px] text-[#949ba4] font-mono truncate">
              {activePersona?.address ? `${activePersona.address.substring(0, 6)}...${activePersona.address.substring(38)}` : ''}
            </div>
          </div>
        </div>

        {/* Quick Switch Persona Dropdown */}
        <select
          value={activePersonaId}
          onChange={(e) => onSelectPersona(e.target.value)}
          className="bg-[#1e1f22] text-[#dbdee1] text-xs py-1 px-1.5 rounded border border-[#35373c] focus:outline-none cursor-pointer"
          title="Switch Persona Signer"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.avatar} {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

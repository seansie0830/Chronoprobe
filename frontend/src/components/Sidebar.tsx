import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  FolderGit2,
  Settings,
  Download,
  Upload,
  ShieldCheck,
  Wallet,
  Hash,
  Plus,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
}) => {
  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  return (
    <aside
      className={`bg-[#0f172a] border-r border-[#1e293b] flex flex-col h-full select-none transition-all duration-300 ease-in-out shrink-0 z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 1. Header: Brand Logo & Hamburger Toggle */}
      <div className="h-14 px-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#111c33]/40">
        {!isCollapsed && (
          <NavLink to="/chat?id=general" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-wider text-slate-100 uppercase truncate">
                Chronoprobe
              </span>
              <span className="text-[10px] text-slate-400 truncate">Verifiable Suite</span>
            </div>
          </NavLink>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm mx-auto">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white transition-colors cursor-pointer border border-[#334155] ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* When collapsed: Quick toggle button at top */}
      {isCollapsed && (
        <div className="p-2 flex justify-center border-b border-[#1e293b]">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white transition-colors cursor-pointer border border-[#334155]"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      )}

      {/* 2. Main Navigation Links (SaaS Menu) */}
      <div className="px-2 py-3 space-y-1">
        {!isCollapsed && (
          <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1 tracking-wider">
            Navigation
          </div>
        )}

        {/* Chat / Channels */}
        <NavLink
          to="/chat?id=general"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-indigo-600/15 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Channels' : undefined}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Channels</span>}
        </NavLink>

        {/* Merkle Explorer */}
        <NavLink
          to="/inspect"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-emerald-600/15 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Merkle Explorer' : undefined}
        >
          <FolderGit2 className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Merkle Explorer</span>}
        </NavLink>

        {/* Web3 Wallet */}
        <NavLink
          to="/login"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-blue-600/15 text-blue-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Web3 Wallet' : undefined}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Web3 Wallet</span>}
        </NavLink>

        {/* Export Proofs */}
        <NavLink
          to="/export"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-amber-600/15 text-amber-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Export Receipts' : undefined}
        >
          <Download className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Export Receipts</span>}
        </NavLink>

        {/* Import History */}
        <NavLink
          to="/import"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-violet-600/15 text-violet-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Import Archive' : undefined}
        >
          <Upload className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Import Archive</span>}
        </NavLink>

        {/* Settings & Personas */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
              isActive
                ? 'bg-indigo-600/15 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-0' : ''}`
          }
          title={isCollapsed ? 'Settings & Keys' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings & Keys</span>}
        </NavLink>
      </div>

      {/* 3. Channels List (Visible when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 border-t border-[#1e293b]">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold px-2 mb-1.5 tracking-wider uppercase">
              <span>Text Channels</span>
              <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-slate-200 transition-colors" />
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChannel(ch.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 font-semibold'
                        : 'text-slate-400 hover:bg-[#1e293b]/70 hover:text-slate-200'
                    }`}
                  >
                    <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Merkle Batch Status Card */}
          <div className="p-3 bg-[#1e293b]/60 rounded-lg border border-[#334155]/60 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                Merkle Queue
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#334155] text-slate-300 font-semibold">
                {pendingCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">
              {pendingCount > 0
                ? `${pendingCount} message(s) ready to anchor.`
                : 'All messages verified on-chain.'}
            </p>
            <button
              onClick={onAnchorBatch}
              disabled={pendingCount === 0 || isAnchoring}
              className={`w-full py-1.5 px-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                pendingCount > 0 && !isAnchoring
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm'
                  : 'bg-[#1e293b] text-slate-500 border border-[#334155]/40 cursor-not-allowed'
              }`}
            >
              {isAnchoring ? 'Anchoring...' : 'Anchor Batch'}
            </button>
          </div>
        </div>
      )}

      {/* Spacer when collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* 4. Footer: User / Persona Signer Control */}
      <div className={`h-14 bg-[#090d16] border-t border-[#1e293b] flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold select-none text-white shrink-0 shadow-sm"
            style={{ backgroundColor: activePersona?.color || '#4f46e5' }}
            title={activePersona?.name}
          >
            {activePersona?.avatar || '👤'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {activePersona?.name || 'User'}
                </span>
                <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-400 font-mono font-medium">
                  ECDSA
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {activePersona?.address ? `${activePersona.address.substring(0, 6)}...${activePersona.address.substring(38)}` : ''}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <select
            value={activePersonaId}
            onChange={(e) => onSelectPersona(e.target.value)}
            className="bg-[#1e293b] text-slate-300 text-xs py-1 px-1.5 rounded-md border border-[#334155] focus:outline-none cursor-pointer"
            title="Switch Persona Signer"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.avatar} {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </aside>
  );
};




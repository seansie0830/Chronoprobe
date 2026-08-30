import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  FolderGit2,
  Settings,
  Download,
  Upload,
  ShieldCheck,
} from 'lucide-react';

export const ServerRail: React.FC = () => {
  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 select-none z-20 border-r border-[#111214]">
      {/* Brand Icon */}
      <NavLink
        to="/chat?id=general"
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#5865F2] flex items-center justify-center text-white transition-all duration-200 shadow-md group relative mb-2"
        title="Chronoprobe Home"
      >
        <ShieldCheck className="w-7 h-7" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Chronoprobe Protocol
        </span>
      </NavLink>

      <div className="w-8 h-[2px] bg-[#35363c] rounded mb-1" />

      {/* Nav Link: Chat */}
      <NavLink
        to="/chat?id=general"
        className={({ isActive }) =>
          `w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative ${
            isActive
              ? 'bg-[#5865F2] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865F2] hover:text-white'
          }`
        }
        title="Verifiable Chat"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Verifiable Chat (/chat)
        </span>
      </NavLink>

      {/* Nav Link: Inspect */}
      <NavLink
        to="/inspect"
        className={({ isActive }) =>
          `w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative ${
            isActive
              ? 'bg-[#23a55a] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#23a55a] hover:text-white'
          }`
        }
        title="Merkle Tree Explorer"
      >
        <FolderGit2 className="w-5 h-5" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Merkle Tree Explorer (/inspect)
        </span>
      </NavLink>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav Link: Export */}
      <NavLink
        to="/export"
        className={({ isActive }) =>
          `w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative ${
            isActive
              ? 'bg-[#f0b232] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#f0b232] hover:text-white'
          }`
        }
        title="Export Receipts"
      >
        <Download className="w-5 h-5" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Export Proofs (/export)
        </span>
      </NavLink>

      {/* Nav Link: Import */}
      <NavLink
        to="/import"
        className={({ isActive }) =>
          `w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative ${
            isActive
              ? 'bg-[#eb459e] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#eb459e] hover:text-white'
          }`
        }
        title="Import History"
      >
        <Upload className="w-5 h-5" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Import Proofs (/import)
        </span>
      </NavLink>

      {/* Nav Link: Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative ${
            isActive
              ? 'bg-[#5865F2] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865F2] hover:text-white'
          }`
        }
        title="Settings & Keypairs"
      >
        <Settings className="w-5 h-5" />
        <span className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Keypairs & Settings (/settings)
        </span>
      </NavLink>
    </div>
  );
};

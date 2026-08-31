import React, { useState } from 'react';
import { Key, Plus, Trash2, Shield, Check, Copy, Globe } from 'lucide-react';
import { createRandomPersona, createPersonaFromSeed } from '../lib/crypto';
import {
  savePersonas,
  setActivePersonaId,
  getStoredContractAddress,
  saveContractAddress,
  getStoredExplorerUrl,
  saveExplorerUrl,
  DEFAULT_EXPLORER_URL,
} from '../lib/storage';
import type { Persona } from '../lib/types';

interface SettingsViewProps {
  personas: Persona[];
  activePersonaId: string;
  onUpdatePersonas: (personas: Persona[], activeId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  personas,
  activePersonaId,
  onUpdatePersonas,
}) => {
  const [newName, setNewName] = useState('');
  const [customSeed, setCustomSeed] = useState('');
  const [selectedColor, setSelectedColor] = useState('#5865F2');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [contractInput, setContractInput] = useState<string>(getStoredContractAddress());
  const [explorerInput, setExplorerInput] = useState<string>(getStoredExplorerUrl());
  const [copied, setCopied] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [explorerSaveSuccess, setExplorerSaveSuccess] = useState(false);

  const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#9B59B6'];
  const avatars = ['🦊', '🐼', '🦉', '🦁', '🤖', '🐱', '🦄', '🚀'];

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let newPersona: Persona;
    if (customSeed.trim()) {
      newPersona = createPersonaFromSeed(newName.trim(), customSeed.trim(), selectedColor, selectedAvatar);
    } else {
      newPersona = createRandomPersona(newName.trim(), selectedColor, selectedAvatar);
    }

    const updated = [...personas, newPersona];
    savePersonas(updated);
    setActivePersonaId(newPersona.id);
    onUpdatePersonas(updated, newPersona.id);

    setNewName('');
    setCustomSeed('');
  };

  const handleDeletePersona = (id: string) => {
    if (personas.length <= 1) return;
    const updated = personas.filter((p) => p.id !== id);
    const newActive = activePersonaId === id ? updated[0].id : activePersonaId;
    savePersonas(updated);
    setActivePersonaId(newActive);
    onUpdatePersonas(updated, newActive);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractInput.startsWith('0x')) {
      saveContractAddress(contractInput as `0x${string}`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSaveExplorer = (e: React.FormEvent) => {
    e.preventDefault();
    if (explorerInput.trim()) {
      saveExplorerUrl(explorerInput.trim());
      setExplorerSaveSuccess(true);
      setTimeout(() => setExplorerSaveSuccess(false), 2000);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] select-none min-w-0 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-400" />
          Identity & Network Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage client-side cryptographic keypairs, smart contract address, and Ottoscan / block explorer endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Create New Persona */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Generate New Signer Persona
          </h3>

          <form onSubmit={handleCreatePersona} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Persona Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Alice, Bob, Charlie, Compliance Agent"
                className="w-full bg-[#1e293b] text-slate-100 p-2.5 rounded-lg border border-[#334155] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Custom Seed / Mnemonic (Optional)</label>
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Leave empty for auto-generated fresh keypair"
                className="w-full bg-[#1e293b] text-slate-100 p-2.5 rounded-lg border border-[#334155] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Select Avatar & Tag Color</label>
              <div className="flex gap-2 mb-2">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                      selectedAvatar === av ? 'bg-indigo-600 scale-105 shadow-sm' : 'bg-[#1e293b] hover:bg-[#334155]'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      selectedColor === c ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all cursor-pointer shadow-sm text-xs"
            >
              Generate & Add Signer
            </button>
          </form>
        </div>

        {/* Right Column: Active Personas List */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Configured Signers ({personas.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {personas.map((p) => {
              const isActive = p.id === activePersonaId;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#1e293b] border-indigo-500/80 shadow-sm'
                      : 'bg-[#1e293b]/40 border-[#334155]/60 hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                      <span className="font-semibold text-slate-100 text-xs">{p.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium font-mono">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          onClick={() => {
                            setActivePersonaId(p.id);
                            onUpdatePersonas(personas, p.id);
                          }}
                          className="text-[10px] px-2.5 py-1 bg-[#334155] hover:bg-indigo-600 text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                      {personas.length > 1 && (
                        <button
                          onClick={() => handleDeletePersona(p.id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                          title="Delete Signer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Address: {p.address.substring(0, 8)}...{p.address.substring(36)}</span>
                      <button
                        onClick={() => copyToClipboard(p.address, `addr_${p.id}`)}
                        className="hover:text-slate-200"
                      >
                        {copied === `addr_${p.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network Configuration Cards (Contract + Block Explorer) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Address Card */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] space-y-3 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Chronoprobe Smart Contract Address
          </h3>
          <p className="text-xs text-slate-400">
            Anchor contract address on your active chain (Local Anvil node or Sepolia testnet).
          </p>
          <form onSubmit={handleSaveContract} className="flex gap-2">
            <input
              type="text"
              value={contractInput}
              onChange={(e) => setContractInput(e.target.value)}
              className="flex-1 bg-[#1e293b] text-slate-100 font-mono text-xs p-2.5 rounded-lg border border-[#334155] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-all shadow-sm shrink-0"
            >
              {saveSuccess ? 'Saved ✓' : 'Save Address'}
            </button>
          </form>
        </div>

        {/* Block Explorer / Ottoscan Base URL Card */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-[#1e293b] space-y-3 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-400" />
            Blockchain Explorer Base URL (Ottoscan / Etherscan)
          </h3>
          <p className="text-xs text-slate-400">
            Base URL prefix for transactions, blocks, and address inspection links (e.g. <span className="font-mono text-indigo-300">{DEFAULT_EXPLORER_URL}</span> for Ottoscan, or <span className="font-mono text-indigo-300">https://sepolia.etherscan.io</span>).
          </p>
          <form onSubmit={handleSaveExplorer} className="flex gap-2">
            <input
              type="text"
              value={explorerInput}
              onChange={(e) => setExplorerInput(e.target.value)}
              placeholder="http://localhost:5173 or https://sepolia.etherscan.io"
              className="flex-1 bg-[#1e293b] text-slate-100 font-mono text-xs p-2.5 rounded-lg border border-[#334155] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-all shadow-sm shrink-0"
            >
              {explorerSaveSuccess ? 'Saved ✓' : 'Save URL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};



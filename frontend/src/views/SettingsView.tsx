import React, { useState } from 'react';
import { Key, Plus, Trash2, Shield, Check, Copy } from 'lucide-react';
import { createRandomPersona, createPersonaFromSeed } from '../lib/crypto';
import {
  savePersonas,
  setActivePersonaId,
  getStoredContractAddress,
  saveContractAddress,
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
  const [copied, setCopied] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] select-none min-w-0 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#383a40] pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-[#5865F2]" />
          Sandbox Identity & Keypair Manager
        </h2>
        <p className="text-xs text-[#949ba4] mt-1">
          Manage client-side ECDSA keypairs (PoC Sandbox) used to sign and endorse messages before Merkle batching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Create New Persona */}
        <div className="bg-[#2b2d31] p-5 rounded-lg border border-[#383a40] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#23a55a]" />
            Generate New Persona Signer
          </h3>

          <form onSubmit={handleCreatePersona} className="space-y-4 text-xs">
            <div>
              <label className="text-[#949ba4] block mb-1 font-semibold uppercase">Persona Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Charlie, Auditor Bot, Alice"
                className="w-full bg-[#1e1f22] text-white p-2.5 rounded border border-[#383a40] focus:outline-none focus:border-[#5865F2]"
                required
              />
            </div>

            <div>
              <label className="text-[#949ba4] block mb-1 font-semibold uppercase">Custom Seed / Mnemonic (Optional)</label>
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Leave blank for auto-generated fresh random key"
                className="w-full bg-[#1e1f22] text-white p-2.5 rounded border border-[#383a40] focus:outline-none focus:border-[#5865F2] font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-[#949ba4] block mb-1 font-semibold uppercase">Select Avatar & Color</label>
              <div className="flex gap-2 mb-2">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 rounded text-base flex items-center justify-center transition-all ${
                      selectedAvatar === av ? 'bg-[#5865F2] scale-110' : 'bg-[#1e1f22] hover:bg-[#35373c]'
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
                      selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded transition-all cursor-pointer shadow-md"
            >
              Generate & Add Persona
            </button>
          </form>
        </div>

        {/* Right Column: Active Personas List */}
        <div className="bg-[#2b2d31] p-5 rounded-lg border border-[#383a40] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5865F2]" />
            Active Sandbox Identities ({personas.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {personas.map((p) => {
              const isActive = p.id === activePersonaId;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#1e1f22] border-[#5865F2]'
                      : 'bg-[#1e1f22]/50 border-[#383a40] hover:border-[#4e5058]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                      <span className="font-bold text-white text-xs">{p.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5865F2] text-white font-semibold">
                          Active Signer
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
                          className="text-[10px] px-2 py-1 bg-[#35373c] hover:bg-[#5865F2] text-white rounded transition-colors cursor-pointer"
                        >
                          Switch To
                        </button>
                      )}
                      {personas.length > 1 && (
                        <button
                          onClick={() => handleDeletePersona(p.id)}
                          className="p-1 hover:text-[#ed4245] text-[#949ba4] transition-colors"
                          title="Delete Persona"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-[#949ba4]">
                      <span>Address: {p.address.substring(0, 8)}...{p.address.substring(36)}</span>
                      <button
                        onClick={() => copyToClipboard(p.address, `addr_${p.id}`)}
                        className="hover:text-white"
                      >
                        {copied === `addr_${p.id}` ? <Check className="w-3 h-3 text-[#23a55a]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contract Config Card */}
      <div className="bg-[#2b2d31] p-5 rounded-lg border border-[#383a40] space-y-3">
        <h3 className="text-sm font-bold text-white">Chronoprobe Smart Contract Address</h3>
        <p className="text-xs text-[#949ba4]">
          Set the deployed Chronoprobe contract address (Local Anvil node or Sepolia testnet).
        </p>
        <form onSubmit={handleSaveContract} className="flex gap-2">
          <input
            type="text"
            value={contractInput}
            onChange={(e) => setContractInput(e.target.value)}
            className="flex-1 bg-[#1e1f22] text-white font-mono text-xs p-2.5 rounded border border-[#383a40] focus:outline-none focus:border-[#5865F2]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#23a55a] hover:bg-[#1f924e] text-white text-xs font-semibold rounded cursor-pointer transition-all"
          >
            {saveSuccess ? 'Saved ✓' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
};

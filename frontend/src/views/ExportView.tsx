import React, { useState, useEffect } from 'react';
import { Download, Check, Copy } from 'lucide-react';
import {
  getStoredChannels,
  getStoredMessages,
  getStoredPersonas,
} from '../lib/storage';

export const ExportView: React.FC = () => {
  const [exportData, setExportData] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      channels: getStoredChannels(),
      personas: getStoredPersonas(),
      messages: getStoredMessages(),
    };
    setExportData(JSON.stringify(bundle, null, 2));
  }, []);

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronoprobe_proof_bundle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const messageCount = getStoredMessages().length;
  const verifiedCount = getStoredMessages().filter((m) => m.status === 'verified').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] select-none min-w-0 overflow-y-auto p-6 space-y-6">
      <div className="border-b border-[#383a40] pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-[#f0b232]" />
          Export Cryptographic Proof Receipts
        </h2>
        <p className="text-xs text-[#949ba4] mt-1">
          Export full chat assertions, signatures, Merkle paths, and on-chain anchor transactions as verifiable JSON receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="p-4 rounded-lg bg-[#2b2d31] border border-[#383a40]">
          <span className="text-xs text-[#949ba4] uppercase font-bold block mb-1">Total Signed Assertions</span>
          <span className="text-2xl font-bold text-white font-mono">{messageCount}</span>
        </div>
        <div className="p-4 rounded-lg bg-[#2b2d31] border border-[#383a40]">
          <span className="text-xs text-[#949ba4] uppercase font-bold block mb-1">On-Chain Verified Leaves</span>
          <span className="text-2xl font-bold text-[#23a55a] font-mono">{verifiedCount}</span>
        </div>
      </div>

      <div className="max-w-2xl bg-[#2b2d31] p-5 rounded-lg border border-[#383a40] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#949ba4] uppercase">
            Proof Bundle Preview (JSON)
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#dbdee1] hover:text-white px-3 py-1.5 rounded bg-[#1e1f22] border border-[#383a40] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded bg-[#f0b232] hover:bg-[#d99f2b] font-semibold cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <textarea
          rows={12}
          readOnly
          value={exportData}
          className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded font-mono text-[11px] border border-[#383a40] focus:outline-none"
        />
      </div>
    </div>
  );
};

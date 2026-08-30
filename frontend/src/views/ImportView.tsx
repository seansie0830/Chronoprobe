import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  saveChannels,
  saveMessages,
  savePersonas,
} from '../lib/storage';

export const ImportView: React.FC = () => {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const navigate = useNavigate();

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        throw new Error('Invalid format: missing messages array.');
      }

      if (parsed.channels) saveChannels(parsed.channels);
      if (parsed.personas) savePersonas(parsed.personas);
      if (parsed.messages) saveMessages(parsed.messages);

      setStatus({
        type: 'success',
        message: `Successfully restored ${parsed.messages.length} cryptographically signed messages!`,
      });
      setTimeout(() => {
        navigate('/chat?id=general');
      }, 1500);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to parse JSON file.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] select-none min-w-0 overflow-y-auto p-6 space-y-6">
      <div className="border-b border-[#383a40] pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#eb459e]" />
          Import Cryptographically Signed Chat Archives
        </h2>
        <p className="text-xs text-[#949ba4] mt-1">
          Import chat histories, Merkle proof receipts, and personas to verify interval proofs in the sandbox.
        </p>
      </div>

      <div className="max-w-2xl bg-[#2b2d31] p-5 rounded-lg border border-[#383a40] space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#949ba4] block mb-2 uppercase">
            Upload JSON Archive File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-[#949ba4] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#35373c] file:text-white hover:file:bg-[#5865F2] cursor-pointer"
          />
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#949ba4] block mb-1 uppercase">
              Or Paste Raw JSON Archive
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"channels": [...], "messages": [...], "personas": [...]}'
              className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded font-mono text-xs border border-[#383a40] focus:outline-none focus:border-[#5865F2]"
              required
            />
          </div>

          {status.type === 'error' && (
            <div className="p-3 rounded bg-[#f23f43]/10 border border-[#f23f43]/30 text-[#f23f43] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{status.message}</span>
            </div>
          )}

          {status.type === 'success' && (
            <div className="p-3 rounded bg-[#23a55a]/10 border border-[#23a55a]/30 text-[#23a55a] text-xs flex items-center gap-2">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{status.message} Redirecting to chat...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#eb459e] hover:bg-[#d83a8f] text-white font-semibold rounded text-xs transition-all cursor-pointer shadow-md"
          >
            Validate & Import Archive
          </button>
        </form>
      </div>
    </div>
  );
};

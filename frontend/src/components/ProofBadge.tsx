import React from 'react';
import { ShieldCheck, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import type { ChatMessage } from '../lib/types';
import { useNavigate } from 'react-router-dom';

interface ProofBadgeProps {
  message: ChatMessage;
}

export const ProofBadge: React.FC<ProofBadgeProps> = ({ message }) => {
  const navigate = useNavigate();

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.rootHash) {
      navigate(`/inspect?leaf=${message.leafHash}&root=${message.rootHash}`);
    } else {
      navigate(`/inspect?leaf=${message.leafHash}`);
    }
  };

  if (message.status === 'verified') {
    return (
      <div
        onClick={handleInspect}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-[#23a55a]/10 hover:bg-[#23a55a]/20 border border-[#23a55a]/30 text-[#23a55a] text-[11px] font-mono cursor-pointer transition-all group"
        title="Click to inspect cryptographic Merkle path and interval proofs"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#23a55a]" />
        <span>Verified [#{message.startBlock}</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>#{message.endBlock}]</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 ml-0.5" />
      </div>
    );
  }

  if (message.status === 'anchoring') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-[#f0b232]/10 border border-[#f0b232]/30 text-[#f0b232] text-[11px] font-mono">
        <Clock className="w-3.5 h-3.5 animate-spin text-[#f0b232]" />
        <span>Anchoring to Chain... (Signed @ #{message.startBlock})</span>
      </div>
    );
  }

  // Pending
  return (
    <div
      onClick={handleInspect}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-[#80848e]/10 hover:bg-[#80848e]/20 border border-[#80848e]/30 text-[#949ba4] text-[11px] font-mono cursor-pointer transition-all"
      title="Signed with blockhash, waiting for Merkle tree batch anchor"
    >
      <Clock className="w-3.5 h-3.5 text-[#949ba4]" />
      <span>Signed @ Block #{message.startBlock} (Pending Batch)</span>
    </div>
  );
};

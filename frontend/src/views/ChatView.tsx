import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { Header } from '../components/Header';
import { ProofBadge } from '../components/ProofBadge';
import { signAssertion } from '../lib/crypto';
import {
  getStoredChannels,
  getStoredMessages,
  saveMessages,
} from '../lib/storage';
import type { ChatMessage, Persona, Channel } from '../lib/types';

interface ChatViewProps {
  personas: Persona[];
  activePersonaId: string;
  onRefreshBatch: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  personas,
  activePersonaId,
  onRefreshBatch,
  isSidebarOpen,
  onToggleSidebar,
}) => {

  const [searchParams] = useSearchParams();
  const channelId = searchParams.get('id') || 'general';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [simulatedBlock, setSimulatedBlock] = useState({ number: 100, hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' as `0x${string}` });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const publicClient = usePublicClient();

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];
  const activeChannel = channels.find((c) => c.id === channelId) || {
    id: channelId,
    name: channelId,
    topic: 'Verifiable Chronoprobe Channel',
    category: 'TEXT CHANNELS',
  };

  // Load channels and messages
  useEffect(() => {
    setChannels(getStoredChannels());
    setMessages(getStoredMessages());
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channelId]);

  // Fetch current block from chain (or simulate if offline)
  useEffect(() => {
    const fetchBlock = async () => {
      try {
        if (publicClient) {
          const block = await publicClient.getBlock();
          setSimulatedBlock({
            number: Number(block.number),
            hash: block.hash as `0x${string}`,
          });
        }
      } catch {
        // Fallback for offline sandbox mode
        setSimulatedBlock((prev) => ({
          number: prev.number + 1,
          hash: `0x${Math.random().toString(16).substring(2).padEnd(64, '0')}` as `0x${string}`,
        }));
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 10000);
    return () => clearInterval(interval);
  }, [publicClient]);

  // Send & Sign Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || isSending || !activePersona) return;

    setIsSending(true);
    try {
      // 1. Lower bound assertion (signing content + current blockhash)
      const { dataHash, signature, leafHash } = await signAssertion(
        activePersona,
        inputContent.trim(),
        simulatedBlock.number,
        simulatedBlock.hash
      );

      const newMessage: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        channelId,
        authorId: activePersona.id,
        authorAddress: activePersona.address,
        authorName: activePersona.name,
        content: inputContent.trim(),
        timestamp: Date.now(),
        startBlock: simulatedBlock.number,
        startBlockHash: simulatedBlock.hash,
        dataHash,
        signature,
        leafHash,
        status: 'pending',
      };

      const updated = [...getStoredMessages(), newMessage];
      saveMessages(updated);
      setMessages(updated);
      setInputContent('');
      onRefreshBatch();
    } catch (err) {
      console.error('Error signing message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const channelMessages = messages.filter((m) => m.channelId === channelId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] min-w-0">
      <Header
        channelName={activeChannel.name}
        channelTopic={activeChannel.topic}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />

      {/* Message List */}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {channelMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-slate-100 font-semibold text-sm mb-1">
              Welcome to #{activeChannel.name}
            </h3>
            <p className="text-xs max-w-sm text-slate-400 leading-relaxed">
              This channel features cryptographically certified message timestamps. Each message is signed with a recent blockhash ($t &gt; B_{'{start}'}$) and batched into an on-chain Merkle root ($t &lt; B_{'{end}'}$).
            </p>
          </div>
        ) : (
          channelMessages.map((msg, idx) => {
            const authorPersona = personas.find((p) => p.id === msg.authorId);
            const isFirstInGroup =
              idx === 0 || channelMessages[idx - 1].authorId !== msg.authorId;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 group hover:bg-[#131b2e]/40 -mx-4 px-4 py-1.5 rounded-lg transition-colors ${
                  isFirstInGroup ? 'mt-3 pt-2' : 'mt-0.5'
                }`}
              >
                {isFirstInGroup ? (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 select-none shadow-sm"
                    style={{ backgroundColor: authorPersona?.color || '#4f46e5' }}
                  >
                    {authorPersona?.avatar || '👤'}
                  </div>
                ) : (
                  <div className="w-8 text-[10px] text-slate-500 text-right opacity-0 group-hover:opacity-100 select-none pt-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {isFirstInGroup && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-100 text-xs">
                        {msg.authorName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({msg.authorAddress.substring(0, 6)}...{msg.authorAddress.substring(38)})
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-200 leading-relaxed break-words font-sans">
                    {msg.content}
                  </div>

                  <ProofBadge message={msg} />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-[#0f172a] border-t border-[#1e293b]">
        <form
          onSubmit={handleSendMessage}
          className="bg-[#1e293b] rounded-lg px-4 py-2.5 flex items-center gap-3 border border-[#334155] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm"
        >
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={`Message #${activeChannel.name} as ${activePersona?.name || 'User'} (auto-signs with Block #${simulatedBlock.number})`}
            className="bg-transparent flex-1 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputContent.trim() || isSending}
            className={`p-1.5 rounded-md transition-all ${
              inputContent.trim() && !isSending
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-sm'
                : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span>Reference Anchor:</span>
            <span className="text-emerald-400 font-medium">Block #{simulatedBlock.number}</span>
          </span>
          <span>Press Enter to send & sign</span>
        </div>
      </div>
    </div>
  );
};



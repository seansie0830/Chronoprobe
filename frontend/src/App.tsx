import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { WagmiProvider, usePublicClient, useWalletClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, CHRONOPROBE_ABI } from './config/wagmi';
import { ServerRail } from './components/ServerRail';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './views/ChatView';
import { InspectView } from './views/InspectView';
import { SettingsView } from './views/SettingsView';
import { ImportView } from './views/ImportView';
import { ExportView } from './views/ExportView';
import { MerkleTree } from './lib/merkle';
import {
  getStoredChannels,
  getStoredPersonas,
  getActivePersonaId,
  setActivePersonaId,
  getStoredMessages,
  saveMessages,
  getStoredContractAddress,
} from './lib/storage';
import type { Persona, Channel } from './lib/types';

const queryClient = new QueryClient();

const MainLayout: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaIdState] = useState<string>('');
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    setChannels(getStoredChannels());
    const loadedPersonas = getStoredPersonas();
    setPersonas(loadedPersonas);
    setActivePersonaIdState(getActivePersonaId());
  }, [refreshTrigger]);

  const handleSelectChannel = (channelId: string) => {
    navigate(`/chat?id=${channelId}`);
  };

  const handleSelectPersona = (id: string) => {
    setActivePersonaId(id);
    setActivePersonaIdState(id);
  };

  const handleUpdatePersonas = (newPersonas: Persona[], activeId: string) => {
    setPersonas(newPersonas);
    setActivePersonaIdState(activeId);
  };

  // Compute pending unanchored messages count
  const allMessages = getStoredMessages();
  const pendingMessages = allMessages.filter((m) => m.status === 'pending');

  // Anchor Batch On-Chain
  const handleAnchorBatch = async () => {
    if (pendingMessages.length === 0 || isAnchoring) return;
    setIsAnchoring(true);

    try {
      // 1. Build Merkle Tree of all pending messages
      const tree = new MerkleTree(pendingMessages);
      const root = tree.getRoot();

      let endBlock = 128;
      let endTimestamp = Math.floor(Date.now() / 1000);
      let txHash: `0x${string}` = `0x${Math.random().toString(16).substring(2).padEnd(64, '0')}`;

      // 2. Commit root on-chain (if wallet & contract configured, otherwise mock simulation)
      const contractAddress = getStoredContractAddress();
      if (walletClient && contractAddress) {
        try {
          const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: CHRONOPROBE_ABI,
            functionName: 'commitRoot',
            args: [root],
          });
          txHash = hash;
          if (publicClient) {
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            endBlock = Number(receipt.blockNumber);
          }
        } catch (contractErr) {
          console.warn('On-chain commit fell back to sandbox simulation:', contractErr);
          endBlock = (pendingMessages[pendingMessages.length - 1]?.startBlock || 100) + 5;
        }
      } else {
        endBlock = (pendingMessages[pendingMessages.length - 1]?.startBlock || 100) + 5;
      }

      // 3. Update all pending messages with proof receipt, root, and verified status
      const updatedMessages = allMessages.map((m) => {
        const pendingIdx = pendingMessages.findIndex((pm) => pm.id === m.id);
        if (pendingIdx !== -1) {
          const proof = tree.getProof(pendingIdx);
          return {
            ...m,
            status: 'verified' as const,
            rootHash: root,
            endBlock,
            endTimestamp,
            txHash,
            merkleProof: proof,
          };
        }
        return m;
      });

      saveMessages(updatedMessages);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Batch anchoring error:', err);
    } finally {
      setIsAnchoring(false);
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const activeChannelId = searchParams.get('id') || 'general';

  return (
    <div className="flex h-screen w-screen bg-[#1e1f22] overflow-hidden text-[#dbdee1]">
      {/* 1. Leftmost Server / Nav Rail */}
      <ServerRail />

      {/* 2. Secondary Sidebar (Channels & Personas) */}
      <Sidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={handleSelectPersona}
        pendingCount={pendingMessages.length}
        onAnchorBatch={handleAnchorBatch}
        isAnchoring={isAnchoring}
      />

      {/* 3. Main View Area */}
      <Routes>
        <Route path="/" element={<Navigate to="/chat?id=general" replace />} />
        <Route
          path="/chat"
          element={
            <ChatView
              personas={personas}
              activePersonaId={activePersonaId}
              onRefreshBatch={() => setRefreshTrigger((prev) => prev + 1)}
            />
          }
        />
        <Route path="/inspect" element={<InspectView />} />
        <Route
          path="/settings"
          element={
            <SettingsView
              personas={personas}
              activePersonaId={activePersonaId}
              onUpdatePersonas={handleUpdatePersonas}
            />
          }
        />
        <Route path="/import" element={<ImportView />} />
        <Route path="/export" element={<ExportView />} />
        <Route path="*" element={<Navigate to="/chat?id=general" replace />} />
      </Routes>
    </div>
  );
};

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;


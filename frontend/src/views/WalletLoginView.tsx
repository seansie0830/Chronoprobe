import React from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { Wallet, LogOut, CheckCircle, Network, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WalletLoginView: React.FC = () => {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] select-none min-w-0 overflow-y-auto p-6 items-center justify-center">
      <div className="max-w-md w-full bg-[#2b2d31] p-6 rounded-xl border border-[#383a40] shadow-xl space-y-6">
        {/* Brand / Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#5865F2] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Connect Web3 Wallet</h2>
          <p className="text-xs text-[#949ba4]">
            Connect MetaMask or any injected Web3 browser wallet to anchor Merkle proofs directly on-chain.
          </p>
        </div>

        {isConnected && address ? (
          /* Connected State */
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#1e1f22] border border-[#23a55a]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#949ba4] font-semibold uppercase">Wallet Connected</span>
                <span className="flex items-center gap-1 text-xs text-[#23a55a] font-bold">
                  <CheckCircle className="w-4 h-4" /> Active
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="text-white font-bold break-all bg-[#2b2d31] p-2 rounded border border-[#383a40]">
                  {address}
                </div>
                <div className="flex justify-between text-[#949ba4] pt-1">
                  <span>Balance:</span>
                  <span className="text-white font-semibold">
                    {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </span>
                </div>

                <div className="flex justify-between text-[#949ba4]">
                  <span>Connector:</span>
                  <span className="text-[#5865F2] font-semibold">{connector?.name || 'Injected'}</span>
                </div>
              </div>
            </div>

            {/* Network Selector */}
            <div className="space-y-2">
              <label className="text-xs text-[#949ba4] font-semibold uppercase flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-[#5865F2]" />
                Select Network / Chain
              </label>
              <div className="grid grid-cols-2 gap-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => switchChain({ chainId: chain.id })}
                    className={`p-2 rounded text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      chainId === chain.id
                        ? 'bg-[#5865F2] text-white shadow-md'
                        : 'bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c]'
                    }`}
                  >
                    <span>{chain.name}</span>
                    {chainId === chain.id && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => disconnect()}
                className="flex-1 py-2.5 px-4 bg-[#da373c] hover:bg-[#a1282c] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
              <button
                onClick={() => navigate('/chat?id=general')}
                className="flex-1 py-2.5 px-4 bg-[#23a55a] hover:bg-[#1f924e] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                Enter Chat <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Disconnected State: Connect Wallet List */
          <div className="space-y-3">
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => connect({ connector: c })}
                disabled={isPending}
                className="w-full p-3.5 rounded-lg bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] hover:border-[#5865F2] text-white font-semibold text-sm flex items-center justify-between transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="group-hover:text-[#5865F2] transition-colors">{c.name}</span>
                </div>
                <span className="text-xs text-[#949ba4] group-hover:text-white">Connect &rarr;</span>
              </button>
            ))}

            <div className="p-3 bg-[#1e1f22] rounded-lg border border-[#383a40]/60 text-[11px] text-[#949ba4] space-y-1">
              <div className="flex items-center gap-1 text-[#f0b232] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sandbox Mode Available</span>
              </div>
              <p>
                You can also use Chronoprobe without an external wallet. The client generates zero-friction ECDSA assertion signers directly in the app.
              </p>
            </div>

            <button
              onClick={() => navigate('/chat?id=general')}
              className="w-full py-2 text-center text-xs text-[#949ba4] hover:text-white transition-colors cursor-pointer"
            >
              Continue to Chat as Guest &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

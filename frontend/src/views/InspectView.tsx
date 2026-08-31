import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { MerkleTree } from '../lib/merkle';
import { verifyAssertionSignature } from '../lib/crypto';
import {
  getStoredMessages,
  getStoredContractAddress,
  getExplorerTxUrl,
  getExplorerBlockUrl,
  getExplorerAddressUrl,
} from '../lib/storage';
import { usePublicClient } from 'wagmi';
import { CHRONOPROBE_ABI } from '../config/wagmi';
import { ExternalLink } from 'lucide-react';
import type { ChatMessage, MerkleNode } from '../lib/types';


export const InspectView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetLeaf = searchParams.get('leaf') as `0x${string}` | null;
  const targetRoot = searchParams.get('root') as `0x${string}` | null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedNode, setSelectedNode] = useState<MerkleNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Verification Checklist State
  const [sigValid, setSigValid] = useState<boolean | null>(null);
  const [merkleValid, setMerkleValid] = useState<boolean | null>(null);
  const [onChainValid, setOnChainValid] = useState<boolean | null>(null);
  const [anchorDetails, setAnchorDetails] = useState<{ blockNumber: number; timestamp: number } | null>(null);

  const publicClient = usePublicClient();
  const contractAddress = getStoredContractAddress();

  useEffect(() => {
    const stored = getStoredMessages();
    setMessages(stored);
  }, []);

  // Find target message and tree
  const targetMessage = messages.find(
    (m) =>
      (targetLeaf && m.leafHash.toLowerCase() === targetLeaf.toLowerCase()) ||
      (targetRoot && m.rootHash?.toLowerCase() === targetRoot.toLowerCase())
  ) || messages[0];

  // Build the Merkle tree for the batch of the target message
  const batchMessages = targetMessage?.rootHash
    ? messages.filter((m) => m.rootHash?.toLowerCase() === targetMessage.rootHash?.toLowerCase())
    : targetMessage
    ? [targetMessage]
    : [];

  const tree = new MerkleTree(batchMessages);
  const proofSet = new Set(
    (targetMessage?.merkleProof || []).map((p) => p.toLowerCase())
  );
  const rootNode = tree.toHierarchy(targetLeaf || undefined, proofSet);

  // Auto-expand tree and select target node on initial load
  useEffect(() => {
    if (rootNode) {
      const expandAll: Record<string, boolean> = {};
      const traverse = (n: MerkleNode) => {
        expandAll[n.id] = true;
        if (n.left) traverse(n.left);
        if (n.right) traverse(n.right);
      };
      traverse(rootNode);
      setExpandedNodes(expandAll);

      // Select target leaf if found
      const findLeaf = (n: MerkleNode): MerkleNode | null => {
        if (n.leafData && targetLeaf && n.hash.toLowerCase() === targetLeaf.toLowerCase()) {
          return n;
        }
        if (n.left) {
          const l = findLeaf(n.left);
          if (l) return l;
        }
        if (n.right) {
          const r = findLeaf(n.right);
          if (r) return r;
        }
        return n.leafData ? n : null;
      };
      setSelectedNode(findLeaf(rootNode) || rootNode);
    }
  }, [batchMessages.length, targetLeaf]);

  // Run cryptographic verification checks whenever target message changes
  useEffect(() => {
    if (!targetMessage) return;

    const runChecks = async () => {
      // 1. Signature validity check
      const isSigOk = await verifyAssertionSignature(
        targetMessage.authorAddress,
        targetMessage.dataHash,
        targetMessage.startBlock,
        targetMessage.startBlockHash,
        targetMessage.signature
      );
      setSigValid(isSigOk);

      // 2. Off-chain Merkle proof check
      if (targetMessage.rootHash && targetMessage.merkleProof) {
        const root = tree.getRoot();
        const matchesRoot = root.toLowerCase() === targetMessage.rootHash.toLowerCase();
        setMerkleValid(matchesRoot);
      } else {
        setMerkleValid(null);
      }

      // 3. On-chain Anchor verification
      if (targetMessage.rootHash && publicClient && contractAddress) {
        try {
          const anchor = await publicClient.readContract({
            address: contractAddress,
            abi: CHRONOPROBE_ABI,
            functionName: 'anchors',
            args: [targetMessage.rootHash],
          });
          const blockNum = Number(anchor[0]);
          const ts = Number(anchor[1]);
          if (blockNum > 0) {
            setOnChainValid(true);
            setAnchorDetails({ blockNumber: blockNum, timestamp: ts });
          } else {
            setOnChainValid(false);
          }
        } catch {
          // If offline / local mock
          setOnChainValid(targetMessage.status === 'verified');
          if (targetMessage.endBlock) {
            setAnchorDetails({
              blockNumber: targetMessage.endBlock,
              timestamp: targetMessage.endTimestamp || Math.floor(Date.now() / 1000),
            });
          }
        }
      }
    };

    runChecks();
  }, [targetMessage, publicClient, contractAddress]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Render tree node recursively (File-Explorer Style)
  const renderTreeNode = (node: MerkleNode, depth: number = 0) => {
    const isLeaf = !!node.leafData;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;
    const isTarget =
      isLeaf && targetLeaf && node.hash.toLowerCase() === targetLeaf.toLowerCase();

    return (
      <div key={node.id} className="select-none text-xs font-mono">
        <div
          onClick={() => setSelectedNode(node)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#5865F2] text-white font-bold'
              : isTarget
              ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40'
              : node.isSiblingProof
              ? 'bg-[#f0b232]/15 text-[#f0b232]'
              : 'hover:bg-[#35373c] text-[#dbdee1]'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Arrow / Chevron */}
          {!isLeaf ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 hover:text-white"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5" />
          )}

          {/* Folder / File Icon */}
          {!isLeaf ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#f0b232] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#f0b232] shrink-0" />
            )
          ) : (
            <FileCode className="w-4 h-4 text-[#5865F2] shrink-0" />
          )}

          {/* Label */}
          <span className="truncate">
            {!isLeaf ? (depth === 0 ? '📁 [Merkle Root]' : `📁 Branch`) : `📄 Leaf: "${node.leafData?.content.substring(0, 15)}..."`}
          </span>

          <span className="text-[10px] opacity-70 ml-auto shrink-0 font-mono">
            {node.hash.substring(0, 8)}...
          </span>

          {node.isSiblingProof && (
            <span className="text-[9px] px-1 rounded bg-[#f0b232]/30 text-[#f0b232] font-semibold shrink-0">
              🔑 Sibling
            </span>
          )}
        </div>

        {/* Child Subtree */}
        {!isLeaf && isExpanded && (
          <div>
            {node.left && renderTreeNode(node.left, depth + 1)}
            {node.right && renderTreeNode(node.right, depth + 1)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] select-none min-w-0">
      {/* Header */}
      <div className="h-14 border-b border-[#1e293b] px-5 flex items-center justify-between bg-[#0f172a] shadow-sm">
        <div className="flex items-center gap-2.5">
          <Folder className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-100 text-sm">
            Merkle Proof & Timestamp Inspector
          </span>
        </div>
        {targetMessage && (
          <div className="text-xs text-slate-400 font-mono">
            Batch Size: {batchMessages.length} leaves
          </div>
        )}
      </div>

      {/* Two-Pane Explorer Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Hierarchical Tree Explorer */}
        <div className="w-full md:w-80 bg-[#0f172a] border-r border-[#1e293b] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tree Hierarchy
            </span>
            <span className="text-[11px] text-indigo-400 font-mono font-medium">
              Height: {tree.layers.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rootNode ? (
              renderTreeNode(rootNode)
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No Merkle tree available. Send and anchor messages in #channels first!
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Cryptographic Node Details & Verification Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b0f19]">
          {/* Verification Stepper Summary Banner */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] shadow-sm">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cryptographic Interval Proof Verification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-3 rounded-lg bg-[#1e293b]/60 border border-[#334155]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-200">1. Signature</span>
                  {sigValid === true ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  ECDSA signature recovered author address.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-lg bg-[#1e293b]/60 border border-[#334155]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-200">2. Lower Bound</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Signed with Block #{targetMessage?.startBlock}.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-lg bg-[#1e293b]/60 border border-[#334155]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-200">3. Merkle Path</span>
                  {merkleValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Leaf hashes sequentially to Root $R$.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-lg bg-[#1e293b]/60 border border-[#334155]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-200">4. Upper Bound</span>
                  {onChainValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {anchorDetails ? (
                    <div className="flex flex-col gap-0.5">
                      <span>Anchored @ Block #{anchorDetails.blockNumber}</span>
                      {targetMessage?.txHash && (
                        <a
                          href={getExplorerTxUrl(targetMessage.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <span>View on Explorer</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    'Pending on-chain transaction'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Node Details Card */}
          {selectedNode && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  {selectedNode.leafData ? (
                    <FileCode className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="font-semibold text-slate-100 text-sm">
                    {selectedNode.leafData ? 'Leaf Node Properties' : 'Branch Node Properties'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedNode.hash, 'nodeHash')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100 px-2.5 py-1 rounded-md bg-[#1e293b] border border-[#334155] cursor-pointer"
                >
                  {copied === 'nodeHash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Hash</span>
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Node Hash (keccak256):</span>
                  <div className="p-2.5 rounded-lg bg-[#1e293b] text-slate-200 break-all border border-[#334155]">
                    {selectedNode.hash}
                  </div>
                </div>

                {selectedNode.leafData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400">Author Address:</span>
                          <a
                            href={getExplorerAddressUrl(selectedNode.leafData.authorAddress)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-sans"
                          >
                            Explorer <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#1e293b] text-indigo-400 break-all border border-[#334155]">
                          {selectedNode.leafData.authorAddress} ({selectedNode.leafData.authorName})
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400">Start Reference Block (B_start):</span>
                          <a
                            href={getExplorerBlockUrl(selectedNode.leafData.startBlock)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-sans"
                          >
                            Explorer <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#1e293b] text-emerald-400 break-all border border-[#334155]">
                          Block #{selectedNode.leafData.startBlock} ({selectedNode.leafData.startBlockHash.substring(0, 12)}...)
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Message Content:</span>
                      <div className="p-2.5 rounded-lg bg-[#1e293b] text-slate-100 font-sans border border-[#334155]">
                        "{selectedNode.leafData.content}"
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">ECDSA Signature:</span>
                      <div className="p-2.5 rounded-lg bg-[#1e293b] text-slate-400 break-all border border-[#334155]">
                        {selectedNode.leafData.signature}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



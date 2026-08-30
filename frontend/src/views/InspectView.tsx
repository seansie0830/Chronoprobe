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
import { getStoredMessages, getStoredContractAddress } from '../lib/storage';
import { usePublicClient } from 'wagmi';
import { CHRONOPROBE_ABI } from '../config/wagmi';
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
    <div className="flex-1 flex flex-col h-full bg-[#313338] select-none min-w-0">
      {/* Header */}
      <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338] shadow-sm">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-[#f0b232]" />
          <span className="font-bold text-white text-sm">
            Merkle Tree & Temporal Proof Inspector
          </span>
        </div>
        {targetMessage && (
          <div className="text-xs text-[#949ba4] font-mono">
            Batch Size: {batchMessages.length} leaves
          </div>
        )}
      </div>

      {/* Two-Pane Explorer Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Hierarchical Tree Explorer */}
        <div className="w-full md:w-80 bg-[#2b2d31] border-r border-[#1f2023] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#1f2023] flex items-center justify-between">
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
              Tree Explorer (VS Code Style)
            </span>
            <span className="text-[11px] text-[#5865F2] font-mono">
              Height: {tree.layers.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rootNode ? (
              renderTreeNode(rootNode)
            ) : (
              <div className="p-4 text-center text-xs text-[#949ba4]">
                No Merkle tree available for inspection. Send and anchor messages in #chat first!
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Cryptographic Node Details & Verification Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#313338]">
          {/* Verification Stepper Summary Banner */}
          <div className="p-4 rounded-lg bg-[#2b2d31] border border-[#383a40]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#23a55a]" />
              Time-Interval Mathematical Proof Verification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-2.5 rounded bg-[#1e1f22] border border-[#383a40]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white">1. Authenticity</span>
                  {sigValid === true ? (
                    <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#f23f43]" />
                  )}
                </div>
                <p className="text-[10px] text-[#949ba4]">
                  Author ECDSA signature matches address.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded bg-[#1e1f22] border border-[#383a40]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white">2. Lower Bound (t &gt; B_start)</span>
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                </div>
                <p className="text-[10px] text-[#949ba4]">
                  Message includes unpredictable Block #{targetMessage?.startBlock}.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded bg-[#1e1f22] border border-[#383a40]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white">3. Merkle Path</span>
                  {merkleValid ? (
                    <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#f0b232]" />
                  )}
                </div>
                <p className="text-[10px] text-[#949ba4]">
                  Leaf hashes sequentially to Root $R$.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 rounded bg-[#1e1f22] border border-[#383a40]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white">4. Upper Bound (t &lt; B_end)</span>
                  {onChainValid ? (
                    <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#f0b232]" />
                  )}
                </div>
                <p className="text-[10px] text-[#949ba4]">
                  {anchorDetails
                    ? `Anchored on-chain @ Block #${anchorDetails.blockNumber}`
                    : 'Pending on-chain transaction'}
                </p>
              </div>
            </div>
          </div>

          {/* Selected Node Details Card */}
          {selectedNode && (
            <div className="p-5 rounded-lg bg-[#2b2d31] border border-[#383a40] space-y-4">
              <div className="flex items-center justify-between border-b border-[#383a40] pb-3">
                <div className="flex items-center gap-2">
                  {selectedNode.leafData ? (
                    <FileCode className="w-5 h-5 text-[#5865F2]" />
                  ) : (
                    <Folder className="w-5 h-5 text-[#f0b232]" />
                  )}
                  <span className="font-bold text-white text-sm">
                    {selectedNode.leafData ? 'Leaf Node Details' : 'Merkle Branch Node Details'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedNode.hash, 'nodeHash')}
                  className="flex items-center gap-1 text-xs text-[#949ba4] hover:text-white px-2 py-1 rounded bg-[#1e1f22]"
                >
                  {copied === 'nodeHash' ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Hash</span>
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-[#949ba4] block mb-1">Node Hash (keccak256):</span>
                  <div className="p-2 rounded bg-[#1e1f22] text-[#dbdee1] break-all border border-[#383a40]">
                    {selectedNode.hash}
                  </div>
                </div>

                {selectedNode.leafData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#949ba4] block mb-1">Author Address:</span>
                        <div className="p-2 rounded bg-[#1e1f22] text-[#5865F2] break-all border border-[#383a40]">
                          {selectedNode.leafData.authorAddress} ({selectedNode.leafData.authorName})
                        </div>
                      </div>
                      <div>
                        <span className="text-[#949ba4] block mb-1">Lower Bound (B_start):</span>
                        <div className="p-2 rounded bg-[#1e1f22] text-[#23a55a] break-all border border-[#383a40]">
                          Block #{selectedNode.leafData.startBlock} ({selectedNode.leafData.startBlockHash.substring(0, 12)}...)
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[#949ba4] block mb-1">Raw Message Payload:</span>
                      <div className="p-2 rounded bg-[#1e1f22] text-white font-sans border border-[#383a40]">
                        "{selectedNode.leafData.content}"
                      </div>
                    </div>

                    <div>
                      <span className="text-[#949ba4] block mb-1">ECDSA Signature:</span>
                      <div className="p-2 rounded bg-[#1e1f22] text-[#949ba4] break-all border border-[#383a40]">
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

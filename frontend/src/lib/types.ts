export interface Persona {
  id: string;
  name: string;
  avatar: string;
  color: string;
  privateKey: `0x${string}`;
  address: `0x${string}`;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorAddress: `0x${string}`;
  authorName: string;
  content: string;
  timestamp: number; // Client timestamp in ms

  // Lower bound temporal assertion
  startBlock: number;
  startBlockHash: `0x${string}`;
  dataHash: `0x${string}`;
  signature: `0x${string}`;
  leafHash: `0x${string}`;

  // Upper bound on-chain anchor
  status: 'pending' | 'anchoring' | 'verified';
  rootHash?: `0x${string}`;
  endBlock?: number;
  endTimestamp?: number;
  txHash?: `0x${string}`;
  merkleProof?: `0x${string}`[];
}

export interface Channel {
  id: string;
  name: string;
  topic: string;
  category: string;
}

export interface MerkleNode {
  id: string;
  hash: `0x${string}`;
  left?: MerkleNode;
  right?: MerkleNode;
  leafData?: ChatMessage;
  isSiblingProof?: boolean;
}

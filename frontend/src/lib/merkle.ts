import { keccak256, encodePacked } from 'viem';
import type { ChatMessage, MerkleNode } from './types';

// Pair-sorted OpenZeppelin compatible hashing
export function hashPair(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  if (BigInt(a) < BigInt(b)) {
    return keccak256(encodePacked(['bytes32', 'bytes32'], [a, b]));
  } else {
    return keccak256(encodePacked(['bytes32', 'bytes32'], [b, a]));
  }
}

export class MerkleTree {
  public leaves: `0x${string}`[];
  public layers: `0x${string}`[][];
  public messages: ChatMessage[];

  constructor(messages: ChatMessage[]) {
    this.messages = messages;
    this.leaves = messages.map((m) => m.leafHash);
    this.layers = [];

    if (this.leaves.length > 0) {
      this.buildTree();
    }
  }

  private buildTree() {
    let currentLayer = [...this.leaves];
    this.layers.push(currentLayer);

    while (currentLayer.length > 1) {
      const nextLayer: `0x${string}`[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
        } else {
          // If odd number of nodes, promote the last node to the next level
          nextLayer.push(currentLayer[i]);
        }
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  public getRoot(): `0x${string}` {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) {
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(leafIndex: number): `0x${string}`[] {
    const proof: `0x${string}`[] = [];
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      return proof;
    }

    let currentIndex = leafIndex;
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightChild = currentIndex % 2 === 1;
      const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  // Construct visual tree hierarchy for File Explorer view
  public toHierarchy(_targetLeafHash?: `0x${string}`, proofSet?: Set<string>): MerkleNode | null {
    if (this.layers.length === 0) return null;

    const buildNode = (layerIdx: number, indexInLayer: number): MerkleNode => {
      const hash = this.layers[layerIdx][indexInLayer];
      const isSibling = proofSet ? proofSet.has(hash.toLowerCase()) : false;

      // Base case: Leaf layer
      if (layerIdx === 0) {
        const msg = this.messages[indexInLayer];
        return {
          id: `leaf_${indexInLayer}_${hash.substring(0, 8)}`,
          hash,
          leafData: msg,
          isSiblingProof: isSibling,
        };
      }

      // Recursive case: Internal branch node
      const leftChildIdx = indexInLayer * 2;
      const rightChildIdx = indexInLayer * 2 + 1;

      const left = leftChildIdx < this.layers[layerIdx - 1].length
        ? buildNode(layerIdx - 1, leftChildIdx)
        : undefined;

      const right = rightChildIdx < this.layers[layerIdx - 1].length
        ? buildNode(layerIdx - 1, rightChildIdx)
        : undefined;

      return {
        id: `branch_${layerIdx}_${indexInLayer}_${hash.substring(0, 8)}`,
        hash,
        left,
        right,
        isSiblingProof: isSibling,
      };
    };

    const rootLayerIdx = this.layers.length - 1;
    return buildNode(rootLayerIdx, 0);
  }
}

// Verify inclusion off-chain
export function verifyMerkleProof(
  root: `0x${string}`,
  leaf: `0x${string}`,
  proof: `0x${string}`[]
): boolean {
  let computedHash = leaf;
  for (const proofElement of proof) {
    computedHash = hashPair(computedHash, proofElement);
  }
  return computedHash.toLowerCase() === root.toLowerCase();
}

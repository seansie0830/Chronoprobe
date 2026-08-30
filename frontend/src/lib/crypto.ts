import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  stringToBytes,
  hashMessage,
  recoverAddress,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import type { Persona } from './types';

// Compute the assertion hash that the user endorses with their private key
export function computeAssertionDigest(
  author: `0x${string}`,
  dataHash: `0x${string}`,
  startBlock: number,
  startBlockHash: `0x${string}`
): `0x${string}` {
  const typeHash = keccak256(
    stringToBytes('ChronoprobeAssertion(address author,bytes32 dataHash,uint256 startBlock,bytes32 startBlockHash)')
  );

  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32, uint256, bytes32'),
    [typeHash, author, dataHash, BigInt(startBlock), startBlockHash]
  );

  const structHash = keccak256(encoded);
  return hashMessage({ raw: structHash });
}

// Compute the Merkle leaf for a signed assertion
export function computeLeaf(
  author: `0x${string}`,
  dataHash: `0x${string}`,
  startBlock: number,
  startBlockHash: `0x${string}`,
  signature: `0x${string}`
): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters('address, bytes32, uint256, bytes32, bytes'),
    [author, dataHash, BigInt(startBlock), startBlockHash, signature]
  );
  return keccak256(encoded);
}

// Sign a message assertion using a persona's private key
export async function signAssertion(
  persona: Persona,
  content: string,
  startBlock: number,
  startBlockHash: `0x${string}`
): Promise<{
  dataHash: `0x${string}`;
  signature: `0x${string}`;
  leafHash: `0x${string}`;
}> {
  const dataHash = keccak256(stringToBytes(content));
  const account = privateKeyToAccount(persona.privateKey);

  const typeHash = keccak256(
    stringToBytes('ChronoprobeAssertion(address author,bytes32 dataHash,uint256 startBlock,bytes32 startBlockHash)')
  );

  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32, uint256, bytes32'),
    [typeHash, persona.address, dataHash, BigInt(startBlock), startBlockHash]
  );
  const structHash = keccak256(encoded);

  const signature = await account.signMessage({
    message: { raw: structHash },
  });

  const leafHash = computeLeaf(
    persona.address,
    dataHash,
    startBlock,
    startBlockHash,
    signature
  );

  return {
    dataHash,
    signature,
    leafHash,
  };
}

// Verify a signature off-chain
export async function verifyAssertionSignature(
  author: `0x${string}`,
  dataHash: `0x${string}`,
  startBlock: number,
  startBlockHash: `0x${string}`,
  signature: `0x${string}`
): Promise<boolean> {
  try {
    const typeHash = keccak256(
      stringToBytes('ChronoprobeAssertion(address author,bytes32 dataHash,uint256 startBlock,bytes32 startBlockHash)')
    );

    const encoded = encodeAbiParameters(
      parseAbiParameters('bytes32, address, bytes32, uint256, bytes32'),
      [typeHash, author, dataHash, BigInt(startBlock), startBlockHash]
    );
    const structHash = keccak256(encoded);

    const recovered = await recoverAddress({
      hash: hashMessage({ raw: structHash }),
      signature,
    });

    return recovered.toLowerCase() === author.toLowerCase();
  } catch {
    return false;
  }
}

// Generate a fresh random persona
export function createRandomPersona(name: string, color: string, avatar: string): Persona {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name,
    avatar,
    color,
    privateKey,
    address: account.address,
  };
}

// Generate persona from custom seed/hex string
export function createPersonaFromSeed(name: string, seed: string, color: string, avatar: string): Persona {
  const seedHash = keccak256(stringToBytes(seed));
  const account = privateKeyToAccount(seedHash);

  return {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name,
    avatar,
    color,
    privateKey: seedHash,
    address: account.address,
  };
}

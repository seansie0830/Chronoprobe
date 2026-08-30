import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Localnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [anvil, sepolia, baseSepolia, arbitrumSepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
  ],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
});


export const CHRONOPROBE_ABI = [
  {
    type: 'function',
    name: 'commitRoot',
    inputs: [{ name: 'root', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'blockNumber', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isAnchored',
    inputs: [{ name: 'root', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRootCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'anchors',
    inputs: [{ name: 'root', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'blockNumber', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'publisher', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'verifyProof',
    inputs: [
      { name: 'root', type: 'bytes32', internalType: 'bytes32' },
      { name: 'leaf', type: 'bytes32', internalType: 'bytes32' },
      { name: 'proof', type: 'bytes32[]', internalType: 'bytes32[]' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'verifyIntervalProof',
    inputs: [
      { name: 'root', type: 'bytes32', internalType: 'bytes32' },
      {
        name: 'input',
        type: 'tuple',
        internalType: 'struct Chronoprobe.AssertionInput',
        components: [
          { name: 'author', type: 'address', internalType: 'address' },
          { name: 'dataHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'startBlock', type: 'uint256', internalType: 'uint256' },
          { name: 'startBlockHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'proof', type: 'bytes32[]', internalType: 'bytes32[]' },
    ],
    outputs: [
      { name: 'valid', type: 'bool', internalType: 'bool' },
      { name: 'endBlock', type: 'uint256', internalType: 'uint256' },
      { name: 'endTimestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'publisher', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RootCommitted',
    inputs: [
      { name: 'root', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'blockNumber', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'publisher', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
] as const;

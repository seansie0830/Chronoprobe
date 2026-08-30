import type { Persona, ChatMessage, Channel } from './types';
import { createRandomPersona } from './crypto';

const CHANNELS_KEY = 'chronoprobe_channels';
const MESSAGES_KEY = 'chronoprobe_messages';
const PERSONAS_KEY = 'chronoprobe_personas';
const ACTIVE_PERSONA_KEY = 'chronoprobe_active_persona';
const CONTRACT_ADDRESS_KEY = 'chronoprobe_contract_address';

export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'general', name: 'general', topic: 'Decentralized time-interval proof chat', category: 'TEXT CHANNELS' },
  { id: 'announcements', name: 'announcements', topic: 'Chronoprobe protocol updates', category: 'INFORMATION' },
  { id: 'alpha-leaks', name: 'alpha-leaks', topic: 'Cryptographic assertions & proofs', category: 'TEXT CHANNELS' },
];

export function getStoredChannels(): Channel[] {
  try {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (!raw) {
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(DEFAULT_CHANNELS));
      return DEFAULT_CHANNELS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CHANNELS;
  }
}

export function saveChannels(channels: Channel[]) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

export function getStoredPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    if (!raw) {
      // Seed default fresh random sandbox personas (Alice, Bob, Charlie)
      const alice = createRandomPersona('Alice', '#5865F2', '🦊');
      const bob = createRandomPersona('Bob', '#57F287', '🐼');
      const charlie = createRandomPersona('Charlie', '#FEE75C', '🦉');
      const initial = [alice, bob, charlie];
      localStorage.setItem(PERSONAS_KEY, JSON.stringify(initial));
      localStorage.setItem(ACTIVE_PERSONA_KEY, alice.id);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePersonas(personas: Persona[]) {
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
}

export function getActivePersonaId(): string {
  const stored = localStorage.getItem(ACTIVE_PERSONA_KEY);
  if (stored) return stored;
  const personas = getStoredPersonas();
  return personas[0]?.id || '';
}

export function setActivePersonaId(id: string) {
  localStorage.setItem(ACTIVE_PERSONA_KEY, id);
}

export function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getStoredContractAddress(): `0x${string}` {
  const raw = localStorage.getItem(CONTRACT_ADDRESS_KEY);
  if (raw && raw.startsWith('0x')) return raw as `0x${string}`;
  // Deployed Chronoprobe contract on local Anvil (31337)
  return '0x32eF4AE9653C52Dd16DC9e5A34F956007C6A5f61';
}

export function saveContractAddress(address: `0x${string}`) {
  localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
}


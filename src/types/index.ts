export type RulesetType = 'dnd5e' | 'gurps' | 'custom';
export type GameMode = 'multiplayer' | 'ai_master';
export type GridType = 'square' | 'hex';

export interface Channel {
  id: string;
  name: string;
  type: 'scene' | 'dice' | 'ooc' | 'gm_notes';
  isPrivateGM?: boolean;
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  height: number; // Elevation height of the wall (e.g., 2m, blocks sight for tokens at or below this height)
  blocksSight: boolean;
  blocksMovement: boolean;
}

export interface ElevationZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number; // e.g. +3m, +6m, -2m (pit)
  color: string;
}

export interface MapToken {
  id: string;
  characterId: string;
  name: string;
  avatar: string;
  x: number; // grid coordinates
  y: number;
  elevation: number; // current height / Z-level in meters or feet
  size: number; // 1 = 1x1 cell
  sightRadius: number; // in grid units
  isHidden?: boolean;
  color?: string;
  statusConditions: string[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  backgroundUrl?: string;
  gridType: GridType;
  gridSize: number; // pixels per cell, e.g. 50
  width: number; // in grid cells
  height: number; // in grid cells
  walls: WallSegment[];
  elevationZones: ElevationZone[];
  tokens: MapToken[];
  fogOfWarEnabled: boolean;
}

export interface DiceRollResult {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  isCritSuccess?: boolean;
  isCritFailure?: boolean;
  target?: number;
  margin?: number; // for GURPS or contested tests
  breakdown: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: 'speech' | 'action' | 'roll' | 'narration' | 'ooc' | 'gm_notes' | 'system';
  content: string;
  roll?: DiceRollResult;
  isAI?: boolean;
  isGM?: boolean;
  timestamp: number;
}

export interface LoreEntity {
  id: string;
  name: string;
  category: 'npc' | 'location' | 'faction' | 'item' | 'event' | 'secret';
  description: string;
  tags: string[];
  attributes?: Record<string, any>;
  lastUpdated: string;
  knownByPlayers: boolean;
}

export interface Dnd5eData {
  class: string;
  level: number;
  race: string;
  alignment: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  ac: number;
  speed: number;
  proficiencyBonus: number;
  skills: Record<string, { proficient: boolean; bonus: number }>;
  inventory: Array<{ name: string; qty: number; weight: number; desc: string }>;
  features: string[];
}

export interface GurpsData {
  pointTotal: number;
  st: number;
  dx: number;
  iq: number;
  ht: number;
  hp: number;
  fp: number;
  basicSpeed: number;
  basicMove: number;
  thrustDmg: string;
  swingDmg: string;
  dodge: number;
  parry: number;
  block: number;
  advantages: string[];
  disadvantages: string[];
  skills: Array<{ name: string; level: number; relLevel: string }>;
  equipment: Array<{ name: string; weight: number; cost: number }>;
}

export interface CharacterSheet {
  id: string;
  name: string;
  avatar: string;
  isNPC: boolean;
  isGM: boolean;
  ruleset: RulesetType;
  hp: number;
  maxHp: number;
  energy: number; // MP or FP
  maxEnergy: number;
  defense: number; // AC or Dodge
  elevation: number;
  currentSceneId: string;
  conditions: string[];
  bio: string;
  notes: string;
  dnd?: Dnd5eData;
  gurps?: GurpsData;
  custom?: Record<string, any>;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  icon: string;
  banner?: string;
  ruleset: RulesetType;
  gameMode: GameMode;
  hostName: string;
  isHost: boolean;
  channels: Channel[];
  scenes: Scene[];
  activeSceneId: string;
  activeChannelId: string;
  characters: CharacterSheet[];
  activeCharacterId?: string;
  loreEntities: LoreEntity[];
  gmSecretNotes: string;
  aiSettings: {
    model: string;
    temperature: number;
    systemPrompt: string;
    autoLogEntities: boolean;
  };
}

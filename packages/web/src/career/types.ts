import { TableRules } from '@beat-the-heat/shared'

// ─── Dialogue System ─────────────────────────────────────────────────────────

export interface DialogueLine {
  speaker: string          // Character name or 'NARRATOR'
  text: string
  portrait?: string        // Optional character portrait key
}

export interface DialogueSequence {
  id: string
  lines: DialogueLine[]
  trigger: 'level-start' | 'level-complete' | 'level-fail' | 'shop-unlock' | 'custom'
}

// ─── Level System ────────────────────────────────────────────────────────────

export interface LevelGoal {
  type: 'chips' | 'hands-played' | 'hands-won' | 'streak' | 'accuracy'
  target: number
  description: string
}

export interface LevelReward {
  type: 'chips' | 'shop-unlock' | 'item'
  amount?: number
  itemId?: string
}

export interface Level {
  id: string
  name: string
  description: string
  unlockRequirement: number   // Total chips earned to unlock (0 = always available)
  startingChips: number
  goal: LevelGoal
  minimumAccuracy?: number    // Optional: minimum accuracy % required (0-100)
  tableRules: Partial<TableRules>  // Overrides for this level's table
  introDialogue: DialogueSequence
  completeDialogue: DialogueSequence
  failDialogue?: DialogueSequence
  rewards: LevelReward[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

// ─── Shop System ─────────────────────────────────────────────────────────────

export type ShopItemCategory = 'counting' | 'betting' | 'disguise' | 'intel'

export interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  category: ShopItemCategory
  unlockLevel?: string       // Level ID required to see this item
  effect: ShopItemEffect
  maxPurchases: number       // How many times can be bought (1 = one-time purchase)
  icon: string               // Emoji or icon key
}

export type ShopItemEffect =
  | { type: 'hint-frequency'; value: number }      // % chance to show count hint
  | { type: 'starting-chips-bonus'; value: number } // Extra starting chips per level
  | { type: 'heat-reduction'; value: number }       // Reduce casino heat gain
  | { type: 'bet-spread-bonus'; value: number }     // Increase max bet multiplier
  | { type: 'accuracy-bonus'; value: number }       // Forgiveness on close calls
  | { type: 'passive'; description: string }        // Flavor/cosmetic effects

// ─── Training Tracking ───────────────────────────────────────────────────────

export interface MistakeRecord {
  situation: string        // e.g., "16 vs 10", "A,7 vs 9", "8,8 vs A"
  playerAction: string
  correctAction: string
  count: number
}

export interface LevelStats {
  handsPlayed: number
  handsWon: number
  totalDecisions: number
  correctDecisions: number
  mistakes: Record<string, MistakeRecord>  // keyed by situation
}

// ─── Career Progress ─────────────────────────────────────────────────────────

export interface LevelProgress {
  levelId: string
  status: 'locked' | 'available' | 'in-progress' | 'completed'
  bestChips: number          // Highest chip count achieved
  attempts: number
  completedAt?: number       // Timestamp
}

export interface CareerState {
  totalChipsEarned: number   // Lifetime earnings (for unlocks)
  currentChips: number       // Spendable chips (for shop)
  currentLevelId: string | null
  levelProgress: Record<string, LevelProgress>
  purchasedItems: Record<string, number>  // itemId -> purchase count
  unlockedItems: string[]    // Item IDs visible in shop
  activeDialogue: DialogueSequence | null
  dialogueIndex: number      // Current line in active dialogue
  currentLevelStats: LevelStats | null  // Stats for current level attempt
}

// ─── Career Actions ──────────────────────────────────────────────────────────

export type CareerAction =
  | { type: 'START_LEVEL'; levelId: string }
  | { type: 'UPDATE_CHIPS'; chips: number }
  | { type: 'RECORD_HAND'; won: boolean }
  | { type: 'RECORD_DECISION'; situation: string; playerAction: string; correctAction: string; isCorrect: boolean }
  | { type: 'COMPLETE_LEVEL'; finalChips: number }
  | { type: 'FAIL_LEVEL' }
  | { type: 'EXIT_LEVEL' }
  | { type: 'PURCHASE_ITEM'; itemId: string }
  | { type: 'START_DIALOGUE'; dialogue: DialogueSequence }
  | { type: 'ADVANCE_DIALOGUE' }
  | { type: 'END_DIALOGUE' }
  | { type: 'RESET_CAREER' }
  | { type: 'ADVANCE_DIALOGUE' }
  | { type: 'END_DIALOGUE' }
  | { type: 'RESET_CAREER' }

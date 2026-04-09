import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { CareerState, CareerAction, DialogueSequence, LevelStats } from './types'
import { getLevelById, LEVELS, generateTrainingFeedback } from './levels'
import { getShopItemById, getTotalEffect } from './shop'

// ─── Initial State ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'beat-the-heat-career'

function getInitialState(): CareerState {
  // Default initial state
  const levelProgress: Record<string, { levelId: string; status: 'locked' | 'available'; bestChips: number; attempts: number }> = {}
  for (const level of LEVELS) {
    levelProgress[level.id] = {
      levelId: level.id,
      status: level.unlockRequirement === 0 ? 'available' : 'locked',
      bestChips: 0,
      attempts: 0,
    }
  }

  const defaultState: CareerState = {
    totalChipsEarned: 0,
    currentChips: 0,
    currentLevelId: null,
    levelProgress,
    purchasedItems: {},
    unlockedItems: [],
    activeDialogue: null,
    dialogueIndex: 0,
    currentLevelStats: null,
  }

  // Try to load from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CareerState>
      
      // Merge saved state with defaults (in case new fields were added)
      // Also rebuild levelProgress to include any new levels
      const mergedLevelProgress = { ...levelProgress }
      if (parsed.levelProgress) {
        for (const [id, progress] of Object.entries(parsed.levelProgress)) {
          // Only keep progress for levels that still exist
          if (mergedLevelProgress[id]) {
            mergedLevelProgress[id] = { ...mergedLevelProgress[id], ...progress }
          }
        }
      }
      
      return {
        ...defaultState,
        ...parsed,
        levelProgress: mergedLevelProgress,
        currentLevelStats: parsed.currentLevelStats ?? null,
      }
    }
  } catch {
    // Ignore parse errors, use default state
  }

  return defaultState
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function careerReducer(state: CareerState, action: CareerAction): CareerState {
  switch (action.type) {
    case 'START_LEVEL': {
      const level = getLevelById(action.levelId)
      if (!level) return state

      // Calculate starting chips with bonuses
      const startingBonus = getTotalEffect('starting-chips-bonus', state.purchasedItems)
      const startingChips = level.startingChips + startingBonus

      const newProgress = { ...state.levelProgress }
      newProgress[action.levelId] = {
        ...newProgress[action.levelId],
        status: 'in-progress',
        attempts: (newProgress[action.levelId]?.attempts || 0) + 1,
      }

      return {
        ...state,
        currentLevelId: action.levelId,
        levelProgress: newProgress,
        activeDialogue: level.introDialogue,
        dialogueIndex: 0,
        currentLevelStats: {
          handsPlayed: 0,
          handsWon: 0,
          totalDecisions: 0,
          correctDecisions: 0,
          mistakes: {},
        },
      }
    }

    case 'UPDATE_CHIPS': {
      return {
        ...state,
        currentChips: action.chips,
      }
    }

    case 'RECORD_HAND': {
      if (!state.currentLevelStats) return state
      return {
        ...state,
        currentLevelStats: {
          ...state.currentLevelStats,
          handsPlayed: state.currentLevelStats.handsPlayed + 1,
          handsWon: state.currentLevelStats.handsWon + (action.won ? 1 : 0),
        },
      }
    }

    case 'RECORD_DECISION': {
      if (!state.currentLevelStats) return state
      
      const newStats = { ...state.currentLevelStats }
      newStats.totalDecisions++
      
      if (action.isCorrect) {
        newStats.correctDecisions++
      } else {
        // Track the mistake
        const key = action.situation
        const existing = newStats.mistakes[key]
        if (existing) {
          newStats.mistakes = {
            ...newStats.mistakes,
            [key]: { ...existing, count: existing.count + 1 },
          }
        } else {
          newStats.mistakes = {
            ...newStats.mistakes,
            [key]: {
              situation: action.situation,
              playerAction: action.playerAction,
              correctAction: action.correctAction,
              count: 1,
            },
          }
        }
      }
      
      return {
        ...state,
        currentLevelStats: newStats,
      }
    }

    case 'COMPLETE_LEVEL': {
      const level = getLevelById(state.currentLevelId || '')
      if (!level) return state

      const chipsEarned = action.finalChips - level.startingChips
      const newTotalEarned = state.totalChipsEarned + Math.max(0, chipsEarned)

      // Add rewards
      let rewardChips = 0
      const newUnlockedItems = [...state.unlockedItems]
      for (const reward of level.rewards) {
        if (reward.type === 'chips' && reward.amount) {
          rewardChips += reward.amount
        } else if (reward.type === 'shop-unlock' && reward.itemId) {
          if (!newUnlockedItems.includes(reward.itemId)) {
            newUnlockedItems.push(reward.itemId)
          }
        }
      }

      const newCurrentChips = state.currentChips + action.finalChips + rewardChips

      // Update level progress
      const newProgress = { ...state.levelProgress }
      newProgress[level.id] = {
        ...newProgress[level.id],
        status: 'completed',
        bestChips: Math.max(newProgress[level.id]?.bestChips || 0, action.finalChips),
        completedAt: Date.now(),
      }

      // Unlock new levels based on total earned
      for (const lvl of LEVELS) {
        if (
          lvl.unlockRequirement <= newTotalEarned &&
          newProgress[lvl.id]?.status === 'locked'
        ) {
          newProgress[lvl.id] = {
            ...newProgress[lvl.id],
            status: 'available',
          }
        }
      }

      // Generate dynamic feedback if we have stats (for training levels)
      const completionDialogue = state.currentLevelStats 
        ? generateTrainingFeedback(state.currentLevelStats, true, level.minimumAccuracy)
        : level.completeDialogue

      return {
        ...state,
        currentLevelId: null,
        totalChipsEarned: newTotalEarned,
        currentChips: newCurrentChips,
        levelProgress: newProgress,
        unlockedItems: newUnlockedItems,
        activeDialogue: completionDialogue,
        dialogueIndex: 0,
        currentLevelStats: null,
      }
    }

    case 'FAIL_LEVEL': {
      const level = getLevelById(state.currentLevelId || '')
      if (!level) return state

      const newProgress = { ...state.levelProgress }
      newProgress[level.id] = {
        ...newProgress[level.id],
        status: 'available', // Can retry
      }

      // Generate dynamic feedback if we have stats (for training levels with accuracy requirements)
      const failDialogue = state.currentLevelStats && level.minimumAccuracy
        ? generateTrainingFeedback(state.currentLevelStats, false, level.minimumAccuracy)
        : level.failDialogue || null

      return {
        ...state,
        currentLevelId: null,
        levelProgress: newProgress,
        activeDialogue: failDialogue,
        dialogueIndex: 0,
        currentLevelStats: null,
      }
    }

    case 'EXIT_LEVEL': {
      const level = getLevelById(state.currentLevelId || '')
      if (!level) return state

      const newProgress = { ...state.levelProgress }
      newProgress[level.id] = {
        ...newProgress[level.id],
        status: 'available',
      }

      return {
        ...state,
        currentLevelId: null,
        levelProgress: newProgress,
        activeDialogue: null,
        dialogueIndex: 0,
        currentLevelStats: null,
      }
    }

    case 'PURCHASE_ITEM': {
      const item = getShopItemById(action.itemId)
      if (!item) return state

      const currentCount = state.purchasedItems[action.itemId] || 0
      if (currentCount >= item.maxPurchases) return state
      if (state.currentChips < item.cost) return state

      return {
        ...state,
        currentChips: state.currentChips - item.cost,
        purchasedItems: {
          ...state.purchasedItems,
          [action.itemId]: currentCount + 1,
        },
      }
    }

    case 'START_DIALOGUE': {
      return {
        ...state,
        activeDialogue: action.dialogue,
        dialogueIndex: 0,
      }
    }

    case 'ADVANCE_DIALOGUE': {
      if (!state.activeDialogue) return state
      const nextIndex = state.dialogueIndex + 1
      if (nextIndex >= state.activeDialogue.lines.length) {
        return {
          ...state,
          activeDialogue: null,
          dialogueIndex: 0,
        }
      }
      return {
        ...state,
        dialogueIndex: nextIndex,
      }
    }

    case 'END_DIALOGUE': {
      return {
        ...state,
        activeDialogue: null,
        dialogueIndex: 0,
      }
    }

    case 'RESET_CAREER': {
      localStorage.removeItem(STORAGE_KEY)
      return getInitialState()
    }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface CareerContextValue {
  state: CareerState
  dispatch: React.Dispatch<CareerAction>
  startLevel: (levelId: string) => void
  completeLevel: (finalChips: number) => void
  failLevel: () => void
  exitLevel: () => void
  recordHand: (won: boolean) => void
  recordDecision: (situation: string, playerAction: string, correctAction: string, isCorrect: boolean) => void
  purchaseItem: (itemId: string) => boolean
  advanceDialogue: () => void
  skipDialogue: () => void
}

const CareerContext = createContext<CareerContextValue | null>(null)

export function CareerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(careerReducer, null, getInitialState)

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }, [state])

  const startLevel = (levelId: string) => {
    dispatch({ type: 'START_LEVEL', levelId })
  }

  const completeLevel = (finalChips: number) => {
    dispatch({ type: 'COMPLETE_LEVEL', finalChips })
  }

  const failLevel = () => {
    dispatch({ type: 'FAIL_LEVEL' })
  }

  const exitLevel = () => {
    dispatch({ type: 'EXIT_LEVEL' })
  }

  const recordHand = (won: boolean) => {
    dispatch({ type: 'RECORD_HAND', won })
  }

  const recordDecision = (situation: string, playerAction: string, correctAction: string, isCorrect: boolean) => {
    dispatch({ type: 'RECORD_DECISION', situation, playerAction, correctAction, isCorrect })
  }

  const purchaseItem = (itemId: string): boolean => {
    const item = getShopItemById(itemId)
    if (!item) return false
    const currentCount = state.purchasedItems[itemId] || 0
    if (currentCount >= item.maxPurchases) return false
    if (state.currentChips < item.cost) return false
    dispatch({ type: 'PURCHASE_ITEM', itemId })
    return true
  }

  const advanceDialogue = () => {
    dispatch({ type: 'ADVANCE_DIALOGUE' })
  }

  const skipDialogue = () => {
    dispatch({ type: 'END_DIALOGUE' })
  }

  return (
    <CareerContext.Provider
      value={{
        state,
        dispatch,
        startLevel,
        completeLevel,
        failLevel,
        exitLevel,
        recordHand,
        recordDecision,
        purchaseItem,
        advanceDialogue,
        skipDialogue,
      }}
    >
      {children}
    </CareerContext.Provider>
  )
}

export function useCareer() {
  const ctx = useContext(CareerContext)
  if (!ctx) throw new Error('useCareer must be used within CareerProvider')
  return ctx
}

import { Level, DialogueSequence, DialogueLine, LevelStats, MistakeRecord } from './types'

/**
 * Career Mode Levels
 * 
 * Add new levels to this array. They will automatically:
 * - Appear in level select when unlocked (based on unlockRequirement)
 * - Have their dialogue sequences triggered at appropriate times
 * - Apply their tableRules during gameplay
 * 
 * Levels are ordered by unlockRequirement (lowest first).
 */
export const LEVELS: Level[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1: Training
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'level-1-training',
    name: 'Training',
    description: 'Learn the basics from a mysterious mentor.',
    unlockRequirement: 0,
    startingChips: 1000,  // Doesn't matter for hands-played goal
    goal: {
      type: 'hands-played',
      target: 50,
      description: 'Complete 50 hands with 85%+ accuracy',
    },
    minimumAccuracy: 85,
    tableRules: {
      decks: 2,
      dealerHitsSoft17: false,  // S17
      doubleAfterSplit: true,
      surrenderAllowed: true,
      blackjackPayout: '3:2',
      cutCardPenetration: 0.90,  // 0.10 decks behind = 90% penetration
      minBet: 0,
      maxBet: 100,
    },
    introDialogue: {
      id: 'level-1-intro',
      trigger: 'level-start',
      lines: [
        {
          speaker: 'PIT BOSS',
          text: "Hey! You! Get out of my casino. Now.",
          portrait: 'pit-boss',
        },
        {
          speaker: 'PIT BOSS',
          text: "I know your face. You're blacklisted in every joint on the Strip.",
          portrait: 'pit-boss',
        },
        {
          speaker: 'NARRATOR',
          text: "You step outside into the neon-lit night. The door slams behind you.",
        },
        {
          speaker: 'NARRATOR',
          text: "A figure emerges from the shadows.",
        },
        {
          speaker: '???',
          text: "Rough night?",
          portrait: 'mentor',
        },
        {
          speaker: '???',
          text: "I've been watching you. You've got potential, but you're sloppy.",
          portrait: 'mentor',
        },
        {
          speaker: '???',
          text: "Tell me... do you want to learn how to Beat the Heat?",
          portrait: 'mentor',
        },
        {
          speaker: 'NARRATOR',
          text: "You nod.",
        },
        {
          speaker: '???',
          text: "Good. Then your training begins now.",
          portrait: 'mentor',
        },
        {
          speaker: '???',
          text: "I've got a private table set up. Double deck, good rules, deep penetration.",
          portrait: 'mentor',
        },
        {
          speaker: '???',
          text: "Play 50 hands. I'll be watching every decision you make.",
          portrait: 'mentor',
        },
      ],
    },
    // Note: completeDialogue is generated dynamically based on performance
    completeDialogue: {
      id: 'level-1-complete',
      trigger: 'level-complete',
      lines: [
        {
          speaker: '???',
          text: "Training complete. Let me tell you what I observed...",
          portrait: 'mentor',
        },
      ],
    },
    failDialogue: {
      id: 'level-1-fail',
      trigger: 'level-fail',
      lines: [
        {
          speaker: '???',
          text: "You need more practice before we move forward.",
          portrait: 'mentor',
        },
      ],
    },
    rewards: [
      { type: 'chips', amount: 100 },
    ],
    difficulty: 'beginner',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2: (Template for future levels)
  // ═══════════════════════════════════════════════════════════════════════════
  // {
  //   id: 'level-2-back-alley',
  //   name: 'Back Alley',
  //   description: 'A slightly bigger game with tougher rules.',
  //   unlockRequirement: 2000,
  //   startingChips: 1500,
  //   goal: {
  //     type: 'chips',
  //     target: 4000,
  //     description: 'Reach 4,000 chips',
  //   },
  //   tableRules: {
  //     decks: 6,
  //     dealerHitsSoft17: true,  // H17 - harder
  //     doubleAfterSplit: true,
  //     surrenderAllowed: false, // No surrender
  //     blackjackPayout: '3:2',
  //     minBet: 25,
  //     maxBet: 200,
  //   },
  //   introDialogue: { ... },
  //   completeDialogue: { ... },
  //   rewards: [...],
  //   difficulty: 'intermediate',
  // },
]

/**
 * Get a level by ID
 */
export function getLevelById(id: string): Level | undefined {
  return LEVELS.find(level => level.id === id)
}

/**
 * Get all levels available at a given total chips earned
 */
export function getAvailableLevels(totalChipsEarned: number): Level[] {
  return LEVELS.filter(level => level.unlockRequirement <= totalChipsEarned)
}

/**
 * Get the next locked level (for progress display)
 */
export function getNextLockedLevel(totalChipsEarned: number): Level | undefined {
  return LEVELS.find(level => level.unlockRequirement > totalChipsEarned)
}

/**
 * Generate dynamic completion dialogue based on training performance
 * @param stats - The level stats from the training session
 * @param passed - Whether the player met the accuracy requirement
 * @param requiredAccuracy - The minimum accuracy required (if any)
 */
export function generateTrainingFeedback(stats: LevelStats, passed: boolean, requiredAccuracy?: number): DialogueSequence {
  const lines: DialogueLine[] = []
  const accuracy = stats.totalDecisions > 0 
    ? Math.round((stats.correctDecisions / stats.totalDecisions) * 100) 
    : 0

  // Opening line differs based on pass/fail
  if (passed) {
    lines.push({
      speaker: '???',
      text: "Training complete. Let me tell you what I observed...",
      portrait: 'mentor',
    })
  } else {
    lines.push({
      speaker: '???',
      text: `${accuracy}% accuracy. That's not going to cut it.`,
      portrait: 'mentor',
    })
    if (requiredAccuracy) {
      lines.push({
        speaker: '???',
        text: `You need at least ${requiredAccuracy}% to move forward.`,
        portrait: 'mentor',
      })
    }
  }

  // Accuracy-based feedback (only for passed, since fail already mentions accuracy)
  if (passed) {
    if (accuracy >= 95) {
      lines.push({
        speaker: '???',
        text: `${accuracy}% accuracy. Impressive. You clearly know your basic strategy.`,
        portrait: 'mentor',
      })
      lines.push({
        speaker: '???',
        text: "The casinos won't know what hit them.",
        portrait: 'mentor',
      })
    } else if (accuracy >= 85) {
      lines.push({
        speaker: '???',
        text: `${accuracy}% accuracy. Good, but not perfect.`,
        portrait: 'mentor',
      })
      lines.push({
        speaker: '???',
        text: "In this game, those few mistakes will cost you in the long run.",
        portrait: 'mentor',
      })
    }
  }

  // Find repeated mistakes (2+ times)
  const repeatedMistakes = Object.values(stats.mistakes)
    .filter(m => m.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)  // Top 3 most frequent mistakes

  if (repeatedMistakes.length > 0) {
    lines.push({
      speaker: '???',
      text: "I noticed some patterns in your mistakes...",
      portrait: 'mentor',
    })

    for (const mistake of repeatedMistakes) {
      lines.push({
        speaker: '???',
        text: `${mistake.situation}: You chose to ${mistake.playerAction} ${mistake.count} times. The correct play is ${mistake.correctAction}.`,
        portrait: 'mentor',
      })
    }

    lines.push({
      speaker: '???',
      text: "Memorize these situations. They will come up again.",
      portrait: 'mentor',
    })
  } else if (accuracy < 100) {
    lines.push({
      speaker: '???',
      text: "Your mistakes were scattered. No obvious patterns, which is good.",
      portrait: 'mentor',
    })
  }

  // Closing
  if (passed) {
    if (accuracy >= 95) {
      lines.push({
        speaker: '???',
        text: "You're ready for the real thing. But remember...",
        portrait: 'mentor',
      })
      lines.push({
        speaker: '???',
        text: "Perfect basic strategy is just the foundation. The real edge comes from counting.",
        portrait: 'mentor',
      })
    } else {
      lines.push({
        speaker: '???',
        text: "You passed, but there's still room for improvement.",
        portrait: 'mentor',
      })
      lines.push({
        speaker: '???',
        text: "The casinos won't wait for you to sharpen your skills.",
        portrait: 'mentor',
      })
    }
  } else {
    lines.push({
      speaker: '???',
      text: "You're not ready yet. Fix those mistakes and try again.",
      portrait: 'mentor',
    })
  }

  return {
    id: 'training-feedback',
    trigger: passed ? 'level-complete' : 'level-fail',
    lines,
  }
}

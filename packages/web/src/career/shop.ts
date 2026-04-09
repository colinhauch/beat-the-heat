import { ShopItem } from './types'

/**
 * Shop Items
 * 
 * Add new shop items to this array. They will automatically:
 * - Appear in the shop when unlocked (based on unlockLevel)
 * - Apply their effects during gameplay
 * - Track purchase counts against maxPurchases
 * 
 * Categories:
 * - counting: Helps with card counting
 * - betting: Improves betting efficiency  
 * - disguise: Reduces heat/suspicion
 * - intel: Information advantages
 */
export const SHOP_ITEMS: ShopItem[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // COUNTING AIDS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'count-hint-basic',
    name: 'Pocket Tally Counter',
    description: 'Occasionally shows running count hints during play.',
    cost: 500,
    category: 'counting',
    effect: { type: 'hint-frequency', value: 0.15 }, // 15% chance
    maxPurchases: 1,
    icon: '🔢',
  },
  {
    id: 'count-hint-advanced',
    name: 'Counting Earpiece',
    description: 'A partner in the crowd feeds you count info more frequently.',
    cost: 2000,
    category: 'counting',
    unlockLevel: 'level-2-back-alley',
    effect: { type: 'hint-frequency', value: 0.35 }, // 35% chance
    maxPurchases: 1,
    icon: '🎧',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BETTING IMPROVEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bet-spread-1',
    name: 'High Roller Reputation',
    description: 'Casinos let you bet slightly higher without suspicion.',
    cost: 750,
    category: 'betting',
    effect: { type: 'bet-spread-bonus', value: 1.25 }, // 25% higher max
    maxPurchases: 1,
    icon: '💎',
  },
  {
    id: 'starting-bonus-1',
    name: 'Rainy Day Fund',
    description: 'Start each level with extra chips.',
    cost: 1000,
    category: 'betting',
    effect: { type: 'starting-chips-bonus', value: 200 },
    maxPurchases: 3, // Can buy multiple times
    icon: '💰',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DISGUISES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'basic-disguise',
    name: 'Baseball Cap & Sunglasses',
    description: 'A simple disguise. Casinos are slower to recognize you.',
    cost: 300,
    category: 'disguise',
    unlockLevel: 'level-1-training', // Unlocked after completing level 1
    effect: { type: 'heat-reduction', value: 0.1 }, // 10% less heat
    maxPurchases: 1,
    icon: '🧢',
  },
  {
    id: 'pro-disguise',
    name: 'Full Makeover Kit',
    description: 'Prosthetics, wigs, the works. Much harder to identify.',
    cost: 1500,
    category: 'disguise',
    unlockLevel: 'level-2-back-alley',
    effect: { type: 'heat-reduction', value: 0.25 }, // 25% less heat
    maxPurchases: 1,
    icon: '🎭',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dealer-tells',
    name: 'Dealer Tell Guide',
    description: 'Study common dealer habits. Slightly more forgiving on close calls.',
    cost: 400,
    category: 'intel',
    effect: { type: 'accuracy-bonus', value: 0.05 }, // 5% forgiveness
    maxPurchases: 1,
    icon: '📖',
  },
]

/**
 * Get a shop item by ID
 */
export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.id === id)
}

/**
 * Get all items available to purchase given unlocked levels and purchase history
 */
export function getAvailableShopItems(
  completedLevelIds: string[],
  purchasedItems: Record<string, number>
): ShopItem[] {
  return SHOP_ITEMS.filter(item => {
    // Check if unlock requirement is met
    if (item.unlockLevel && !completedLevelIds.includes(item.unlockLevel)) {
      return false
    }
    // Check if max purchases reached
    const purchased = purchasedItems[item.id] || 0
    if (purchased >= item.maxPurchases) {
      return false
    }
    return true
  })
}

/**
 * Get all items in a category
 */
export function getItemsByCategory(category: ShopItem['category']): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category)
}

/**
 * Calculate total effect value for a type across all purchased items
 */
export function getTotalEffect(
  effectType: string,
  purchasedItems: Record<string, number>
): number {
  let total = 0
  for (const item of SHOP_ITEMS) {
    const count = purchasedItems[item.id] || 0
    if (count > 0 && item.effect.type === effectType && 'value' in item.effect) {
      total += item.effect.value * count
    }
  }
  return total
}

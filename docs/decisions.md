# Beat the Heat — Design Decisions

## Game Scope

- **Single-hand blackjack** for MVP; architecture must support multi-hand later
- **Configurable table rules**; Classic Vegas Strip as default
- **Virtual chips only** — no real money; fake currency TBD, betting amounts tracked

## User Identity

- **MVP: guest mode only**, single-session tracking, no persistence
- **Post-MVP**: accounts with cross-session history
- Auth provider TBD (Clerk preferred when we get there)

## Strategy Tables

- **Static lookup table** format: (hand situation) × (dealer upcard) → action
- Hard totals, soft totals, and pairs each get their own table
- **Built-in Basic Strategy only** for MVP (we define it)
- Strategy correctness is **computed at display time** from tableState — never stored — so strategies can be swapped and history re-evaluated
- Feedback shown **immediately after each player decision** (before hand resolves)

## Data Model

The atomic unit is a **decision snapshot**:

```
Session {
  sessionId
  tableRules: { decks, s17, das, surrender, blackjackPayout, cutCardPenetration, ... }
  hands: Hand[]
}

Hand {
  handId
  decisions: Decision[]
  outcome: "win" | "lose" | "push" | "blackjack" | "surrender"
  betAmount: number
}

Decision {
  tableState: {
    playerCards
    dealerUpcard
    cardsRemainingInShoe
    runningCount
    playerStack
    betAmount
    isSoft
    isPair
    handTotal
    // everything visible to a real player
  }
  playerAction: "hit" | "stand" | "double" | "split" | "surrender"
}
```

- Splits: recorded as a decision + each resulting hand tracked independently
- Correct/incorrect derived at display time by passing tableState through selected strategy
- Running count tracked by game engine internally; stored in tableState; not surfaced in MVP UI

## Analytics

- Track every **individual decision** as atomic unit
- Aggregate: decision → hand → session
- **Live HUD** during play showing running session accuracy
- Post-MVP (when persistence added): deviation patterns, win rate, improvement over time

## Table Rules (Configurable)

- Number of decks
- Dealer hits/stands on soft 17 (H17 / S17)
- Double after split (DAS)
- Resplit aces
- Surrender allowed
- Blackjack payout (3:2 or 6:5)
- Cut card penetration (% of shoe dealt before shuffle)
- No insurance for MVP

## Game Flow

- Dealer plays **step-by-step**, user advances each dealer card
- Blackjack: recorded as hand with zero player decisions + blackjack outcome flag
- Betting: free choice per hand with configurable min/max limits
- Shoe resets at cut card; penetration % is configurable

## UI

- Cards rendered as **text + emoji suits** (A♠, K♥, 10♦) via card UI components — upgradeable later
- **Dedicated persistent feedback panel**: shows "You: Hit | Basic Strategy: Stand | ❌" after each decision
- **Desktop-first**; mobile not actively broken

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| State management | useReducer + Context (game as explicit state machine) |
| Monorepo | `packages/web`, `packages/shared`, `packages/api` (future) |
| Hosting | Cloudflare Pages (static SPA) |
| Backend (post-MVP) | Cloudflare Workers + D1 |

## Build Order

1. Shared types package (`packages/shared`) — data model interfaces
2. Game engine — deck, state machine, basic strategy table
3. React UI — game loop, feedback panel, live HUD
4. Deploy to Cloudflare Pages
5. (Post-MVP) Add accounts, persistence, Workers + D1

# Goals - Basic blackjack

We want to build a web app that allows users to:

- play blackjack with any table rules
- Record all of the player decisions
- have custom strategy table evaluations (like "basic strategy") and compare their decisions to the strategy tables
- Graphs and tables showing the users how they play compared to their selected strategies

We want to use typescript and react for the frontend
Cloudflare infrastructure (2026 workers and D1 databases)

Help me plan this.


{
    Sessionid: #####,
    tablerules: { 6 decks, s17, das, surrender, ... },
    gameplay{
        {TableState (cards on table, cards remaining in shoe, running count) + playeraction},
        {TableState + playeraction},
        {TableState + playeraction}
    }
}

Basic strategy:
valid table rules: >= 6 decks, s17, das.

Basic Strategy + beginner deviations:
valid table rules: >= 6 decks, s17, das.

Advanced Strategy (includes Card Counting)
valid table rules: xyz
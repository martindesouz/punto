# 🅿️ Punto

**The daily word duel.** A [Nimiq Pay Mini App](https://nimiq.dev/mini-apps/) built for the Nimiq Mini Apps Competition.

Guess the five-letter word in six tries — scored on fewest guesses, fastest solve, and fewest hints. Punto is the word game; Duel is the platform it lives in: challenge a friend to the same word, same seed, and settle the stake wallet-to-wallet. No signup, no escrow, no rake.

## Status

- ✅ **Phase 1 — Solo daily Punto**: server-side daily word, points + timer + hints scoring, streaks (local), liquid-glass UI
- ⏳ Phase 2 — NIM hint purchases via `sendBasicTransactionWithData`
- ⏳ Phase 3 — Device-identifier leaderboard + streaks
- ⏳ Phase 4 — Spanish-first localization (`window.nimiqPay.language`)
- ⏳ Phase 5 — Share result + challenge-a-friend deeplink
- ⏳ Phase 6 — Async duels with honor settlement

## Architecture

- **Client**: Vite + React + TypeScript. Mobile-first liquid-glass UI (navy `#1F2348`, gold `#E9B213`, teal `#21BCA5`, Mulish).
- **Server**: Vercel serverless functions in [`api/`](api/). The daily word, seed, and all scoring live server-side — the answer never reaches the client until the game ends. Game state travels in an HMAC-signed token, so phase 1 needs no database and no client trust.
- **Dev**: a Vite middleware ([vite.config.ts](vite.config.ts)) serves the same `api/` handlers locally — `npm run dev` runs the full stack on one origin.

## Develop

```bash
npm install
npm run dev        # full stack on http://localhost:5173, reachable over LAN
```

To test inside Nimiq Pay: open the **Network URL** printed by Vite (e.g. `http://192.168.x.x:5173`) from **Mini Apps** in Nimiq Pay on a phone on the same Wi-Fi.

Set `PUNTO_SECRET` (any long random string) in production — it keys the daily word pick and the state-token signatures. A dev fallback is used locally.

The allowed-guess dictionary is generated from the [`word-list`](https://www.npmjs.com/package/word-list) package (MIT) and committed; regenerate with `node scripts/build-allowed-words.mjs`.

## License

[MIT](LICENSE)

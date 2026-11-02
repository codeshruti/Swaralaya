# Swaralaya

A one-stop app for Carnatic music learners and lovers, built with Expo + React Native (web, iOS, Android).

## Features
- **Raga encyclopedia**: all 72 melakartas (generated from the swarasthana rules) plus curated janya ragas, with arohanam/avarohanam, parent/child links, moods, time of day, search and filters.
- **Compare ragas**: shared and unique notes, side by side.
- **Composers and songs**: the trinity, Purandara Dasa, Annamacharya, Swathi Thirunal and Bharati, with songs, ragas, talas and meanings.
- **Sing to discover**: on web, the mic is analysed with an autocorrelation pitch detector, notes are folded against your chosen Sa, and ragas are scored by scale fit; matching and similar songs are suggested. On native a tap-the-swaras input is used for now.
- **Raga of the day** and mood browsing.

## Run
```
npm install
npm run web      # or npm run ios / npm run android
npx tsc --noEmit
```

## Known limits / next steps
- Recognition is note-based (raga suggestion), not audio fingerprinting of a specific recording.
- Only opening lines of songs are included; full lyrics need a licensed or public-domain corpus.
- The raga and song dataset is a starter set and should be reviewed by a subject expert.
- Native live pitch detection needs a native audio module (dev build).

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

## Mix up (AI voice)

The Mix up tab re-sings a song in another person's voice. It runs in the web app.

- **Song**: pick from the library and sing it, record, upload, or paste a YouTube link to sing along with (audio is never downloaded from YouTube).
- **Voice**: a 10 to 25 second sample of the target voice, recorded or uploaded.
- **Consent**: both permission boxes must be ticked before anything is generated, and every result is labelled AI-generated in the page, the file name and the WAV metadata.
- **Engines**:
  - *AI voice clone* calls a [Seed-VC](https://github.com/Plachta/Seed-VC) Hugging Face Space over Gradio's HTTP API. Set `EXPO_PUBLIC_MIXUP_SPACE` to your own duplicated Space (for a dedicated GPU) and `EXPO_PUBLIC_MIXUP_SPACE_FN` if its endpoint name differs. The default is the free public Space, which can queue or run out of GPU time.
  - *Instant key match* runs on-device and transposes the song into the voice sample's range without changing whose voice it is.

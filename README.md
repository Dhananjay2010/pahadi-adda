# पहाड़ी अड्डा — Pahadi Adda

A live listening room for Garhwali & Kumaoni pahadi songs, styled after
Uttarakhand — five illustrated scenes (a hill temple at dusk, Himalayan
sunrise, a terraced village, a Ganga ghat, an alpine bugyal meadow) that the
visitor can switch between. Everyone hears (roughly) the same song at the
same time, sees how many people are on the site right now, gets a toast when
someone new joins, and can chat with whoever else is around.

## How it works

- **Playback** — 16 curated Garhwali/Kumaoni songs play through a real,
  visible embedded YouTube player (see
  [Why the player is visible](#why-the-player-is-visible) below), driven by
  custom controls. There's no licensed audio hosted here. The list lives in
  `src/lib/playlist.ts` — add more by appending `{ id, videoId, dev, lat,
  assumedDuration }` entries.
- **Shared "sync"** — which song is "current" is computed from wall-clock
  time against a fixed schedule (`src/lib/playlist.ts`), so every visitor's
  browser lands on the same track independently, with no server needed for
  that part. Anyone who manually skips/scrubs breaks off from the shared
  schedule for their own session (as expected) but keeps listening normally.
- **Background scenes** — five illustrated SVG scenes in
  `src/components/scenes/`, registered in `src/components/scenes/index.ts`.
  The visitor's pick is remembered in `localStorage` (`src/hooks/useScene.ts`)
  and crossfades in via CSS (`.scene-layer` in `globals.css`) — all five are
  mounted at once and only opacity changes, so switching is instant with no
  reload or flash.
- **Live presence + join toasts** — powered by Supabase Realtime's
  [Presence](https://supabase.com/docs/guides/realtime/presence) feature
  (`src/hooks/usePresence.ts`). Each browser tab tracks itself in a shared
  channel; the online count is the number of tracked tabs, and a "join" event
  from anyone else pops a toast.
- **Chat** — a floating panel (`src/components/ChatPanel.tsx`) backed by a
  `messages` table in Supabase (`supabase/schema.sql`) with Realtime enabled,
  so new messages appear for everyone instantly. No accounts: each visitor
  picks a nickname (stored in `localStorage`), and the same coarse
  city/region used for join toasts is attached to what they send. See
  [About the chat](#about-the-chat) for the moderation caveat before you
  point this at a big audience.
- **Location** — coarse city/region only, read from Vercel's edge
  geolocation headers (`src/app/api/geo/route.ts`). Nothing is stored beyond
  what you send in a chat message; it's otherwise read per-request. Locally
  (or off Vercel) this returns nothing and falls back to a generic
  "पहाड़ों से".
- **Reactions** — a 🪔 button next to the transport controls broadcasts a
  floating diya to everyone currently on the site via Supabase Realtime
  Broadcast (`src/hooks/usePresence.ts`, `src/components/ReactionBursts.tsx`).
  Ephemeral — nothing is stored, it's just a shared "someone's here" ping.
- **Song requests** — an "अनुरोध करें" button next to each track in the
  playlist panel lets anyone nudge what plays next; counts are tallied over
  a rolling 6-hour window from the `song_requests` table
  (`src/hooks/useSongRequests.ts`). Purely informational — it never touches
  the shared playback schedule.
- **Share** — the "शेयर करें" button in the top bar uses the Web Share API
  (falling back to copying a link) so visitors can invite others in; the
  live online count is also mirrored into the browser tab's title.

## Setup

1. **Install dependencies** (needs Node 18.18+; this repo was built against
   the `20` toolchain — if you use nvm: `nvm use 20`):

   ```bash
   npm install
   ```

2. **Create a free [Supabase](https://supabase.com) project** (needed for
   live online-count/join-toasts/chat — the site works without this, just
   without those features). In the dashboard: **Project Settings → API**,
   copy the **Project URL** and **anon public key**.

3. **Set up the chat table** — open the Supabase dashboard's **SQL Editor**,
   paste the contents of `supabase/schema.sql`, and run it. This creates the
   `messages` table, its access policies, and turns on Realtime for it.

4. **Add your keys**:

   ```bash
   cp .env.local.example .env.local
   # then paste your Supabase URL + anon key into .env.local
   ```

5. **Run it locally**:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. The geo lookup won't return a real place
   locally (that only works once deployed on Vercel), and the online
   count/chat need a second browser tab open to see them do anything.

## Deploying

Deploy to [Vercel](https://vercel.com) (free tier is enough to start):

```bash
npx vercel
```

Add the same two env vars (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's settings. Once live
on Vercel's network, the join toasts and chat messages will show real
city/region names.

## Why the player is visible

YouTube's embedding terms require the player to stay visible and not be
disguised or stripped down to audio-only — sites that hide the video and
extract just the audio are the kind of thing that gets an API integration
shut down. So the "now playing" card embeds a small but real, visible
YouTube player instead of hiding one off-screen; the custom prev/next/seek
controls next to it just drive that same visible player via YouTube's
official IFrame API, which is exactly what that API is for.

If you'd rather have the songs play without any YouTube-branded frame at
all, the only clean path is licensing the actual audio (or getting the
artists'/labels' permission to self-host it) and swapping the `<YouTube>`
player in `src/components/PahadiAdda.tsx` for a plain `<audio>` element —
happy to wire that up if you go that route.

## About the chat

There's no login, so the `messages` table's insert policy is wide open to
anyone holding the public anon key — that's everyone who loads the site.
Fine for a small, friendly audience; before pointing this at a large public
crowd, add real protection: Supabase Anonymous Auth plus a per-user rate
limit (a Postgres trigger or an Edge Function checking recent message count
by `auth.uid()`), and a way to delete/hide a message (simplest: just delete
the row from the Supabase Table Editor — there's no admin UI for this yet).

## Project structure

```
src/
  app/
    page.tsx              entry point
    api/geo/route.ts       coarse geo lookup for join toasts + chat
    layout.tsx              fonts + metadata
    globals.css               all styling
    opengraph-image.tsx        generated social share card (og:image)
    twitter-image.tsx           re-exports opengraph-image.tsx for Twitter
  components/
    PahadiAdda.tsx           main client component: playback, controls, layout
    scenes/                   the five illustrated backgrounds + registry
    SceneSwitcher.tsx          background picker (top-left dots) + current label
    AmbientParticles.tsx        drifting ember/firefly atmosphere
    ReactionBursts.tsx           floating diya reactions
    JoinToasts.tsx               toast notifications
    ChatPanel.tsx                 floating chat panel
    PlaylistPanel.tsx              full song list + request-to-play buttons
  hooks/
    usePresence.ts             Supabase Realtime presence (online count, joins, reactions)
    useChat.ts                   Supabase-backed chat (history + realtime)
    useSongRequests.ts            Supabase-backed "request this song" tally
    useScene.ts                   remembers the chosen background scene
  lib/
    playlist.ts                 curated song list + shared-schedule math
    geo.ts                        shared geo-lookup helper (presence + chat)
    supabase.ts                    Supabase client
  assets/
    fonts/                       Devanagari font bundled for the og:image route
supabase/
  schema.sql                    run once in the Supabase SQL Editor (chat + song request tables)
```

# पहाड़ी अड्डा — Pahadi Adda

A live listening room for Garhwali & Kumaoni pahadi songs, styled after
Uttarakhand — one cinematic Himalayan hill-temple scene whose sky, stars and
light continuously track the visitor's real local time, instead of a set of
illustrations to pick between. Everyone hears (roughly) the same song at the
same time, sees how many people are on the site right now, gets a toast when
someone new joins, and can chat with whoever else is around.

## How it works

- **Playback** — 95 curated Garhwali/Kumaoni/Jaunsari songs play through a
  real, visible embedded YouTube player (see
  [Why the player is visible](#why-the-player-is-visible) below), driven by
  custom controls. There's no licensed audio hosted here. The list lives in
  `src/lib/playlist.ts`, ordered by YouTube view count (most-watched first,
  counts read off YouTube in September 2026 and shown in the playlist panel)
  — add more by appending `{ id, videoId, dev, lat, assumedDuration, views }`
  entries and re-sorting by `views`. Nothing below a lakh of views is in
  here: where a classic only existed as an obscure few-hundred-view
  re-upload, it was repointed at the version people actually watch. Check
  a new video is embeddable before adding it — a fair number of
  Uttarakhandi uploads have embedding switched off, and those fail at
  playback with IFrame error 150.
- **Watching, not just listening** — the embedded player doubles as a video
  view: the ▣ button on the card (or clicking the thumbnail itself, or `v`)
  expands that *same* player into a 16:9 stage above the track title, so
  anyone who wants to watch the video stays on the site instead of leaving
  for YouTube. In compact mode a transparent overlay makes the whole 96x54
  thumbnail that one target — the player's own controls are unhittable at
  that size — and it's dropped in video mode so the real controls get the
  clicks. It's a CSS change on the card
  (`.card.watching` in `src/app/globals.css`) rather than a second player —
  the iframe is never remounted, so the song plays straight through the
  switch — and the choice is remembered per browser.
- **Shuffle** — the ⤬ button next to the diya reshuffles the play order
  (Fisher-Yates over the whole list, with the current song pinned to the
  front so turning it on never cuts a song off). Off, tracks play in the
  view-count order above. Like skipping, it's a personal deviation from
  what everyone else is hearing, so it lives in `localStorage` rather than
  being shared.
- **Keyboard** — space plays/pauses (or starts the first time), ← / →
  scrub ±5s, shift + ← / → (or `p` / `n`, as on YouTube) change track, ↑ / ↓
  set the volume, `m` mutes, `s` shuffles, `v` opens the video view. Every
  control's tooltip names its shortcut. Ignored while typing in chat.
- **Tooltips** — one shared bubble for the whole page
  (`src/components/Tooltips.tsx`), driven by a `data-tip` attribute on any
  control. This replaces the browser's own `title` tooltips, which only
  appear after about a second of holding the pointer perfectly still, are
  styled by the OS rather than the site, and never show for keyboard users
  — in practice nobody saw them. Being one fixed-position element, it also
  escapes the playlist panel's `overflow: auto`, and flips below the
  control when there's no room above (the topbar).
- **Shared "sync"** — which song is "current" is computed from wall-clock
  time against a fixed schedule (`src/lib/playlist.ts`), so every visitor's
  browser lands on the same track independently, with no server needed for
  that part. Anyone who manually skips/scrubs breaks off from the shared
  schedule for their own session (as expected) but keeps listening normally.
- **Background** — a crossfading slideshow of six real, freely-licensed
  photos of Uttarakhand (`src/components/PhotoHero.tsx`,
  `src/lib/heroPhotos.ts`): a sunrise peak, Kedarnath temple, a terraced
  Garhwal village, a river sunset, a Ganga aarti at dusk, and a starlit
  Himalayan night, sourced from Wikimedia Commons and credited in-app via the
  ⓘ button (`src/components/PhotoCredits.tsx`). Each photo holds for ~9s with
  a slow Ken Burns pan/zoom, then crossfades to the next, cycling in a fixed
  dawn-to-night order; the opening photo is picked to match the visitor's
  real local hour. On top, a time-of-day color wash, horizon glow, and
  starfield (from `src/lib/timePalette.ts`, interpolated continuously via
  `src/hooks/useTimeOfDay.ts`) tie the differently-lit photos into one
  believable day, and a fixed vignette keeps the topbar/card text legible.
- **Starting playback** — browsers only allow autoplay while muted, so the
  player begins muted and the "सुनना शुरू करें" click is what turns the
  sound on. That click can land before the YouTube iframe is ready, so the
  ask is recorded and replayed from `onReady` (the overlay stays up saying
  it's connecting rather than disappearing on a click that did nothing),
  and the unmute is confirmed for a couple of seconds afterwards in case
  the player dropped it mid-buffer. Both paths used to end in a player that
  looked like it was playing with no sound coming out.
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
  Each one rises out of the diya button itself and is drawn above the
  player card, not behind it — remote reactions carry only a horizontal
  jitter, since the sender's screen layout says nothing about ours.
  Ephemeral — nothing is stored, it's just a shared "someone's here" ping.
- **Search** — the playlist panel has a search box that takes either
  script: "gulabi" and "गुलाबी" both find गुलाबी शरारा, and "negi" and
  "नेगी" both find the Narendra Singh Negi songs (`src/lib/search.ts`).
  Every track is written in both scripts, so a plain substring match over
  the two names covers most of it; when that finds nothing, a second pass
  compares *consonant skeletons* — Devanagari transliterated roughly to
  Latin with the vowels dropped — which is what lets a Hindi query reach
  the artist names, since those are only written in Latin (इंदर → "ndr" →
  Inder Arya). That pass runs only as a fallback: skeletons are loose
  enough that mixing them into a search with exact hits would bury them.
- **Voice search** — a mic in the search box dictates into it, which is
  mostly for phones: saying a song name beats typing Devanagari on a
  keyboard. Interim results are applied as they arrive, so the list filters
  while you're still talking, and a phrase that matches nothing local flows
  straight into the YouTube search below. Built on the Web Speech API
  (`src/hooks/useVoiceSearch.ts`), which only takes one language at a time
  — so there's a हिंदी / English toggle next to the "listening" line, and
  the choice is remembered. Browsers without the API (Firefox, at the time
  of writing) simply don't get the button.
- **Songs that aren't in the list** — when a search matches nothing local,
  the panel searches YouTube and offers the results to play right there
  (`src/app/api/youtube-search/route.ts`). That route reads YouTube's
  public results page rather than the Data API, so there's no key to
  configure and nothing to set up on a fresh deploy — it also means it can
  break if YouTube reshapes that page, so every failure is soft and the
  playlist carries on. Playing one is treated as a detour: the playlist
  index stays put, and when the video ends (or turns out to have embedding
  disabled, which some do) playback rejoins the list where it left off.
- **The playlist panel** — opens stacked directly above the player rather
  than in a corner of the screen (both live in one bottom-centred `.dock`,
  `src/app/globals.css`), so the list appears where the button that opens
  it is. It also opens scrolled to whatever is playing instead of at the
  top of ~95 rows, and follows along if the track changes while it's open.
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
official IFrame API, which is exactly what that API is for. The video image
itself is never covered: the compact-mode click target over the thumbnail is
transparent, and it exists to *open* the bigger player rather than to stand
in for it. Volume is read back off the player on every tick (the IFrame API
fires no event for it), so moving the player's own slider in video mode
moves the site's too.

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
    api/youtube-search/route.ts   song search for anything not in the list
    layout.tsx              fonts + metadata
    globals.css               all styling
    opengraph-image.tsx        generated social share card (og:image)
    twitter-image.tsx           re-exports opengraph-image.tsx for Twitter
  components/
    PahadiAdda.tsx           main client component: playback, controls, layout
    PhotoHero.tsx              crossfading Ken Burns photo slideshow background
    PhotoCredits.tsx            photo attribution panel (ⓘ button)
    MistLayer.tsx, CelestialBody.tsx, ShootingStar.tsx  shared atmosphere, sun/moon arc
    AmbientParticles.tsx        drifting ember/firefly atmosphere
    ReactionBursts.tsx           floating diya reactions
    JoinToasts.tsx               toast notifications
    ChatPanel.tsx                 floating chat panel
    PlaylistPanel.tsx              song list, search, YouTube results
    Tooltips.tsx                   one shared tooltip for every control
  hooks/
    usePresence.ts             Supabase Realtime presence (online count, joins, reactions)
    useChat.ts                   Supabase-backed chat (history + realtime)
    useVoiceSearch.ts             Web Speech dictation for the search box
    useTimeOfDay.ts                local hour, updated once a minute
  lib/
    playlist.ts                 curated song list + shared-schedule math
    search.ts                    bilingual playlist search (both scripts)
    heroPhotos.ts                 hero photo list + credits + time-of-day picker
    timePalette.ts                sky/star/glow color interpolation by hour
    geo.ts                        shared geo-lookup helper (presence + chat)
    supabase.ts                    Supabase client
  assets/
    fonts/                       Devanagari font bundled for the og:image route
supabase/
  schema.sql                    run once in the Supabase SQL Editor (chat + song request tables)
```

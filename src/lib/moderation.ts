// Deliberately small and English-only — a wordlist this short can't
// reliably cover Hindi or Garhwali profanity, so it doesn't try to. Extend
// this array (and the matching CHECK constraint on public.messages.content
// in supabase/schema.sql — this is the client-side half of that check, not
// a replacement for it) if more coverage is needed.
// Matched as a prefix (leading \b, no trailing \b) so common inflections —
// "fucking", "shitty", "bitches" — are caught without listing every form
// by hand. Safe for these specific words because no legitimate English
// word happens to start with any of them.
export const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "faggot",
  "retard",
  "motherfucker",
  "dickhead",
  "pussy",
];

// Matched as a whole word only: several everyday words legitimately start
// with "cock" (cockpit, cocktail, cockroach, cockney), so prefix-matching
// it the way the list above is matched would false-positive on those.
const BLOCKED_WHOLE_WORDS = ["cock"];

const BLOCKED_PATTERN = new RegExp(
  `\\b(${BLOCKED_WORDS.join("|")})|\\b(${BLOCKED_WHOLE_WORDS.join("|")})\\b`,
  "i",
);

export function containsBlockedWord(text: string): boolean {
  return BLOCKED_PATTERN.test(text);
}

import { PLAYLIST, type Track } from "./playlist";

/**
 * Folds a string down to something two spellings of the same name can meet
 * on: case, Latin accents (`Rañcaṇa` → `rancana`), the Devanagari nukta
 * (which has two encodings), and all punctuation and spacing (`N.S. Negi`
 * → `n s negi`). Devanagari vowel signs are marks, not letters, so `\p{M}`
 * has to be kept or every matra would be thrown away with the punctuation.
 */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "") // Latin accents
    .replace(/\u093C/g, "") // Devanagari nukta
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}

/** Rough Devanagari → Latin. Not a transliteration scheme anyone would
 *  publish — just close enough for the consonant skeletons below. */
const LATIN: Record<string, string> = {
  "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ऋ": "ri",
  "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ा": "a", "ि": "i", "ी": "i",
  "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
  "ं": "n", "ँ": "n", "ः": "h", "्": "", "क": "k", "ख": "kh", "ग": "g",
  "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh",
  "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t",
  "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b",
  "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "ळ": "l", "व": "v",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
};

/**
 * The consonant skeleton of a string, in Latin. This is what lets a
 * Devanagari query reach the Latin names and the other way round: every
 * track is written in both scripts, but the artist only appears in the
 * Latin one, so someone typing "इंदर" would otherwise never find Inder
 * Arya. Vowels go because that's where transliterations disagree most —
 * इंदर transliterates to "indar", the name is spelled "inder", and both
 * come down to "ndr".
 */
function skeleton(value: string): string {
  let out = "";
  for (const ch of value) out += LATIN[ch] ?? ch;
  return out.replace(/[aeiou]/g, "");
}

const haystacks = new Map<string, { plain: string; skeleton: string }>();

function haystackFor(track: Track) {
  let entry = haystacks.get(track.id);
  if (!entry) {
    const plain = `${normalize(track.dev)} ${normalize(track.lat)} ${normalize(track.id)}`;
    entry = { plain, skeleton: skeleton(plain) };
    haystacks.set(track.id, entry);
  }
  return entry;
}

/** Whether `needle` occurs in `haystack` at the start of a word. */
function atWordStart(haystack: string, needle: string): boolean {
  for (let from = 0; ; ) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    if (at === 0 || haystack[at - 1] === " ") return true;
    from = at + 1;
  }
}

/**
 * Orders matches so the ones that begin a word come first, keeping the
 * view-count order within each group.
 *
 * Searching an artist is the case this exists for. "नेगी" reaches the Latin
 * artist names only through the skeleton pass below, where it comes down to
 * the two consonants "ng" — and "ng" turns up inside "Rongpaz" and
 * "Gangotri" as readily as it starts "Negi". The loose matches are worth
 * keeping (a skeleton is a guess about spelling, and throwing away the
 * near misses is how a search stops finding things), but they belong under
 * the songs the person was obviously asking for, not shuffled in among
 * them by view count.
 */
function rankByWordStart(
  tracks: Track[],
  needles: string[],
  pick: (track: Track) => string,
): Track[] {
  return tracks
    .map((track, position) => ({
      track,
      position,
      starts: needles.filter((needle) => atWordStart(pick(track), needle)).length,
    }))
    .sort((a, b) => b.starts - a.starts || a.position - b.position)
    .map((entry) => entry.track);
}

/**
 * The tracks matching what's been typed, best matches first.
 *
 * Two passes. The first is a plain substring match, word by word, across
 * the Devanagari name, the Latin name (which carries the artist) and the
 * id — so "negi meena" finds "Meena Rana & N.S. Negi". Only if that finds
 * nothing at all does the consonant-skeleton pass run, which is what
 * crosses between the scripts. Keeping it as a fallback rather than an
 * alternative matters: skeletons are deliberately loose, and mixing them
 * into a search that already has exact hits buries those hits in noise —
 * "negi" would go from 11 tracks to 26.
 */
export function searchPlaylist(query: string): Track[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return PLAYLIST;

  const direct = PLAYLIST.filter((track) =>
    words.every((word) => haystackFor(track).plain.includes(word)),
  );
  if (direct.length > 0) {
    return rankByWordStart(direct, words, (track) => haystackFor(track).plain);
  }

  const skeletons = words.map(skeleton);
  // A one-consonant skeleton matches half the list; not worth offering.
  if (skeletons.some((word) => word.length < 2)) return [];
  const loose = PLAYLIST.filter((track) =>
    skeletons.every((word) => haystackFor(track).skeleton.includes(word)),
  );
  return rankByWordStart(loose, skeletons, (track) => haystackFor(track).skeleton);
}

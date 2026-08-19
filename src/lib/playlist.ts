export type Track = {
  id: string;
  videoId: string;
  dev: string;
  lat: string;
  assumedDuration: number;
};

export const PLAYLIST: Track[] = [
  {
    id: "bedu-pako",
    videoId: "T7GhubZGBIg",
    dev: "बेडु पाको बारो मासा",
    lat: "Bedu Pako Baro Masa — Traditional Kumaoni",
    assumedDuration: 222,
  },
  {
    id: "kwi-ta-baat-holi",
    videoId: "S-Q8YOdkaIA",
    dev: "क्वी त् बात होलि",
    lat: "Kwi Ta Baat Holi — Narendra Singh Negi",
    assumedDuration: 258,
  },
  {
    id: "hey-ramiye",
    videoId: "O_tWjS7xj7o",
    dev: "हे रामियै",
    lat: "Hey Ramiye — N.S. Negi & Meena Rana",
    assumedDuration: 274,
  },
  {
    id: "ghuguti-ghuraona-laigi",
    videoId: "AwESlAx6py8",
    dev: "घुघुती घुरोणा लगि",
    lat: "Ghuguti Ghuraona Laigi — Meena Rana",
    assumedDuration: 243,
  },
  {
    id: "mai-si-nafrat",
    videoId: "nqXqB01rSBw",
    dev: "मैं सी नफरत",
    lat: "Mai Si Nafrat — Keshar Panwar, Meena Rana",
    assumedDuration: 261,
  },
  {
    id: "basanti-danda",
    videoId: "SkKb-6LKfXQ",
    dev: "हिट बसंती डांडा",
    lat: "Basanti Danda — Dr. Pritam Bhartwan",
    assumedDuration: 249,
  },
  {
    id: "jara-thandu-chala-di",
    videoId: "j3cE90Tv6y0",
    dev: "जरा ठंडू चला दी",
    lat: "Jara Thandu Chala Di — Chandra Singh Rahi",
    assumedDuration: 231,
  },
  {
    id: "bhana-ye-rangili-bhana",
    videoId: "fH-xQkW0bbw",
    dev: "भाना ये रंगीली भाना",
    lat: "Bhana Ye Rangili Bhana — Chandra Singh Rahi",
    assumedDuration: 256,
  },
  {
    id: "kamla-bimla-himla",
    videoId: "AysSTrCGCYs",
    dev: "कमला बिमला हिमला",
    lat: "Kamla Bimla Himla — Gajendra Rana",
    assumedDuration: 268,
  },
  {
    id: "o-neera",
    videoId: "yOSRckPVAGo",
    dev: "ओ नीरा",
    lat: "O Neera — Gajendra Rana",
    assumedDuration: 239,
  },
  {
    id: "mohan-girdhari",
    videoId: "rEmP8sclk_k",
    dev: "मोहन गिरधारी",
    lat: "Mohan Girdhari — Kumaoni Holi Song",
    assumedDuration: 247,
  },
  {
    id: "rasyann",
    videoId: "C1vHqeVmcfY",
    dev: "रस्यंण",
    lat: "Rasyann — Anuradha Nirala",
    assumedDuration: 253,
  },
  {
    id: "ghas-gadoli",
    videoId: "OvynTJPAQKg",
    dev: "घास गडोली",
    lat: "Ghas Gadoli — Anuradha Nirala",
    assumedDuration: 224,
  },
  {
    id: "fyonladiya",
    videoId: "GsqdP7lzdWM",
    dev: "फ्योंलड़िया",
    lat: "Fyonladiya — Kishan Mahipal",
    assumedDuration: 265,
  },
  {
    id: "ghughuti-2",
    videoId: "2Bugm8QWu2E",
    dev: "घुघुती",
    lat: "Ghughuti — Kishan Mahipal",
    assumedDuration: 238,
  },
  {
    id: "aija-agni",
    videoId: "aLPe3zgEUt4",
    dev: "आईजा अग्नि आईजा अग्नि",
    lat: "Aija Agni Aija Agni (Mangal) — Narendra Singh Negi",
    assumedDuration: 271,
  },
  {
    id: "thal-ki-bazar",
    videoId: "ijN3PK7j6PQ",
    dev: "थल की बाजार",
    lat: "Thal Ki Bazar — B.K. Samant",
    assumedDuration: 258,
  },
  {
    id: "chandna-mera-pahaad",
    videoId: "TbJNa9c9U3A",
    dev: "चांदना मेरा पहाड़",
    lat: "Chandna Mera Pahaad — Meena Rana",
    assumedDuration: 246,
  },
  {
    id: "ringa-ring",
    videoId: "cN7PEc2hQJk",
    dev: "रिंगा रिंग",
    lat: "Ringa Ring — Meena Rana & Sanjay Kumola",
    assumedDuration: 233,
  },
  {
    id: "yaad-tera-gaon-ki",
    videoId: "wjr9ocgAUyk",
    dev: "याद तेरा गांव की",
    lat: "Yaad Tera Gaon Ki — Gajendra Rana",
    assumedDuration: 262,
  },
  {
    id: "yo-pahad-ma",
    videoId: "NmwtS1GnX5k",
    dev: "यो पहाड़ मा",
    lat: "Yo Pahad Ma — Jitendra Tomkyal",
    assumedDuration: 241,
  },
  {
    id: "ghasyari",
    videoId: "D2Opsod0KMc",
    dev: "घसियारी",
    lat: "Ghasyari — Jitendra Tomkyal & Mamta Arya",
    assumedDuration: 257,
  },
  {
    id: "dwarahat-bazaar",
    videoId: "vPX80OOHrEo",
    dev: "द्वाराहाट बाजार",
    lat: "Dwarahat Bazaar — Jitendra Tomkyal",
    assumedDuration: 249,
  },
];

/** Fixed reference instant every visitor's clock math is anchored to. */
export const SCHEDULE_EPOCH = Date.parse("2025-01-01T00:00:00Z");

export type ScheduleResult = { index: number; offset: number };

/**
 * Picks "the track that should be playing right now" the same way for every
 * visitor, purely from wall-clock time — no server round trip needed.
 * `durations` lets callers substitute real (player-reported) lengths in
 * place of the shipped estimates once known, so the schedule self-corrects.
 */
export function scheduleFromEpoch(
  durations: Record<string, number> = {},
  now: number = Date.now(),
): ScheduleResult {
  const lengths = PLAYLIST.map((t) => durations[t.videoId] ?? t.assumedDuration);
  const totalCycle = lengths.reduce((a, b) => a + b, 0);
  let elapsed = ((now - SCHEDULE_EPOCH) / 1000) % totalCycle;
  if (elapsed < 0) elapsed += totalCycle;
  let acc = 0;
  for (let i = 0; i < PLAYLIST.length; i++) {
    if (elapsed < acc + lengths[i]) {
      return { index: i, offset: elapsed - acc };
    }
    acc += lengths[i];
  }
  return { index: 0, offset: 0 };
}

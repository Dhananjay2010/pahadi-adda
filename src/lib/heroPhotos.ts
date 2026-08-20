export type HeroPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Representative local hour this photo's light suits — used to pick a fitting first frame. */
  hour: number;
  credit: { title: string; author: string; source: string; license: string };
};

// Real, freely-licensed photographs of Uttarakhand (Wikimedia Commons), ordered
// to read as one day: sunrise peak -> temple -> village -> river sunset ->
// aarti dusk -> starlit night, then loops. Cycling always follows this order
// rather than jumping randomly, so the slideshow itself feels like a day passing.
export const HERO_PHOTOS: HeroPhoto[] = [
  {
    id: "dawn-chandrashila",
    src: "/images/hero/dawn-chandrashila.jpg",
    alt: "चन्द्रशिला शिखर से हिमालय की बर्फ़ीली चोटियों का नज़ारा",
    hour: 7,
    credit: {
      title: "Chandrashila peak, Uttarakhand",
      author: "Photos Worldwide",
      source: "https://commons.wikimedia.org/wiki/File:Chandrashila_peak_Uttarakhand.jpg",
      license: "CC0",
    },
  },
  {
    id: "day-kedarnath",
    src: "/images/hero/day-kedarnath.jpg",
    alt: "केदारनाथ मंदिर, हिमालय की गोद में",
    hour: 11,
    credit: {
      title: "Panorama, Kedarnath Temple",
      author: "Surendra 1999",
      source: "https://commons.wikimedia.org/wiki/File:Panorama_Kedarnath_Uttarakhand.jpg",
      license: "CC BY-SA 4.0",
    },
  },
  {
    id: "day-village",
    src: "/images/hero/day-village.jpg",
    alt: "गढ़वाल की सीढ़ीदार पहाड़ी बस्ती",
    hour: 14,
    credit: {
      title: "Terraced hillside village, Garhwal",
      author: "Paul Hamilton",
      source:
        "https://commons.wikimedia.org/wiki/File:Camels_Back_Village_View_Gharwal_Uttarakhand_India.jpg",
      license: "CC BY-SA 2.0",
    },
  },
  {
    id: "dusk-alaknanda",
    src: "/images/hero/dusk-alaknanda.jpg",
    alt: "श्रीनगर गढ़वाल में अलकनंदा नदी पर सूर्यास्त",
    hour: 18,
    credit: {
      title: "Sunset over the Alaknanda River, Srinagar Garhwal",
      author: "Gul-Wiki",
      source:
        "https://commons.wikimedia.org/wiki/File:Sunset_over_the_Alaknanda_River_in_Srinagar_Garhwal,_Uttarakhand.jpg",
      license: "CC0",
    },
  },
  {
    id: "dusk-aarti",
    src: "/images/hero/dusk-aarti.jpg",
    alt: "हरिद्वार में गंगा आरती के दीये",
    hour: 19.5,
    credit: {
      title: "Ganga Aarti, Haridwar",
      author: "Aditya Singh Gusain",
      source: "https://commons.wikimedia.org/wiki/File:Ganga_Aarti_in_Haridwar.png",
      license: "CC BY-SA 4.0",
    },
  },
  {
    id: "night-nandadevi",
    src: "/images/hero/night-nandadevi.jpg",
    alt: "नंदा देवी पर्वतमाला पर रात का चाँद",
    hour: 23,
    credit: {
      title: "A Night on the Nanda Devi range",
      author: "Aditya Singh",
      source: "https://commons.wikimedia.org/wiki/File:A_Night_on_The_Nanda_Devi_range.jpg",
      license: "CC BY-SA 4.0",
    },
  },
];

/** Index of the photo whose `hour` sits closest to the given local hour, wrapping across midnight. */
export function closestPhotoIndex(hour: number): number {
  let best = 0;
  let bestDist = Infinity;
  HERO_PHOTOS.forEach((photo, i) => {
    const diff = Math.abs(hour - photo.hour);
    const dist = Math.min(diff, 24 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

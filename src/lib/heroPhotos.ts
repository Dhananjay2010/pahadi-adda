export type HeroMedia = {
  id: string;
  type: "photo" | "video";
  src: string;
  /** First-frame still, shown immediately and while the video loads; required for videos. */
  poster?: string;
  alt: string;
  /** Representative local hour this media's light suits — used to pick a fitting first frame. */
  hour: number;
  credit: { title: string; author: string; source: string; license: string; platform: string };
};

// Real, freely-licensed photographs of Uttarakhand (Wikimedia Commons) plus a
// few licensed Himalayan-forest/valley video clips (Mixkit — not verified as
// shot in Uttarakhand itself, unlike the geotagged photos), ordered to read as
// one day: sunrise peak -> misty forest -> temple -> snowy Auli -> glacial
// valley -> Valley of Flowers -> village -> green hills -> river sunsets ->
// aarti dusk -> starlit night, then loops. Cycling always follows this order
// rather than jumping randomly, so the slideshow itself feels like a day
// passing.
export const HERO_MEDIA: HeroMedia[] = [
  {
    id: "dawn-chandrashila",
    type: "photo",
    src: "/images/hero/dawn-chandrashila.jpg",
    alt: "चन्द्रशिला शिखर से हिमालय की बर्फ़ीली चोटियों का नज़ारा",
    hour: 7,
    credit: {
      title: "Chandrashila peak, Uttarakhand",
      author: "Photos Worldwide",
      source: "https://commons.wikimedia.org/wiki/File:Chandrashila_peak_Uttarakhand.jpg",
      license: "CC0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "forest-mist-sunrise",
    type: "video",
    src: "/videos/hero/forest-mist-sunrise.mp4",
    poster: "/videos/hero/forest-mist-sunrise-poster.jpg",
    alt: "हिमालय के जंगलों पर सुबह की धुंध",
    hour: 8.5,
    credit: {
      title: "Forest covered by mist at sunrise from the heights",
      author: "Mixkit",
      source: "https://mixkit.co/free-stock-video/forest-covered-by-mist-at-sunrise-from-the-heights-28339/",
      license: "Mixkit Stock Video License",
      platform: "Mixkit (stock footage, not shot in Uttarakhand)",
    },
  },
  {
    id: "day-kedarnath",
    type: "photo",
    src: "/images/hero/day-kedarnath.jpg",
    alt: "केदारनाथ मंदिर, हिमालय की गोद में",
    hour: 10,
    credit: {
      title: "Panorama, Kedarnath Temple",
      author: "Surendra 1999",
      source: "https://commons.wikimedia.org/wiki/File:Panorama_Kedarnath_Uttarakhand.jpg",
      license: "CC BY-SA 4.0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "day-auli-snow",
    type: "photo",
    src: "/images/hero/day-auli-snow.jpg",
    alt: "औली से बर्फ़ीली हिमालय चोटियों का दृश्य",
    hour: 11.5,
    credit: {
      title: "Snow-capped peaks above Auli",
      author: "Srijan96",
      source: "https://commons.wikimedia.org/wiki/File:Auli_view.jpg",
      license: "CC BY-SA 4.0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "river-valley",
    type: "video",
    src: "/videos/hero/river-valley.mp4",
    poster: "/videos/hero/river-valley-poster.jpg",
    alt: "हिमालय की हरी-भरी घाटी में बहती नदी",
    hour: 12.5,
    credit: {
      title: "Aerial view of lush river valley and snowy mountains",
      author: "Mixkit",
      source: "https://mixkit.co/free-stock-video/aerial-view-of-lush-river-valley-and-snowy-mountains-15919/",
      license: "Mixkit Stock Video License",
      platform: "Mixkit (stock footage, not shot in Uttarakhand)",
    },
  },
  {
    id: "day-valley-of-flowers",
    type: "photo",
    src: "/images/hero/day-valley-of-flowers.jpg",
    alt: "फूलों की घाटी में पुष्पावती नदी",
    hour: 13.5,
    credit: {
      title: "Pushpawati river inside the Valley of Flowers",
      author: "Daniel Romanson",
      source:
        "https://commons.wikimedia.org/wiki/File:Pushpawati_river_inside_the_Valley_of_Flowers_Uttarakhand_I.jpg",
      license: "CC0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "day-village",
    type: "photo",
    src: "/images/hero/day-village.jpg",
    alt: "गढ़वाल की सीढ़ीदार पहाड़ी बस्ती",
    hour: 15,
    credit: {
      title: "Terraced hillside village, Garhwal",
      author: "Paul Hamilton",
      source:
        "https://commons.wikimedia.org/wiki/File:Camels_Back_Village_View_Gharwal_Uttarakhand_India.jpg",
      license: "CC BY-SA 2.0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "lush-green-mountains",
    type: "video",
    src: "/videos/hero/lush-green-mountains.mp4",
    poster: "/videos/hero/lush-green-mountains-poster.jpg",
    alt: "बादलों से घिरी हरी-भरी पहाड़ियाँ",
    hour: 16.5,
    credit: {
      title: "Lush green mountains under cloudy skies",
      author: "Mixkit",
      source: "https://mixkit.co/free-stock-video/lush-green-mountains-under-cloudy-skies-100415/",
      license: "Mixkit Stock Video License",
      platform: "Mixkit (stock footage, not shot in Uttarakhand)",
    },
  },
  {
    id: "dusk-alaknanda",
    type: "photo",
    src: "/images/hero/dusk-alaknanda.jpg",
    alt: "श्रीनगर गढ़वाल में अलकनंदा नदी पर सूर्यास्त",
    hour: 18,
    credit: {
      title: "Sunset over the Alaknanda River, Srinagar Garhwal",
      author: "Gul-Wiki",
      source:
        "https://commons.wikimedia.org/wiki/File:Sunset_over_the_Alaknanda_River_in_Srinagar_Garhwal,_Uttarakhand.jpg",
      license: "CC0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "dusk-lakshman-jhula",
    type: "photo",
    src: "/images/hero/dusk-lakshman-jhula.jpg",
    alt: "ऋषिकेश में लक्ष्मण झूला पर सूर्यास्त",
    hour: 18.5,
    credit: {
      title: "Sunset over Lakshman Jhula, Rishikesh",
      author: "Tylersundance",
      source: "https://commons.wikimedia.org/wiki/File:Sunset_-_Lakshman_Jhula.jpg",
      license: "CC BY-SA 3.0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "dusk-aarti",
    type: "photo",
    src: "/images/hero/dusk-aarti.jpg",
    alt: "हरिद्वार में गंगा आरती के दीये",
    hour: 19.5,
    credit: {
      title: "Ganga Aarti, Haridwar",
      author: "Aditya Singh Gusain",
      source: "https://commons.wikimedia.org/wiki/File:Ganga_Aarti_in_Haridwar.png",
      license: "CC BY-SA 4.0",
      platform: "Wikimedia Commons",
    },
  },
  {
    id: "night-nandadevi",
    type: "photo",
    src: "/images/hero/night-nandadevi.jpg",
    alt: "नंदा देवी पर्वतमाला पर रात का चाँद",
    hour: 23,
    credit: {
      title: "A Night on the Nanda Devi range",
      author: "Aditya Singh",
      source: "https://commons.wikimedia.org/wiki/File:A_Night_on_The_Nanda_Devi_range.jpg",
      license: "CC BY-SA 4.0",
      platform: "Wikimedia Commons",
    },
  },
];

/** Index of the media whose `hour` sits closest to the given local hour, wrapping across midnight. */
export function closestMediaIndex(hour: number): number {
  let best = 0;
  let bestDist = Infinity;
  HERO_MEDIA.forEach((media, i) => {
    const diff = Math.abs(hour - media.hour);
    const dist = Math.min(diff, 24 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

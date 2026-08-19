"use client";

import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { getTimePalette } from "@/lib/timePalette";

// One persistent, painterly Himalayan silhouette — four ridgelines with
// atmospheric-perspective gradients (each layer paler/cooler the further
// back it sits), snow-cap highlights clipped to the peaks, and a small
// temple + prayer-flag foreground that anchors the place without needing
// five separate illustrations to swap between. Static across time of day on
// purpose: the sky, stars and glow (driven by src/lib/timePalette.ts) do all
// the storytelling, the way a real skyline stays put while the light on it
// changes.
const MOUNTAIN_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hz-peakFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eef4fb"/>
      <stop offset="100%" stop-color="#aebcd8"/>
    </linearGradient>
    <linearGradient id="hz-peakMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8b93bd"/>
      <stop offset="100%" stop-color="#454f77"/>
    </linearGradient>
    <linearGradient id="hz-peakNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#232a44"/>
      <stop offset="100%" stop-color="#0a0d1a"/>
    </linearGradient>
    <linearGradient id="hz-stoneTier" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c07f4c"/>
      <stop offset="100%" stop-color="#93582f"/>
    </linearGradient>
    <linearGradient id="hz-doorGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd699"/>
      <stop offset="100%" stop-color="#ff9a3d"/>
    </linearGradient>
    <radialGradient id="hz-doorHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb84d" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#ffb84d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hz-ray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe8bc" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ffe8bc" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="hz-clipFar">
      <polygon points="0,480 80,300 150,360 230,240 300,340 380,260 450,370 540,250 610,360 690,270 760,380 850,260 920,370 1000,280 1080,390 1160,270 1250,380 1340,290 1420,390 1500,300 1600,380 1600,520 0,520"/>
    </clipPath>
    <clipPath id="hz-clipMid">
      <polygon points="0,560 100,420 190,470 280,400 370,480 470,410 560,490 660,420 760,500 860,430 960,500 1060,420 1160,500 1260,430 1360,500 1460,420 1600,480 1600,600 0,600"/>
    </clipPath>
    <filter id="hz-soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <polygon class="depth-far" points="0,480 80,300 150,360 230,240 300,340 380,260 450,370 540,250 610,360 690,270 760,380 850,260 920,370 1000,280 1080,390 1160,270 1250,380 1340,290 1420,390 1500,300 1600,380 1600,520 0,520" fill="url(#hz-peakFar)"/>
  <g clip-path="url(#hz-clipFar)" filter="url(#hz-soft)" fill="#ffffff" opacity="0.85">
    <ellipse cx="150" cy="330" rx="55" ry="60"/>
    <ellipse cx="300" cy="320" rx="50" ry="55"/>
    <ellipse cx="540" cy="230" rx="60" ry="65"/>
    <ellipse cx="760" cy="360" rx="55" ry="55"/>
    <ellipse cx="1000" cy="260" rx="55" ry="60"/>
    <ellipse cx="1160" cy="250" rx="55" ry="60"/>
    <ellipse cx="1420" cy="370" rx="55" ry="55"/>
  </g>

  <polygon class="depth-mid idle-sway" points="0,560 100,420 190,470 280,400 370,480 470,410 560,490 660,420 760,500 860,430 960,500 1060,420 1160,500 1260,430 1360,500 1460,420 1600,480 1600,600 0,600" fill="url(#hz-peakMid)"/>
  <g clip-path="url(#hz-clipMid)" filter="url(#hz-soft)" fill="#f4f0ec" opacity="0.4">
    <ellipse cx="280" cy="440" rx="45" ry="45"/>
    <ellipse cx="660" cy="460" rx="42" ry="42"/>
    <ellipse cx="1060" cy="460" rx="42" ry="42"/>
    <ellipse cx="1460" cy="460" rx="42" ry="42"/>
  </g>

  <polygon class="depth-near idle-sway" points="0,660 140,560 260,610 380,540 520,620 640,560 760,630 900,550 1040,620 1180,560 1320,620 1460,570 1600,610 1600,900 0,900" fill="url(#hz-peakNear)" opacity="0.96"/>
  <polygon class="depth-near" points="0,720 200,660 460,700 700,650 940,700 1180,660 1420,700 1600,660 1600,900 0,900" fill="#05070c"/>

  <g class="flagline depth-near">
    <path d="M40,388 Q400,330 780,384" stroke="#2a1f14" stroke-width="2" fill="none" opacity=".55"/>
    <g>
      <polygon points="90,386 108,386 99,410" fill="#d9503c"/>
      <polygon points="150,382 168,382 159,406" fill="#eda93a"/>
      <polygon points="215,378 233,378 224,402" fill="#3f7a5c"/>
      <polygon points="285,376 303,376 294,400" fill="#3a6ea5"/>
      <polygon points="355,376 373,376 364,400" fill="#f2ebdd"/>
      <polygon points="430,378 448,378 439,402" fill="#d9503c"/>
      <polygon points="505,382 523,382 514,406" fill="#eda93a"/>
      <polygon points="580,386 598,386 589,410" fill="#3f7a5c"/>
    </g>
  </g>
  <g class="flagline depth-near" style="animation-delay:-2s">
    <path d="M820,384 Q1180,330 1560,390" stroke="#2a1f14" stroke-width="2" fill="none" opacity=".55"/>
    <g>
      <polygon points="860,386 878,386 869,410" fill="#3a6ea5"/>
      <polygon points="925,381 943,381 934,405" fill="#f2ebdd"/>
      <polygon points="995,377 1013,377 1004,401" fill="#d9503c"/>
      <polygon points="1065,376 1083,376 1074,400" fill="#eda93a"/>
      <polygon points="1140,378 1158,378 1149,402" fill="#3f7a5c"/>
      <polygon points="1215,382 1233,382 1224,406" fill="#3a6ea5"/>
      <polygon points="1290,388 1308,388 1299,412" fill="#f2ebdd"/>
    </g>
  </g>

  <g class="depth-near" transform="translate(800,0)">
    <polygon points="-230,900 230,900 210,840 -210,840" fill="#3a2213"/>
    <polygon points="-200,840 200,840 182,790 -182,790" fill="#472a15"/>
    <polygon points="-170,790 170,790 155,745 -155,745" fill="#553017"/>

    <circle class="diya" cx="-190" cy="815" r="6" fill="#ffcf7a"/>
    <circle class="diya" cx="190" cy="815" r="6" fill="#ffcf7a" style="animation-delay:.4s"/>
    <circle class="diya" cx="-160" cy="765" r="5.5" fill="#ffcf7a" style="animation-delay:.8s"/>
    <circle class="diya" cx="160" cy="765" r="5.5" fill="#ffcf7a" style="animation-delay:1.1s"/>

    <path class="smoke" d="M-190,808 Q-196,780 -184,760 Q-174,742 -182,720" stroke="#d8cfc2" stroke-width="2" fill="none" stroke-linecap="round" opacity="0"/>
    <path class="smoke" d="M190,808 Q184,776 198,754 Q206,736 196,714" stroke="#d8cfc2" stroke-width="2" fill="none" stroke-linecap="round" opacity="0" style="animation-delay:1.6s"/>

    <rect x="-150" y="700" width="300" height="60" fill="#5f331b"/>
    <rect x="-150" y="700" width="300" height="10" fill="#78431f"/>

    <ellipse class="door-halo" cx="0" cy="640" rx="120" ry="110" fill="url(#hz-doorHalo)"/>

    <rect x="-115" y="470" width="230" height="235" fill="url(#hz-stoneTier)"/>
    <line x1="-115" y1="540" x2="115" y2="540" stroke="#4f2c17" stroke-width="3" opacity=".35"/>
    <line x1="-115" y1="600" x2="115" y2="600" stroke="#4f2c17" stroke-width="3" opacity=".35"/>
    <line x1="-115" y1="660" x2="115" y2="660" stroke="#4f2c17" stroke-width="3" opacity=".35"/>

    <path d="M-46,705 L-46,610 Q-46,560 0,560 Q46,560 46,610 L46,705 Z" fill="url(#hz-doorGlow)"/>
    <path d="M-46,705 L-46,610 Q-46,560 0,560 Q46,560 46,610 L46,705 Z" fill="none" stroke="#5f3419" stroke-width="7"/>

    <g fill="#eda93a">
      <circle cx="-46" cy="612" r="7"/><circle cx="-32" cy="628" r="7"/><circle cx="-18" cy="638" r="7"/>
      <circle cx="0" cy="641" r="7.5"/>
      <circle cx="18" cy="638" r="7"/><circle cx="32" cy="628" r="7"/><circle cx="46" cy="612" r="7"/>
    </g>

    <g class="god-ray-wrap">
      <g class="god-ray" style="transform-origin:0px 610px">
        <polygon points="-40,610 -140,900 -95,900" fill="url(#hz-ray)"/>
        <polygon points="0,610 -20,900 20,900" fill="url(#hz-ray)"/>
        <polygon points="40,610 95,900 140,900" fill="url(#hz-ray)"/>
      </g>
    </g>

    <polygon points="-115,470 115,470 95,420 -95,420" fill="url(#hz-stoneTier)"/>
    <polygon points="-95,420 95,420 78,378 -78,378" fill="url(#hz-stoneTier)"/>
    <polygon points="-78,378 78,378 62,336 -62,336" fill="url(#hz-stoneTier)"/>
    <polygon points="-62,336 62,336 46,296 -46,296" fill="url(#hz-stoneTier)"/>
    <polygon points="-46,296 46,296 32,258 -32,258" fill="url(#hz-stoneTier)"/>
    <polygon points="-32,258 32,258 18,222 -18,222" fill="url(#hz-stoneTier)"/>
    <polygon points="-18,222 18,222 0,186 -0,186" fill="#c07f4c"/>

    <ellipse cx="0" cy="182" rx="22" ry="9" fill="#d9a441"/>
    <rect x="-5" y="150" width="10" height="34" fill="#d9a441"/>
    <circle cx="0" cy="144" r="9" fill="#eda93a"/>
    <line x1="0" y1="135" x2="0" y2="108" stroke="#d9a441" stroke-width="3"/>
    <polygon points="0,100 -9,116 9,116" fill="#d9a441"/>
  </g>

  <g class="depth-near" fill="#080b13">
    <path d="M-20,900 L-20,560 L4,590 L-8,610 L14,632 L-2,654 L20,676 L4,700 L26,724 L60,900 Z"/>
    <path d="M60,900 L60,600 L84,628 L70,650 L94,670 L78,694 L100,716 L84,740 L106,760 L130,900 Z"/>
    <path d="M1620,900 L1620,550 L1596,582 L1610,604 L1586,626 L1602,650 L1578,672 L1596,696 L1572,720 L1540,900 Z"/>
    <path d="M1540,900 L1540,590 L1516,618 L1532,642 L1506,664 L1524,688 L1498,712 L1516,736 L1492,760 L1470,900 Z"/>
  </g>
</svg>
`;

export default function HeroScene() {
  const hour = useTimeOfDay();
  const { skyGradient, nightAlpha, glowAlpha } = getTimePalette(hour);

  return (
    <div
      className="hero-scene stage"
      style={
        {
          "--night": nightAlpha,
          "--glow": glowAlpha,
        } as React.CSSProperties
      }
    >
      <div className="hero-sky" style={{ background: skyGradient }} aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <StarField />
      <div className="hero-clouds" aria-hidden="true">
        <div className="hero-cloud hero-cloud-1" />
        <div className="hero-cloud hero-cloud-2" />
        <div className="hero-cloud hero-cloud-3" />
      </div>
      <div
        className="hero-mountains"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: MOUNTAIN_SVG }}
      />
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 90 }, (_, i) => {
    const left = (i * 53.7) % 100;
    const top = (i * 29.3) % 62;
    const size = 0.7 + ((i * 7) % 5) * 0.25;
    const delay = (i * 0.37) % 4;
    return { left, top, size, delay };
  });

  return (
    <div className="hero-stars" aria-hidden="true">
      <div className="milky-way" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="star-dot"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

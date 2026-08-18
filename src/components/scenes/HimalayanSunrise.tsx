const SCENE_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3f6fa8"/>
      <stop offset="45%" stop-color="#8fb3d9"/>
      <stop offset="78%" stop-color="#f2c99a"/>
      <stop offset="100%" stop-color="#f8dfae"/>
    </linearGradient>
    <radialGradient id="hs-sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff3d6"/>
      <stop offset="55%" stop-color="#ffcf7a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffcf7a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hs-peakBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c9d6ea"/>
      <stop offset="100%" stop-color="#a8b8d6"/>
    </linearGradient>
    <linearGradient id="hs-peakFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbdcb0"/>
      <stop offset="55%" stop-color="#f0b98a"/>
      <stop offset="100%" stop-color="#d99a78"/>
    </linearGradient>
    <linearGradient id="hs-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.3"/>
      <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1600" height="900" fill="url(#hs-sky)"/>
  <circle cx="800" cy="330" r="230" fill="url(#hs-sun)"/>
  <circle cx="800" cy="330" r="46" fill="#fff6e2"/>

  <g fill="#f4eee0" opacity="0.75">
    <ellipse cx="260" cy="180" rx="70" ry="14"/>
    <ellipse cx="330" cy="195" rx="46" ry="11"/>
    <ellipse cx="1260" cy="150" rx="80" ry="15"/>
    <ellipse cx="1180" cy="168" rx="44" ry="10"/>
  </g>

  <g class="bird" opacity="0.8" fill="none" stroke="#3a3428" stroke-width="3" stroke-linecap="round">
    <path d="M420,240 q14,-14 28,0 q14,-14 28,0"/>
    <path d="M520,270 q11,-11 22,0 q11,-11 22,0"/>
    <path d="M1080,220 q12,-12 24,0 q12,-12 24,0"/>
  </g>

  <polygon points="0,470 120,340 240,440 360,300 500,450 620,350 760,460 900,310 1040,450 1180,340 1320,460 1460,350 1600,450 1600,500 0,500" fill="url(#hs-peakBack)"/>

  <polygon points="-20,560 160,380 320,500 480,360 660,520 840,370 1020,520 1200,380 1380,510 1600,400 1600,600 -20,600" fill="url(#hs-peakFront)"/>
  <polygon points="140,420 160,380 190,430" fill="#fff8ec" opacity="0.9"/>
  <polygon points="450,405 480,360 512,412" fill="#fff8ec" opacity="0.9"/>
  <polygon points="990,415 1020,370 1054,418" fill="#fff8ec" opacity="0.9"/>

  <g fill="#152218">
    <polygon points="-20,900 -20,560 40,590 15,615 70,635 30,665 100,690 55,720 130,750 90,900"/>
    <polygon points="1620,900 1620,540 1550,575 1580,600 1510,625 1548,655 1470,680 1518,712 1430,740 1480,900"/>
    <polygon points="0,700 500,600 1000,660 1600,590 1600,900 0,900"/>
  </g>

  <g transform="translate(300,780)">
    <line x1="0" y1="0" x2="0" y2="-110" stroke="#4a3626" stroke-width="6"/>
    <g class="flagline" style="transform-origin:0px -110px">
      <polygon points="0,-108 34,-100 0,-88" fill="#3a6ea5"/>
      <polygon points="0,-96 30,-89 0,-79" fill="#f2ebdd"/>
      <polygon points="0,-86 26,-80 0,-71" fill="#d9503c"/>
    </g>
  </g>

  <rect x="0" y="0" width="1600" height="900" fill="url(#hs-vignette)"/>
</svg>
`;

export default function HimalayanSunrise() {
  return (
    <div
      className="stage"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SCENE_SVG }}
    />
  );
}

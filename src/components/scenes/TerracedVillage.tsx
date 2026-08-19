const SCENE_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tv-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8fc3e0"/>
      <stop offset="60%" stop-color="#cdeaf0"/>
      <stop offset="100%" stop-color="#f2f8ec"/>
    </linearGradient>
    <linearGradient id="tv-peaks" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a8bcd8"/>
      <stop offset="100%" stop-color="#8fa6c9"/>
    </linearGradient>
    <linearGradient id="tv-terraceA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7fae5c"/>
      <stop offset="100%" stop-color="#5f9247"/>
    </linearGradient>
    <linearGradient id="tv-terraceB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4b459"/>
      <stop offset="100%" stop-color="#b89845"/>
    </linearGradient>
    <linearGradient id="tv-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1600" height="900" fill="url(#tv-sky)"/>

  <g fill="#ffffff" opacity="0.8">
    <ellipse cx="300" cy="140" rx="60" ry="16"/>
    <ellipse cx="360" cy="128" rx="40" ry="12"/>
    <ellipse cx="1300" cy="110" rx="70" ry="17"/>
  </g>

  <polygon points="0,360 150,260 300,340 460,240 620,350 780,250 950,350 1120,260 1300,350 1460,270 1600,340 1600,400 0,400" fill="url(#tv-peaks)"/>

  <g fill="#365a2e">
    <polygon points="0,420 300,340 700,400 1100,330 1600,390 1600,460 0,460"/>
  </g>

  <polygon points="0,900 0,470 260,410 560,480 900,420 1220,490 1600,430 1600,900" fill="url(#tv-terraceA)"/>
  <g stroke="#4f7a3c" stroke-width="4" opacity="0.55" fill="none">
    <path d="M0,560 Q400,500 800,540 T1600,510"/>
    <path d="M0,650 Q420,590 850,630 T1600,600"/>
    <path d="M0,740 Q440,690 880,720 T1600,700"/>
  </g>
  <g fill="url(#tv-terraceB)" opacity="0.55">
    <polygon points="0,560 400,500 800,540 1200,505 1600,510 1600,650 0,650"/>
    <polygon points="0,740 440,690 880,720 1320,690 1600,700 1600,900 0,900"/>
  </g>

  <g class="pine" fill="#264a2c">
    <polygon points="120,560 100,610 140,610"/>
    <polygon points="120,540 96,600 144,600"/>
    <polygon points="1480,520 1458,575 1502,575"/>
    <polygon points="1480,498 1452,565 1508,565"/>
    <polygon points="60,700 40,750 80,750"/>
    <polygon points="60,678 34,742 86,742"/>
  </g>

  <g transform="translate(640,470)">
    <g transform="translate(-80,0)">
      <rect x="-34" y="-2" width="68" height="46" fill="#c9a876"/>
      <polygon points="-42,-2 42,-2 0,-42" fill="#6b6b62"/>
      <rect x="-8" y="20" width="16" height="24" fill="#5a4530"/>
    </g>
    <g transform="translate(10,20)">
      <rect x="-30" y="-2" width="60" height="40" fill="#d8bd8e"/>
      <polygon points="-38,-2 38,-2 0,-36" fill="#7c7c70"/>
      <rect x="-7" y="16" width="14" height="22" fill="#5a4530"/>
    </g>
    <g transform="translate(110,-6)">
      <rect x="-28" y="-2" width="56" height="38" fill="#c9a876"/>
      <polygon points="-36,-2 36,-2 0,-34" fill="#6b6b62"/>
      <rect x="-6" y="14" width="12" height="20" fill="#5a4530"/>
    </g>

    <circle class="chimney-smoke" cx="-80" cy="-44" r="4" fill="#e8e2d6"/>
    <circle class="chimney-smoke" cx="110" cy="-42" r="3.5" fill="#e8e2d6" style="animation-delay:1.4s"/>
  </g>

  <g stroke="#a68a5a" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85">
    <path d="M760,900 Q700,760 780,650 Q840,570 800,500"/>
  </g>
  <g transform="translate(795,560) rotate(-8)">
    <ellipse cx="0" cy="14" rx="13" ry="16" fill="#151010"/>
    <circle cx="0" cy="-6" r="9" fill="#151010"/>
    <rect x="-10" y="-2" width="20" height="22" rx="4" fill="#7a4b2c" transform="translate(0,-18) rotate(6)"/>
  </g>

  <rect x="0" y="0" width="1600" height="900" fill="url(#tv-vignette)"/>
</svg>
`;

export default function TerracedVillage() {
  return (
    <div
      className="stage"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SCENE_SVG }}
    />
  );
}

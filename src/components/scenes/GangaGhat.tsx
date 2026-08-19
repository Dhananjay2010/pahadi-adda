const SCENE_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gg-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#241a3d"/>
      <stop offset="45%" stop-color="#5a3a55"/>
      <stop offset="75%" stop-color="#c96f52"/>
      <stop offset="100%" stop-color="#f0a25c"/>
    </linearGradient>
    <linearGradient id="gg-river" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0a25c"/>
      <stop offset="30%" stop-color="#8a5a6a"/>
      <stop offset="100%" stop-color="#241a30"/>
    </linearGradient>
    <linearGradient id="gg-hills" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2a48"/>
      <stop offset="100%" stop-color="#241a30"/>
    </linearGradient>
    <radialGradient id="gg-diya" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffdf9e" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ffdf9e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gg-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.3"/>
      <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1600" height="900" fill="url(#gg-sky)"/>
  <circle cx="1160" cy="290" r="8" fill="#fdf6e3" opacity="0.8"/>
  <circle cx="1260" cy="230" r="6" fill="#fdf6e3" opacity="0.6"/>
  <circle cx="300" cy="200" r="7" fill="#fdf6e3" opacity="0.7"/>

  <g class="bird" fill="none" stroke="#2a1e28" stroke-width="3" stroke-linecap="round" opacity="0.85">
    <path d="M980,220 q13,-13 26,0 q13,-13 26,0"/>
    <path d="M1080,250 q10,-10 20,0 q10,-10 20,0"/>
  </g>

  <polygon points="0,380 200,300 420,360 640,290 900,370 1100,300 1320,370 1600,310 1600,420 0,420" fill="url(#gg-hills)"/>

  <g stroke="#1c1420" stroke-width="7" fill="none" opacity="0.8">
    <path d="M120,330 Q800,180 1480,340"/>
  </g>
  <g stroke="#1c1420" stroke-width="4" opacity="0.7">
    <line x1="220" y1="335" x2="220" y2="300"/>
    <line x1="420" y1="290" x2="420" y2="255"/>
    <line x1="620" y1="255" x2="620" y2="220"/>
    <line x1="820" y1="240" x2="820" y2="205"/>
    <line x1="1020" y1="255" x2="1020" y2="220"/>
    <line x1="1220" y1="290" x2="1220" y2="255"/>
    <line x1="1400" y1="330" x2="1400" y2="298"/>
  </g>

  <g transform="translate(1180,420)">
    <polygon points="-40,120 40,120 34,90 -34,90" fill="#3a2a30"/>
    <polygon points="-34,90 34,90 27,60 -27,60" fill="#3a2a30"/>
    <polygon points="-27,60 27,60 20,32 -20,32" fill="#3a2a30"/>
    <polygon points="-20,32 20,32 12,8 -12,8" fill="#3a2a30"/>
    <polygon points="-12,8 12,8 0,-16 -0,-16" fill="#241a24"/>
  </g>

  <rect x="0" y="420" width="1600" height="480" fill="url(#gg-river)"/>
  <ellipse class="shimmer" cx="800" cy="500" rx="420" ry="60" fill="#f0c48a" opacity="0.18"/>
  <g stroke="#f0c48a" stroke-width="2" opacity="0.25">
    <line x1="0" y1="470" x2="1600" y2="470"/>
    <line x1="0" y1="520" x2="1600" y2="520"/>
    <line x1="0" y1="580" x2="1600" y2="580"/>
    <line x1="0" y1="650" x2="1600" y2="650"/>
  </g>

  <polygon points="0,900 0,540 240,500 500,560 780,510 1040,565 1320,515 1600,545 1600,900" fill="#1c1420"/>
  <g stroke="#120d16" stroke-width="4" opacity="0.6">
    <line x1="160" y1="900" x2="160" y2="560"/>
    <line x1="330" y1="900" x2="330" y2="530"/>
    <line x1="500" y1="900" x2="500" y2="560"/>
    <line x1="700" y1="900" x2="700" y2="535"/>
    <line x1="900" y1="900" x2="900" y2="555"/>
    <line x1="1100" y1="900" x2="1100" y2="530"/>
    <line x1="1300" y1="900" x2="1300" y2="550"/>
    <line x1="1470" y1="900" x2="1470" y2="535"/>
  </g>

  <g class="diya">
    <circle cx="260" cy="620" r="16" fill="url(#gg-diya)"/>
    <circle cx="260" cy="620" r="4.5" fill="#ffd27a"/>
  </g>
  <g class="diya" style="animation-delay:.5s">
    <circle cx="420" cy="660" r="14" fill="url(#gg-diya)"/>
    <circle cx="420" cy="660" r="4" fill="#ffd27a"/>
  </g>
  <g class="diya" style="animation-delay:.9s">
    <circle cx="640" cy="600" r="17" fill="url(#gg-diya)"/>
    <circle cx="640" cy="600" r="4.5" fill="#ffd27a"/>
  </g>
  <g class="diya" style="animation-delay:1.3s">
    <circle cx="900" cy="650" r="15" fill="url(#gg-diya)"/>
    <circle cx="900" cy="650" r="4" fill="#ffd27a"/>
  </g>
  <g class="diya" style="animation-delay:.2s">
    <circle cx="1120" cy="605" r="16" fill="url(#gg-diya)"/>
    <circle cx="1120" cy="605" r="4.5" fill="#ffd27a"/>
  </g>

  <circle class="ripple" cx="260" cy="620" style="animation-delay:0s"/>
  <circle class="ripple" cx="420" cy="660" style="animation-delay:1.1s"/>
  <circle class="ripple" cx="640" cy="600" style="animation-delay:2.2s"/>
  <circle class="ripple" cx="900" cy="650" style="animation-delay:.6s"/>
  <circle class="ripple" cx="1120" cy="605" style="animation-delay:1.8s"/>

  <rect x="0" y="0" width="1600" height="900" fill="url(#gg-vignette)"/>
</svg>
`;

export default function GangaGhat() {
  return (
    <div
      className="stage"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SCENE_SVG }}
    />
  );
}

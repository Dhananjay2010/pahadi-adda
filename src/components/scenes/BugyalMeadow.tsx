const SCENE_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bm-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4d8fc9"/>
      <stop offset="60%" stop-color="#a9d3ec"/>
      <stop offset="100%" stop-color="#eaf6f2"/>
    </linearGradient>
    <linearGradient id="bm-peaks" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c9d9ea"/>
    </linearGradient>
    <linearGradient id="bm-meadowFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8fb96a"/>
      <stop offset="100%" stop-color="#6fa14e"/>
    </linearGradient>
    <linearGradient id="bm-meadowNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6fa84f"/>
      <stop offset="100%" stop-color="#4c8438"/>
    </linearGradient>
    <linearGradient id="bm-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="74%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.38"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1600" height="900" fill="url(#bm-sky)"/>
  <g fill="#ffffff" opacity="0.85">
    <ellipse cx="240" cy="150" rx="66" ry="16"/>
    <ellipse cx="310" cy="136" rx="42" ry="11"/>
    <ellipse cx="1340" cy="120" rx="72" ry="16"/>
    <ellipse cx="1270" cy="140" rx="40" ry="10"/>
  </g>

  <polygon points="0,340 160,220 340,320 540,200 760,330 980,210 1220,330 1440,230 1600,320 1600,400 0,400" fill="url(#bm-peaks)"/>
  <polygon points="120,240 160,220 195,250" fill="#eef4fb"/>
  <polygon points="700,220 760,330 620,320" fill="#dfe9f5" opacity="0.6"/>

  <polygon points="0,900 0,400 300,360 620,420 940,370 1260,430 1600,380 1600,900" fill="url(#bm-meadowFar)"/>
  <polygon points="0,900 0,560 260,520 560,590 900,540 1220,600 1600,560 1600,900" fill="url(#bm-meadowNear)"/>

  <g stroke="#3f6d34" stroke-width="3" opacity="0.4" fill="none">
    <path d="M0,650 Q400,600 800,640 T1600,610"/>
    <path d="M0,760 Q420,710 850,745 T1600,720"/>
  </g>

  ${Array.from({ length: 14 })
    .map((_, i) => {
      const cx = 60 + i * 112 + (i % 3) * 24;
      const cy = 560 + (i % 4) * 65;
      return `<g transform="translate(${cx},${cy})">
        <ellipse cx="-6" cy="4" rx="9" ry="5" fill="#3a6b2c"/>
        <ellipse cx="7" cy="6" rx="9" ry="5" fill="#3a6b2c"/>
        <circle cx="-8" cy="-4" r="6" fill="#d95f7a"/>
        <circle cx="2" cy="-9" r="6" fill="#e46f8a"/>
        <circle cx="10" cy="-3" r="6" fill="#d95f7a"/>
        <circle cx="0" cy="-2" r="4" fill="#f2a4b8"/>
      </g>`;
    })
    .join("")}

  <g fill="#1c1a16" opacity="0.9">
    <g transform="translate(420,760)">
      <ellipse cx="0" cy="8" rx="22" ry="12"/>
      <circle cx="16" cy="-2" r="9"/>
    </g>
    <g transform="translate(480,790)">
      <ellipse cx="0" cy="7" rx="18" ry="10"/>
      <circle cx="14" cy="-2" r="7.5"/>
    </g>
    <g transform="translate(1080,740)">
      <ellipse cx="0" cy="8" rx="20" ry="11"/>
      <circle cx="-15" cy="-2" r="8"/>
    </g>
  </g>

  <g stroke="#6b5230" stroke-width="5" stroke-linecap="round">
    <line x1="180" y1="900" x2="180" y2="800"/>
    <line x1="230" y1="900" x2="230" y2="795"/>
  </g>
  <line x1="180" y1="800" x2="230" y2="795" stroke="#6b5230" stroke-width="4"/>

  <rect x="0" y="0" width="1600" height="900" fill="url(#bm-vignette)"/>
</svg>
`;

export default function BugyalMeadow() {
  return (
    <div
      className="stage"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SCENE_SVG }}
    />
  );
}

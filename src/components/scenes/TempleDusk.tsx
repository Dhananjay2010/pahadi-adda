const SCENE_SVG = `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="td-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e1530"/>
      <stop offset="45%" stop-color="#3a2a4d"/>
      <stop offset="78%" stop-color="#8a4a4f"/>
      <stop offset="100%" stop-color="#d9793f"/>
    </linearGradient>
    <linearGradient id="td-peakFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8926a"/>
      <stop offset="35%" stop-color="#c9cfe4"/>
      <stop offset="100%" stop-color="#9aa3c4"/>
    </linearGradient>
    <linearGradient id="td-doorGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd699"/>
      <stop offset="100%" stop-color="#ff9a3d"/>
    </linearGradient>
    <radialGradient id="td-doorHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb84d" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#ffb84d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="td-stoneTier" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c07f4c"/>
      <stop offset="100%" stop-color="#93582f"/>
    </linearGradient>
    <linearGradient id="td-vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="18%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1600" height="900" fill="url(#td-sky)"/>

  <g fill="#fdf6e3">
    <circle class="star" cx="120" cy="90" r="1.6" style="animation-delay:.2s"/>
    <circle class="star" cx="260" cy="60" r="1.2" style="animation-delay:1.1s"/>
    <circle class="star" cx="400" cy="130" r="1.7" style="animation-delay:.6s"/>
    <circle class="star" cx="540" cy="70" r="1.1" style="animation-delay:1.8s"/>
    <circle class="star" cx="700" cy="110" r="1.4" style="animation-delay:.3s"/>
    <circle class="star" cx="900" cy="80" r="1.3" style="animation-delay:1.4s"/>
    <circle class="star" cx="1080" cy="130" r="1.6" style="animation-delay:.9s"/>
    <circle class="star" cx="1220" cy="65" r="1.2" style="animation-delay:2s"/>
    <circle class="star" cx="1360" cy="115" r="1.5" style="animation-delay:.5s"/>
    <circle class="star" cx="1480" cy="75" r="1.3" style="animation-delay:1.6s"/>
    <circle class="star" cx="60" cy="180" r="1.1" style="animation-delay:1s"/>
    <circle class="star" cx="1540" cy="190" r="1.4" style="animation-delay:.7s"/>
  </g>
  <circle cx="1300" cy="140" r="34" fill="#f5ecd9"/>
  <circle cx="1314" cy="130" r="30" fill="#0e1530" opacity="0.92"/>

  <polygon points="0,430 140,300 260,400 380,260 520,410 640,320 760,420 900,270 1040,410 1180,300 1320,420 1460,310 1600,410 1600,470 0,470" fill="url(#td-peakFar)" opacity="0.9"/>

  <polygon points="0,520 180,410 340,480 500,390 680,470 860,400 1040,480 1220,400 1400,470 1600,410 1600,560 0,560" fill="#213725"/>
  <polygon points="0,570 220,480 460,540 700,460 940,540 1180,470 1420,540 1600,480 1600,620 0,620" fill="#162419"/>

  <g class="flagline">
    <path d="M40,210 Q400,150 780,205" stroke="#3a2a1c" stroke-width="2" fill="none" opacity=".6"/>
    <g>
      <polygon points="90,208 108,208 99,234" fill="#d9503c"/>
      <polygon points="150,203 168,203 159,229" fill="#eda93a"/>
      <polygon points="215,199 233,199 224,225" fill="#3f7a5c"/>
      <polygon points="285,197 303,197 294,223" fill="#3a6ea5"/>
      <polygon points="355,197 373,197 364,223" fill="#f2ebdd"/>
      <polygon points="430,199 448,199 439,225" fill="#d9503c"/>
      <polygon points="505,203 523,203 514,229" fill="#eda93a"/>
      <polygon points="580,208 598,208 589,234" fill="#3f7a5c"/>
      <polygon points="655,214 673,214 664,240" fill="#3a6ea5"/>
      <polygon points="720,203 738,203 729,229" fill="#f2ebdd"/>
    </g>
  </g>
  <g class="flagline" style="animation-delay:-2s">
    <path d="M820,205 Q1180,150 1560,212" stroke="#3a2a1c" stroke-width="2" fill="none" opacity=".6"/>
    <g>
      <polygon points="860,208 878,208 869,234" fill="#3a6ea5"/>
      <polygon points="925,202 943,202 934,228" fill="#f2ebdd"/>
      <polygon points="995,198 1013,198 1004,224" fill="#d9503c"/>
      <polygon points="1065,197 1083,197 1074,223" fill="#eda93a"/>
      <polygon points="1140,199 1158,199 1149,225" fill="#3f7a5c"/>
      <polygon points="1215,203 1233,203 1224,229" fill="#3a6ea5"/>
      <polygon points="1290,209 1308,209 1299,235" fill="#f2ebdd"/>
      <polygon points="1365,215 1383,215 1374,241" fill="#d9503c"/>
      <polygon points="1440,209 1458,209 1449,235" fill="#eda93a"/>
      <polygon points="1505,203 1523,203 1514,229" fill="#3f7a5c"/>
    </g>
  </g>

  <g fill="#0e1a12">
    <polygon points="-20,900 -20,300 30,340 10,380 60,400 30,440 90,470 40,520 100,560 60,900"/>
    <polygon points="1620,900 1620,280 1560,325 1585,365 1525,390 1555,435 1490,465 1545,510 1480,555 1530,900"/>
    <polygon points="110,900 110,470 150,500 132,525 168,545 145,575 190,600 160,900"/>
    <polygon points="1420,900 1420,460 1470,495 1448,518 1488,540 1462,568 1510,595 1470,900"/>
  </g>

  <g transform="translate(800,0)">
    <polygon points="-230,900 230,900 210,840 -210,840" fill="#4f2c17"/>
    <polygon points="-200,840 200,840 182,790 -182,790" fill="#5f3419"/>
    <polygon points="-170,790 170,790 155,745 -155,745" fill="#6f3d1c"/>

    <circle class="diya" cx="-190" cy="815" r="6" fill="#ffcf7a"/>
    <circle class="diya" cx="190" cy="815" r="6" fill="#ffcf7a" style="animation-delay:.4s"/>
    <circle class="diya" cx="-160" cy="765" r="5.5" fill="#ffcf7a" style="animation-delay:.8s"/>
    <circle class="diya" cx="160" cy="765" r="5.5" fill="#ffcf7a" style="animation-delay:1.1s"/>

    <rect x="-150" y="700" width="300" height="60" fill="#7a4423"/>
    <rect x="-150" y="700" width="300" height="10" fill="#93582f"/>

    <ellipse cx="0" cy="640" rx="120" ry="110" fill="url(#td-doorHalo)"/>

    <rect x="-115" y="470" width="230" height="235" fill="url(#td-stoneTier)"/>
    <rect x="-115" y="470" width="230" height="10" fill="#4f2c17" opacity=".5"/>
    <line x1="-115" y1="540" x2="115" y2="540" stroke="#4f2c17" stroke-width="3" opacity=".35"/>
    <line x1="-115" y1="600" x2="115" y2="600" stroke="#4f2c17" stroke-width="3" opacity=".35"/>
    <line x1="-115" y1="660" x2="115" y2="660" stroke="#4f2c17" stroke-width="3" opacity=".35"/>

    <path d="M-46,705 L-46,610 Q-46,560 0,560 Q46,560 46,610 L46,705 Z" fill="url(#td-doorGlow)"/>
    <path d="M-46,705 L-46,610 Q-46,560 0,560 Q46,560 46,610 L46,705 Z" fill="none" stroke="#5f3419" stroke-width="7"/>

    <g fill="#eda93a">
      <circle cx="-46" cy="612" r="7"/><circle cx="-32" cy="628" r="7"/><circle cx="-18" cy="638" r="7"/>
      <circle cx="0" cy="641" r="7.5"/>
      <circle cx="18" cy="638" r="7"/><circle cx="32" cy="628" r="7"/><circle cx="46" cy="612" r="7"/>
    </g>
    <g fill="#c96a2f">
      <circle cx="-39" cy="620" r="2.6"/><circle cx="-25" cy="633" r="2.6"/><circle cx="-9" cy="640" r="2.6"/>
      <circle cx="9" cy="640" r="2.6"/><circle cx="25" cy="633" r="2.6"/><circle cx="39" cy="620" r="2.6"/>
    </g>

    <polygon points="-115,470 115,470 95,420 -95,420" fill="url(#td-stoneTier)"/>
    <polygon points="-95,420 95,420 78,378 -78,378" fill="url(#td-stoneTier)"/>
    <polygon points="-78,378 78,378 62,336 -62,336" fill="url(#td-stoneTier)"/>
    <polygon points="-62,336 62,336 46,296 -46,296" fill="url(#td-stoneTier)"/>
    <polygon points="-46,296 46,296 32,258 -32,258" fill="url(#td-stoneTier)"/>
    <polygon points="-32,258 32,258 18,222 -18,222" fill="url(#td-stoneTier)"/>
    <polygon points="-18,222 18,222 0,186 -0,186" fill="#c07f4c"/>

    <g stroke="#4f2c17" stroke-width="2" opacity=".3">
      <line x1="-95" y1="420" x2="95" y2="420"/>
      <line x1="-78" y1="378" x2="78" y2="378"/>
      <line x1="-62" y1="336" x2="62" y2="336"/>
      <line x1="-46" y1="296" x2="46" y2="296"/>
      <line x1="-32" y1="258" x2="32" y2="258"/>
    </g>

    <ellipse cx="0" cy="182" rx="22" ry="9" fill="#d9a441"/>
    <rect x="-5" y="150" width="10" height="34" fill="#d9a441"/>
    <circle cx="0" cy="144" r="9" fill="#eda93a"/>
    <line x1="0" y1="135" x2="0" y2="108" stroke="#d9a441" stroke-width="3"/>
    <polygon points="0,100 -9,116 9,116" fill="#d9a441"/>

    <line x1="96" y1="640" x2="96" y2="680" stroke="#5f3419" stroke-width="4"/>
    <path d="M84,680 Q84,700 96,704 Q108,700 108,680 Z" fill="#d9a441"/>
    <circle cx="96" cy="706" r="2.5" fill="#8a5b1f"/>

    <g transform="translate(-165,795) rotate(-8)">
      <rect x="-22" y="-14" width="44" height="26" rx="8" fill="#6b4226"/>
      <rect x="-22" y="-14" width="8" height="26" rx="3" fill="#4a2c19"/>
      <rect x="14" y="-14" width="8" height="26" rx="3" fill="#4a2c19"/>
      <line x1="-14" y1="-10" x2="10" y2="8" stroke="#c9a26a" stroke-width="1.3" opacity=".7"/>
      <line x1="-10" y1="-12" x2="14" y2="6" stroke="#c9a26a" stroke-width="1.3" opacity=".7"/>
    </g>
    <g transform="translate(165,795) rotate(8)">
      <ellipse cx="0" cy="0" rx="20" ry="13" fill="#4a2c19"/>
      <ellipse cx="0" cy="-4" rx="18" ry="9" fill="#c9a26a"/>
    </g>

    <g fill="#100a08">
      <path d="M-260,900 L-260,820 Q-260,798 -240,798 Q-220,798 -220,820 L-220,900 Z"/>
      <circle cx="-240" cy="784" r="14"/>
      <path d="M240,900 L240,815 Q240,792 262,792 Q284,792 284,815 L284,900 Z"/>
      <circle cx="262" cy="778" r="14"/>
      <ellipse cx="292" cy="770" rx="16" ry="12" fill="#100a08"/>
    </g>
  </g>

  <rect x="0" y="0" width="1600" height="900" fill="url(#td-vignette)"/>
</svg>
`;

export default function TempleDusk() {
  return (
    <div
      className="stage"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SCENE_SVG }}
    />
  );
}

/**
 * Reboque: Cegonha (car_transporter) — vista lateral.
 * Gerado a partir de docs/design/trailers/car_transporter.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'car_transporter',
  label: "Cegonha",
  axles: [{"refX":300,"refY":362,"scale":0.76},{"refX":200,"refY":362,"scale":0.76},{"refX":100,"refY":362,"scale":0.76}],
  Defs: ({ u }) => (
    <>

    
    <pattern id={u("tr-mesh")} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 8 8M8 0 0 8" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="1" fill="none" /></pattern>
  
    </>
  ),
  Body: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    void tailStyle;
    return (
      <>

  
  
  
  
  
  
      <g data-part="trailer-chassis">
        <path d="M 1390 255 L 1080 255 L 1050 325 L 360 325 L 340 286 L 40 286 L 40 306 L 330 306 L 350 345 L 1060 345 L 1090 280 L 1390 280 Z" className="t-chassis t-out" />
      </g>
      <rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="280" width="12" height="50" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g>
      <g data-part="upper-deck">
        <rect x="1380" y="150" width="8" height="105" className="t-metal-dk" /><rect x="1116" y="150" width="8" height="105" className="t-metal-dk" /><rect x="856" y="150" width="8" height="175" className="t-metal-dk" /><rect x="596" y="150" width="8" height="175" className="t-metal-dk" /><rect x="356" y="150" width="8" height="175" className="t-metal-dk" />
        <rect x="360" y="150" width="1036" height="12" className="t-metal-dk" />
        <path d="M 360 156 H 1396" stroke="#000" strokeOpacity=".4" strokeDasharray="10 6" />
        <line x1="1120" y1="250" x2="1000" y2="162" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="5" />
        <line x1="600" y1="320" x2="700" y2="162" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="5" />
      </g>
      <g data-part="cargo">
        <g transform="rotate(0 1220 150)">
          <path d="M 1066.4 138.0 L 1060.0 110.0 Q 1060.0 94.0 1076.0 92.0 L 1130.4 88.0 L 1162.4 46.0 Q 1168.8 40.0 1188.0 40.0 L 1252.0 40.0 Q 1264.8 40.0 1274.4 46.0 L 1309.6 84.0 L 1370.4 92.0 Q 1380.0 94.0 1380.0 106.0 L 1376.8 138.0 Z" fill="#8b1e1e" />
          <path d="M 1143.2 86.0 L 1168.8 50.0 L 1213.6 48.0 L 1213.6 86.0 Z M 1220.0 86.0 L 1220.0 48.0 L 1258.4 48.0 L 1296.8 84.0 Z" className="t-glass" />
          <path d="M 1066.4 120.0 L 1376.8 120.0" stroke="#000" strokeOpacity=".25" />
          <rect x="1069.6" y="110" width="300.79999999999995" height="10" className="t-hi" opacity=".08" />
          <circle cx="1124" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="1124" cy="121.2" r="15.84" className="t-metal-lt" />
          <circle cx="1316" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="1316" cy="121.2" r="15.84" className="t-metal-lt" />
          <rect x="1374" y="102" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g><g transform="rotate(0 880 150)">
          <path d="M 726.4 138.0 L 720.0 110.0 Q 720.0 94.0 736.0 92.0 L 790.4 88.0 L 822.4 46.0 Q 828.8 40.0 848.0 40.0 L 912.0 40.0 Q 924.8 40.0 934.4 46.0 L 969.6 84.0 L 1030.4 92.0 Q 1040.0 94.0 1040.0 106.0 L 1036.8 138.0 Z" fill="#d6d6d2" />
          <path d="M 803.2 86.0 L 828.8 50.0 L 873.6 48.0 L 873.6 86.0 Z M 880.0 86.0 L 880.0 48.0 L 918.4 48.0 L 956.8 84.0 Z" className="t-glass" />
          <path d="M 726.4 120.0 L 1036.8 120.0" stroke="#000" strokeOpacity=".25" />
          <rect x="729.6" y="110" width="300.79999999999995" height="10" className="t-hi" opacity=".08" />
          <circle cx="784" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="784" cy="121.2" r="15.84" className="t-metal-lt" />
          <circle cx="976" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="976" cy="121.2" r="15.84" className="t-metal-lt" />
          <rect x="1034" y="102" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g><g transform="rotate(0 540 150)">
          <path d="M 386.4 138.0 L 380.0 110.0 Q 380.0 94.0 396.0 92.0 L 450.4 88.0 L 482.4 46.0 Q 488.8 40.0 508.0 40.0 L 572.0 40.0 Q 584.8 40.0 594.4 46.0 L 629.6 84.0 L 690.4 92.0 Q 700.0 94.0 700.0 106.0 L 696.8 138.0 Z" fill="#1f2f4a" />
          <path d="M 463.2 86.0 L 488.8 50.0 L 533.6 48.0 L 533.6 86.0 Z M 540.0 86.0 L 540.0 48.0 L 578.4 48.0 L 616.8 84.0 Z" className="t-glass" />
          <path d="M 386.4 120.0 L 696.8 120.0" stroke="#000" strokeOpacity=".25" />
          <rect x="389.6" y="110" width="300.79999999999995" height="10" className="t-hi" opacity=".08" />
          <circle cx="444" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="444" cy="121.2" r="15.84" className="t-metal-lt" />
          <circle cx="636" cy="121.2" r="28.799999999999997" className="t-rubber" /><circle cx="636" cy="121.2" r="15.84" className="t-metal-lt" />
          <rect x="694" y="102" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g>
        <g transform="rotate(0 870 325)">
          <path d="M 706.8 313.0 L 700.0 285.0 Q 700.0 269.0 717.0 267.0 L 774.8 263.0 L 808.8 221.0 Q 815.6 215.0 836.0 215.0 L 904.0 215.0 Q 917.6 215.0 927.8 221.0 L 965.2 259.0 L 1029.8 267.0 Q 1040.0 269.0 1040.0 281.0 L 1036.6 313.0 Z" fill="#3a3a3a" />
          <path d="M 788.4 261.0 L 815.6 225.0 L 863.2 223.0 L 863.2 261.0 Z M 870.0 261.0 L 870.0 223.0 L 910.8 223.0 L 951.6 259.0 Z" className="t-glass" />
          <path d="M 706.8 295.0 L 1036.6 295.0" stroke="#000" strokeOpacity=".25" />
          <rect x="710.2" y="285" width="319.59999999999997" height="10" className="t-hi" opacity=".08" />
          <circle cx="768" cy="295" r="30" className="t-rubber" /><circle cx="768" cy="295" r="16.5" className="t-metal-lt" />
          <circle cx="972" cy="295" r="30" className="t-rubber" /><circle cx="972" cy="295" r="16.5" className="t-metal-lt" />
          <rect x="1034" y="277" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g><g transform="rotate(0 535 325)">
          <path d="M 386.2 313.0 L 380.0 285.0 Q 380.0 269.0 395.5 267.0 L 448.2 263.0 L 479.2 221.0 Q 485.4 215.0 504.0 215.0 L 566.0 215.0 Q 578.4 215.0 587.7 221.0 L 621.8 259.0 L 680.7 267.0 Q 690.0 269.0 690.0 281.0 L 686.9 313.0 Z" fill="#b9b3a6" />
          <path d="M 460.6 261.0 L 485.4 225.0 L 528.8 223.0 L 528.8 261.0 Z M 535.0 261.0 L 535.0 223.0 L 572.2 223.0 L 609.4 259.0 Z" className="t-glass" />
          <path d="M 386.2 295.0 L 686.9 295.0" stroke="#000" strokeOpacity=".25" />
          <rect x="389.3" y="285" width="291.4" height="10" className="t-hi" opacity=".08" />
          <circle cx="442" cy="297.1" r="27.9" className="t-rubber" /><circle cx="442" cy="297.1" r="15.345" className="t-metal-lt" />
          <circle cx="628" cy="297.1" r="27.9" className="t-rubber" /><circle cx="628" cy="297.1" r="15.345" className="t-metal-lt" />
          <rect x="684" y="277" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g><g transform="rotate(0 200 286)">
          <path d="M 61.8 274.0 L 56.0 246.0 Q 56.0 230.0 70.4 228.0 L 119.4 224.0 L 148.2 182.0 Q 153.9 176.0 171.2 176.0 L 228.8 176.0 Q 240.3 176.0 249.0 182.0 L 280.6 220.0 L 335.4 228.0 Q 344.0 230.0 344.0 242.0 L 341.1 274.0 Z" fill="#2d4d3a" />
          <path d="M 130.9 222.0 L 153.9 186.0 L 194.2 184.0 L 194.2 222.0 Z M 200.0 222.0 L 200.0 184.0 L 234.6 184.0 L 269.1 220.0 Z" className="t-glass" />
          <path d="M 61.8 256.0 L 341.1 256.0" stroke="#000" strokeOpacity=".25" />
          <rect x="64.64" y="246" width="270.71999999999997" height="10" className="t-hi" opacity=".08" />
          <circle cx="113.6" cy="260.08" r="25.919999999999998" className="t-rubber" /><circle cx="113.6" cy="260.08" r="14.256" className="t-metal-lt" />
          <circle cx="286.4" cy="260.08" r="25.919999999999998" className="t-rubber" /><circle cx="286.4" cy="260.08" r="14.256" className="t-metal-lt" />
          <rect x="338" y="238" width="6" height="6" className="t-lit-white" opacity=".6" />
        </g>
      </g>
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="936" y="332" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="936" y="332" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="696" y="332" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="696" y="332" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="456" y="332" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="456" y="332" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="1246" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1246" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
    <rect x="38" y="290" width="14" height="32" rx="1" className="t-plastic" />
    <rect x="40" y="292" width="10" height="6" className="t-lens-amber" /><rect x="40" y="292" width="10" height="6" className={lit("t-lit-amber", L.blinkerLeftOn)} data-lamp="blinker-left-rear" />
    <rect x="40" y="299" width="10" height="6" className="t-lens-red" /><rect x="40" y="299" width="10" height="6" className={lit("t-lit-red", L.parking || L.brake)} style={tailStyle} data-lamp="tail" />
    <rect x="40" y="306" width="10" height="6" className="t-lens-red" /><rect x="40" y="306" width="10" height="6" className={lit("t-lit-red", L.brake)} data-lamp="brake" />
    <rect x="40" y="313" width="10" height="6" className="t-lens-clear" /><rect x="40" y="313" width="10" height="6" className={lit("t-lit-white", L.reverse)} data-lamp="reverse" />
    
  </g>
  <g data-part="underrun"><rect x="54" y="290" width="5" height="54" className="t-metal-dk" /><rect x="38" y="338" width="22" height="12" className="t-metal-dk" /></g>

      </>
    );
  },
  Axle: [
    () => (
      <>

      <ellipse cx="300" cy="400" rx="34.96" ry="3" className="t-ink" opacity=".5" />
      <rect x="250" y="306" width="12" height="16" className="t-chassis t-out" /><line x1="256" y1="318" x2="300" y2="362" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="316" y="306" width="22" height="34" rx="5" className="t-rubber" />
      <TrWheel transform="translate(300 362) scale(0.76)" />
      <path d="M 254 356 A 46 46 0 0 1 346 356 L 341 356 A 41 41 0 0 0 259 356 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="200" cy="400" rx="34.96" ry="3" className="t-ink" opacity=".5" />
      <rect x="150" y="306" width="12" height="16" className="t-chassis t-out" /><line x1="156" y1="318" x2="200" y2="362" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="216" y="306" width="22" height="34" rx="5" className="t-rubber" />
      <TrWheel transform="translate(200 362) scale(0.76)" />
      <path d="M 154 356 A 46 46 0 0 1 246 356 L 241 356 A 41 41 0 0 0 159 356 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="100" cy="400" rx="34.96" ry="3" className="t-ink" opacity=".5" />
      <rect x="50" y="306" width="12" height="16" className="t-chassis t-out" /><line x1="56" y1="318" x2="100" y2="362" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="116" y="306" width="22" height="34" rx="5" className="t-rubber" />
      <TrWheel transform="translate(100 362) scale(0.76)" />
      <path d="M 54 356 A 46 46 0 0 1 146 356 L 141 356 A 41 41 0 0 0 59 356 Z" className="t-plastic" />
    
      </>
    ),
  ],
};
void TrWheel;
void lit;
export default drawing;

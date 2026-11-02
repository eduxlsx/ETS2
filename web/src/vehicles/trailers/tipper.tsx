/**
 * Reboque: Basculante (tipper) — vista lateral.
 * Gerado a partir de docs/design/trailers/tipper.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'tipper',
  label: "Basculante",
  axles: [{"refX":457,"refY":350,"scale":1},{"refX":326,"refY":350,"scale":1},{"refX":195,"refY":350,"scale":1}],
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
    <path d="M 1390 255 L 45 255 L 45 285 L 520 285 L 560 300 L 1060 300 L 1100 270 L 1390 270 Z" className="t-chassis t-out" />
    <line x1="45" y1="255.5" x2="1390" y2="255.5" className="t-seam-hi" strokeOpacity=".1" />
    <circle cx="1220" cy="263" r="1.6" className="t-ink" opacity=".6" /><circle cx="980" cy="263" r="1.6" className="t-ink" opacity=".6" /><circle cx="740" cy="263" r="1.6" className="t-ink" opacity=".6" /><circle cx="460" cy="263" r="1.6" className="t-ink" opacity=".6" /><circle cx="180" cy="263" r="1.6" className="t-ink" opacity=".6" />
  </g><rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="270" width="12" height="60" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g><g data-part="side-guard"><rect x="1038" y="300" width="4" height="34" className="t-metal-dk" /><rect x="798" y="300" width="4" height="34" className="t-metal-dk" /><rect x="558" y="300" width="4" height="34" className="t-metal-dk" />
    <rect x="560" y="310" width="480" height="5" className="t-metal" /><rect x="560" y="326" width="480" height="5" className="t-metal" /></g>
      <g data-part="hoist"><rect x="1352" y="40" width="16" height="70" className="t-metal-lt" /><rect x="1354" y="110" width="12" height="70" className="t-metal" /><rect x="1356" y="180" width="8" height="74" className="t-metal-dk" /></g>
      <path d="M 70 18 L 1336 18 L 1344 28 L 1344 196 Q 1344 246 1294 248 L 120 248 Q 74 248 70 210 Z" className="tr-body" />
      <rect x="70" y="18" width="1274" height="14" className="t-metal-dk" />
      <rect x="70" y="32" width="1274" height="20" className="t-hi" opacity=".1" />
      <path d="M 70 190 L 1344 190 L 1344 196 Q 1344 246 1294 248 L 120 248 Q 74 248 70 210 Z" className="t-shade" />
      <line x1="260" y1="32" x2="260" y2="246" className="t-seam" strokeOpacity=".25" /><line x1="263" y1="32" x2="263" y2="246" className="t-seam-hi" /><line x1="470" y1="32" x2="470" y2="246" className="t-seam" strokeOpacity=".25" /><line x1="473" y1="32" x2="473" y2="246" className="t-seam-hi" /><line x1="680" y1="32" x2="680" y2="246" className="t-seam" strokeOpacity=".25" /><line x1="683" y1="32" x2="683" y2="246" className="t-seam-hi" /><line x1="890" y1="32" x2="890" y2="246" className="t-seam" strokeOpacity=".25" /><line x1="893" y1="32" x2="893" y2="246" className="t-seam-hi" /><line x1="1100" y1="32" x2="1100" y2="246" className="t-seam" strokeOpacity=".25" /><line x1="1103" y1="32" x2="1103" y2="246" className="t-seam-hi" />
      <rect x="80" y="8" width="1254" height="10" rx="5" className="t-plastic" />
      <path d="M 1336 18 L 1384 6 L 1384 16 L 1344 28 Z" className="t-metal-dk" />
      <g data-part="tailgate"><rect x="58" y="14" width="14" height="230" className="t-metal-dk" /><circle cx="65" cy="20" r="5" className="t-metal" /><rect x="56" y="226" width="18" height="10" className="t-metal" /></g>
      <path className="tr-tape" d="M 1334 238 H 120" />
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="128" y="340" width="8" height="52" className="t-rubber" /><rect x="1246" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1246" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="976" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="976" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="706" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="706" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="436" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="436" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="166" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="166" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
    <rect x="38" y="288" width="14" height="32" rx="1" className="t-plastic" />
    <rect x="40" y="290" width="10" height="6" className="t-lens-amber" /><rect x="40" y="290" width="10" height="6" className={lit("t-lit-amber", L.blinkerLeftOn)} data-lamp="blinker-left-rear" />
    <rect x="40" y="297" width="10" height="6" className="t-lens-red" /><rect x="40" y="297" width="10" height="6" className={lit("t-lit-red", L.parking || L.brake)} style={tailStyle} data-lamp="tail" />
    <rect x="40" y="304" width="10" height="6" className="t-lens-red" /><rect x="40" y="304" width="10" height="6" className={lit("t-lit-red", L.brake)} data-lamp="brake" />
    <rect x="40" y="311" width="10" height="6" className="t-lens-clear" /><rect x="40" y="311" width="10" height="6" className={lit("t-lit-white", L.reverse)} data-lamp="reverse" />
    
  </g>
  <g data-part="underrun"><rect x="54" y="288" width="5" height="54" className="t-metal-dk" /><rect x="38" y="338" width="22" height="12" className="t-metal-dk" /></g>

      </>
    );
  },
  Axle: [
    () => (
      <>

      <ellipse cx="457" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="407" y="285" width="12" height="16" className="t-chassis t-out" /><line x1="413" y1="297" x2="457" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="473" y="285" width="22" height="43" rx="5" className="t-rubber" />
      <TrWheel transform="translate(457 350) scale(1)" />
      <path d="M 399 344 A 58 58 0 0 1 515 344 L 510 344 A 53 53 0 0 0 404 344 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="326" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="276" y="285" width="12" height="16" className="t-chassis t-out" /><line x1="282" y1="297" x2="326" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="342" y="285" width="22" height="43" rx="5" className="t-rubber" />
      <TrWheel transform="translate(326 350) scale(1)" />
      <path d="M 268 344 A 58 58 0 0 1 384 344 L 379 344 A 53 53 0 0 0 273 344 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="195" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="145" y="285" width="12" height="16" className="t-chassis t-out" /><line x1="151" y1="297" x2="195" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="211" y="285" width="22" height="43" rx="5" className="t-rubber" />
      <TrWheel transform="translate(195 350) scale(1)" />
      <path d="M 137 344 A 58 58 0 0 1 253 344 L 248 344 A 53 53 0 0 0 142 344 Z" className="t-plastic" />
    
      </>
    ),
  ],
};
void TrWheel;
void lit;
export default drawing;

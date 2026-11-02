/**
 * Reboque: Graneleiro / silo (bulk) — vista lateral.
 * Gerado a partir de docs/design/trailers/bulk.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'bulk',
  label: "Graneleiro / silo",
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

  
  
  
  
  
  
      <defs><clipPath id={u("tr-silo-clip")}><path d="M 140 22 L 1330 22 A 40 86 0 0 1 1330 194 L 140 194 A 40 86 0 0 1 140 22 Z" /></clipPath></defs>
      <g data-part="trailer-chassis">
        <path d="M 1390 255 L 1240 255 L 1240 270 L 1390 270 Z" className="t-chassis t-out" />
        <path d="M 1390 250 L 1220 170 L 1240 160 L 1390 240 Z" className="t-chassis t-out" />
        <path d="M 540 258 L 45 258 L 45 285 L 540 285 Z" className="t-chassis t-out" />
        <path d="M 490 192 L 510 192 L 505 258 L 495 258 Z" className="t-chassis t-out" /><path d="M 250 192 L 270 192 L 265 258 L 255 258 Z" className="t-chassis t-out" /><path d="M 60 192 L 80 192 L 75 258 L 65 258 Z" className="t-chassis t-out" />
      </g>
      <rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="250" width="12" height="80" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g><rect x="1152" y="200" width="16" height="52" className="t-metal-dk" />
      <path d="M 1045 180 L 1315 180 L 1202 278 L 1158 278 Z" className="c-tank" /><path d="M 1220 180 L 1315 180 L 1202 278 L 1180 278 Z" className="t-shade" /><rect x="1166" y="276" width="28" height="12" className="t-metal-dk" /><path d="M 765 180 L 1035 180 L 922 278 L 878 278 Z" className="c-tank" /><path d="M 940 180 L 1035 180 L 922 278 L 900 278 Z" className="t-shade" /><rect x="886" y="276" width="28" height="12" className="t-metal-dk" /><path d="M 485 180 L 755 180 L 642 278 L 598 278 Z" className="c-tank" /><path d="M 660 180 L 755 180 L 642 278 L 620 278 Z" className="t-shade" /><rect x="606" y="276" width="28" height="12" className="t-metal-dk" />
      <path d="M 140 22 L 1330 22 A 40 86 0 0 1 1330 194 L 140 194 A 40 86 0 0 1 140 22 Z" className="c-tank" />
      <g clipPath={`url(#${u('tr-silo-clip')})`}><rect x="90" y="30" width="1300" height="26" className="t-hi" opacity=".2" /><rect x="90" y="156" width="1300" height="40" className="t-shade" /></g>
      <path d="M 140 22 L 1330 22 A 40 86 0 0 1 1330 194 L 140 194 A 40 86 0 0 1 140 22 Z" className="t-seam" />
      <rect x="1154" y="10" width="52" height="12" rx="3" className="t-metal" /><rect x="874" y="10" width="52" height="12" rx="3" className="t-metal" /><rect x="594" y="10" width="52" height="12" rx="3" className="t-metal" />
      <path d="M 300 22 V 8 H 1260 V 22" fill="none" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="2" />
      <rect x="440" y="284" width="900" height="9" rx="4.5" className="t-metal" />
      <path d="M 1340 288 H 1376 V 262" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="9" />
      <g stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="2"><path d="M 112 40 V 200 M 128 40 V 200" /><path d="M 112 60 H 128" /><path d="M 112 90 H 128" /><path d="M 112 120 H 128" /><path d="M 112 150 H 128" /><path d="M 112 180 H 128" /></g>
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="128" y="340" width="8" height="52" className="t-rubber" /><rect x="436" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="436" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="166" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="166" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="1096" y="196" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1096" y="196" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="796" y="196" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="796" y="196" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
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

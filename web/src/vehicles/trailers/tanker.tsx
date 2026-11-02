/**
 * Reboque: Tanque (tanker) — vista lateral.
 * Gerado a partir de docs/design/trailers/tanker.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'tanker',
  label: "Tanque",
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

  
  
  
  
  
  
      <defs><clipPath id={u("tr-tank-clip")}><path d="M 110 34 L 1340 34 A 44 108 0 0 1 1340 250 L 110 250 A 44 108 0 0 1 110 34 Z" /></clipPath></defs>
      <g data-part="trailer-chassis">
        <path d="M 1390 255 L 1060 255 L 1060 272 L 1390 272 Z" className="t-chassis t-out" />
        <path d="M 540 250 L 45 250 L 45 285 L 540 285 Z" className="t-chassis t-out" />
      </g>
      <rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="272" width="12" height="58" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g>
      <path d="M 110 34 L 1340 34 A 44 108 0 0 1 1340 250 L 110 250 A 44 108 0 0 1 110 34 Z" className="c-tank" />
      <g clipPath={`url(#${u('tr-tank-clip')})`}>
        <rect x="60" y="44" width="1340" height="30" className="t-hi" opacity=".2" />
        <rect x="60" y="92" width="1340" height="6" className="t-hi" opacity=".12" />
        <rect x="60" y="196" width="1340" height="60" className="t-shade" />
        <line x1="420" y1="30" x2="420" y2="252" className="t-seam" strokeOpacity=".3" /><line x1="424" y1="30" x2="424" y2="252" className="t-seam-hi" /><line x1="740" y1="30" x2="740" y2="252" className="t-seam" strokeOpacity=".3" /><line x1="744" y1="30" x2="744" y2="252" className="t-seam-hi" /><line x1="1060" y1="30" x2="1060" y2="252" className="t-seam" strokeOpacity=".3" /><line x1="1064" y1="30" x2="1064" y2="252" className="t-seam-hi" />
      </g>
      <path d="M 110 34 L 1340 34 A 44 108 0 0 1 1340 250 L 110 250 A 44 108 0 0 1 110 34 Z" className="t-seam" />
      <g data-part="walkway"><rect x="240" y="26" width="1000" height="8" className="t-metal-dk" />
        <rect x="238" y="18" width="44" height="10" rx="2" className="t-metal" /><rect x="558" y="18" width="44" height="10" rx="2" className="t-metal" /><rect x="878" y="18" width="44" height="10" rx="2" className="t-metal" /><rect x="1198" y="18" width="44" height="10" rx="2" className="t-metal" />
        <path d="M 250 26 V 14 H 1230 V 26" fill="none" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="2" /></g>
      <g data-part="ladder" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="2"><path d="M 96 40 V 250 M 112 40 V 250" /><path d="M 96 60 H 112" /><path d="M 96 90 H 112" /><path d="M 96 120 H 112" /><path d="M 96 150 H 112" /><path d="M 96 180 H 112" /><path d="M 96 210 H 112" /><path d="M 96 240 H 112" /></g>
      <rect x="620" y="250" width="160" height="40" className="t-metal-dk" />
      <rect x="634" y="282" width="12" height="14" className="t-metal" /><rect x="674" y="282" width="12" height="14" className="t-metal" /><rect x="714" y="282" width="12" height="14" className="t-metal" /><rect x="754" y="282" width="12" height="14" className="t-metal" />
      <rect x="760" y="258" width="560" height="10" rx="5" className="t-metal" />
      <g data-part="adr"><rect x="1250" y="160" width="44" height="32" className="c-adr" stroke="#111" strokeWidth="2" /><line x1="1250" y1="176" x2="1294" y2="176" stroke="#111" strokeWidth="2" /></g>
      <path className="tr-tape" d="M 1330 244 H 130" />
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="128" y="340" width="8" height="52" className="t-rubber" /><rect x="1246" y="256" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1246" y="256" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="976" y="256" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="976" y="256" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="706" y="256" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="706" y="256" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="436" y="256" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="436" y="256" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="166" y="256" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="166" y="256" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
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

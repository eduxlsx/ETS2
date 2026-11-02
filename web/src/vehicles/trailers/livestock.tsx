/**
 * Reboque: Boiadeiro / gado (livestock) — vista lateral.
 * Gerado a partir de docs/design/trailers/livestock.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'livestock',
  label: "Boiadeiro / gado",
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
      
    <path d="M 40 2 L 1392 2 Q 1400 2 1400 10 L 1400 255 L 40 255 Z" className="tr-alu" />
    <rect x="40" y="10" width="1360" height="22" className="t-hi" opacity=".08" />
    <rect x="40" y="195" width="1360" height="44" className="t-shade" opacity=".07" />
    <line x1="100" y1="10" x2="100" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="174" y1="10" x2="174" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="248" y1="10" x2="248" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="322" y1="10" x2="322" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="396" y1="10" x2="396" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="470" y1="10" x2="470" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="544" y1="10" x2="544" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="618" y1="10" x2="618" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="692" y1="10" x2="692" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="766" y1="10" x2="766" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="840" y1="10" x2="840" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="914" y1="10" x2="914" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="988" y1="10" x2="988" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="1062" y1="10" x2="1062" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="1136" y1="10" x2="1136" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="1210" y1="10" x2="1210" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="1284" y1="10" x2="1284" y2="239" className="t-seam" strokeOpacity=".1" /><line x1="1358" y1="10" x2="1358" y2="239" className="t-seam" strokeOpacity=".1" />
    <path d="M 40 2 L 1392 2 Q 1400 2 1400 10 L 1400 12 L 40 12 Z" className="t-metal-dk" />
    <rect x="40" y="239" width="1360" height="16" className="t-metal-dk" />
    <line x1="40" y1="239.5" x2="1400" y2="239.5" className="t-seam-hi" />
    <rect x="40" y="2" width="9" height="253" className="t-metal-dk" />
    <rect x="49" y="30" width="12" height="6" className="t-metal" /><rect x="49" y="95" width="12" height="6" className="t-metal" /><rect x="49" y="165" width="12" height="6" className="t-metal" /><rect x="49" y="225" width="12" height="6" className="t-metal" />
    <path className="tr-tape" d="M 1390 233 H 52" />
    <path className="tr-tape" d="M 52 18 V 233" style={{ strokeDasharray: "20 14" }} />
      <rect x="90" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="164" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="238" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="312" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="386" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="460" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="534" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="608" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="682" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="756" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="830" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="904" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="978" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1052" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1126" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1200" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1274" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1348" y="30" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="90" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="164" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="238" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="312" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="386" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="460" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="534" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="608" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="682" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="756" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="830" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="904" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="978" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1052" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1126" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1200" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1274" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1348" y="108" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="90" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="164" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="238" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="312" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="386" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="460" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="534" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="608" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="682" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="756" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="830" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="904" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="978" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1052" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1126" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1200" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1274" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" /><rect x="1348" y="186" width="56" height="16" rx="8" className="t-ink" opacity=".75" />
      <line x1="40" y1="86" x2="1400" y2="86" className="t-seam" strokeOpacity=".35" /><line x1="40" y1="87.5" x2="1400" y2="87.5" className="t-seam-hi" /><line x1="40" y1="164" x2="1400" y2="164" className="t-seam" strokeOpacity=".35" /><line x1="40" y1="165.5" x2="1400" y2="165.5" className="t-seam-hi" />
      <rect x="300" y="-6" width="70" height="8" className="t-metal-dk" /><rect x="700" y="-6" width="70" height="8" className="t-metal-dk" /><rect x="1100" y="-6" width="70" height="8" className="t-metal-dk" />
      <g data-part="ramp"><rect x="40" y="70" width="14" height="185" className="t-metal-dk" /><line x1="40" y1="90" x2="54" y2="82" stroke="var(--truck-metal-lt,#c4c6c9)" /><line x1="40" y1="120" x2="54" y2="112" stroke="var(--truck-metal-lt,#c4c6c9)" /><line x1="40" y1="150" x2="54" y2="142" stroke="var(--truck-metal-lt,#c4c6c9)" /><line x1="40" y1="180" x2="54" y2="172" stroke="var(--truck-metal-lt,#c4c6c9)" /><line x1="40" y1="210" x2="54" y2="202" stroke="var(--truck-metal-lt,#c4c6c9)" /><line x1="40" y1="240" x2="54" y2="232" stroke="var(--truck-metal-lt,#c4c6c9)" /></g>
      
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
    <rect x="40" y="6" width="8" height="5" className="t-lens-red" /><rect x="40" y="6" width="8" height="5" className={lit("t-lit-red", L.parking || L.brake)} style={tailStyle} data-lamp="tail" />
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

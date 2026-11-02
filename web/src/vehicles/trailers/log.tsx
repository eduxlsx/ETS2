/**
 * Reboque: Porta-toras (log) — vista lateral.
 * Gerado a partir de docs/design/trailers/log.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'log',
  label: "Porta-toras",
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
      <rect x="40" y="244" width="1360" height="12" className="t-metal-dk" />
      <g data-part="cargo"><rect x="726" y="201" width="644" height="44" rx="22" className="c-wood" />
            <line x1="746" y1="216.4" x2="1350" y2="216.4" stroke="#000" strokeOpacity=".22" />
            <line x1="766" y1="231.8" x2="1340" y2="231.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="734" cy="223" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="734" cy="223" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="726" y="157" width="644" height="44" rx="22" className="c-wood" />
            <line x1="746" y1="172.4" x2="1350" y2="172.4" stroke="#000" strokeOpacity=".22" />
            <line x1="766" y1="187.8" x2="1340" y2="187.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="734" cy="179" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="734" cy="179" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="726" y="113" width="644" height="44" rx="22" className="c-wood" />
            <line x1="746" y1="128.4" x2="1350" y2="128.4" stroke="#000" strokeOpacity=".22" />
            <line x1="766" y1="143.8" x2="1340" y2="143.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="734" cy="135" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="734" cy="135" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="756" y="75" width="584" height="38" rx="19" className="c-wood" />
            <line x1="776" y1="88.3" x2="1320" y2="88.3" stroke="#000" strokeOpacity=".22" />
            <line x1="796" y1="101.6" x2="1310" y2="101.6" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="764" cy="94" rx="8" ry="18" className="c-wood-end" />
            <ellipse cx="764" cy="94" rx="4" ry="9.5" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="56" y="201" width="644" height="44" rx="22" className="c-wood" />
            <line x1="76" y1="216.4" x2="680" y2="216.4" stroke="#000" strokeOpacity=".22" />
            <line x1="96" y1="231.8" x2="670" y2="231.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="64" cy="223" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="64" cy="223" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="56" y="157" width="644" height="44" rx="22" className="c-wood" />
            <line x1="76" y1="172.4" x2="680" y2="172.4" stroke="#000" strokeOpacity=".22" />
            <line x1="96" y1="187.8" x2="670" y2="187.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="64" cy="179" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="64" cy="179" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="56" y="113" width="644" height="44" rx="22" className="c-wood" />
            <line x1="76" y1="128.4" x2="680" y2="128.4" stroke="#000" strokeOpacity=".22" />
            <line x1="96" y1="143.8" x2="670" y2="143.8" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="64" cy="135" rx="8" ry="21" className="c-wood-end" />
            <ellipse cx="64" cy="135" rx="4" ry="11" fill="none" stroke="#000" strokeOpacity=".25" /><rect x="96" y="75" width="564" height="38" rx="19" className="c-wood" />
            <line x1="116" y1="88.3" x2="640" y2="88.3" stroke="#000" strokeOpacity=".22" />
            <line x1="136" y1="101.6" x2="630" y2="101.6" stroke="#fff" strokeOpacity=".08" />
            <ellipse cx="104" cy="94" rx="8" ry="18" className="c-wood-end" />
            <ellipse cx="104" cy="94" rx="4" ry="9.5" fill="none" stroke="#000" strokeOpacity=".25" /></g>
      <g data-part="stakes"><path d="M 1346 244 L 1347 70 L 1353 70 L 1354 244 Z" className="t-metal-dk" /><path d="M 1096 244 L 1097 70 L 1103 70 L 1104 244 Z" className="t-metal-dk" /><path d="M 756 244 L 757 70 L 763 70 L 764 244 Z" className="t-metal-dk" /><path d="M 696 244 L 697 70 L 703 70 L 704 244 Z" className="t-metal-dk" /><path d="M 356 244 L 357 70 L 363 70 L 364 244 Z" className="t-metal-dk" /><path d="M 66 244 L 67 70 L 73 70 L 74 244 Z" className="t-metal-dk" /></g>
      <path d="M 1230 244 V 72" className="c-strap" /><rect x="1226" y="230" width="8" height="10" className="t-metal-dk" /><path d="M 900 244 V 72" className="c-strap" /><rect x="896" y="230" width="8" height="10" className="t-metal-dk" /><path d="M 560 244 V 72" className="c-strap" /><rect x="556" y="230" width="8" height="10" className="t-metal-dk" /><path d="M 220 244 V 72" className="c-strap" /><rect x="216" y="230" width="8" height="10" className="t-metal-dk" />
      
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

/**
 * Reboque: Sider / lonado (curtain) — vista lateral.
 * Gerado a partir de docs/design/trailers/curtain.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'curtain',
  label: "Sider / lonado",
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
      <rect x="40" y="2" width="1360" height="253" className="tr-curtain" />
      <rect x="56" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="96" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="136" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="176" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="216" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="256" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="296" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="336" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="376" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="416" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="456" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="496" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="536" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="576" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="616" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="656" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="696" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="736" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="776" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="816" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="856" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="896" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="936" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="976" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1016" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1056" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1096" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1136" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1176" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1216" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1256" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1296" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1336" y="16" width="18" height="218" fill="#000" opacity=".09" /><rect x="1376" y="16" width="18" height="218" fill="#000" opacity=".09" /><line x1="80" y1="16" x2="80" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="77" y="220" width="6" height="11" className="t-metal" /><line x1="142" y1="16" x2="142" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="139" y="220" width="6" height="11" className="t-metal" /><line x1="204" y1="16" x2="204" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="201" y="220" width="6" height="11" className="t-metal" /><line x1="266" y1="16" x2="266" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="263" y="220" width="6" height="11" className="t-metal" /><line x1="328" y1="16" x2="328" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="325" y="220" width="6" height="11" className="t-metal" /><line x1="390" y1="16" x2="390" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="387" y="220" width="6" height="11" className="t-metal" /><line x1="452" y1="16" x2="452" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="449" y="220" width="6" height="11" className="t-metal" /><line x1="514" y1="16" x2="514" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="511" y="220" width="6" height="11" className="t-metal" /><line x1="576" y1="16" x2="576" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="573" y="220" width="6" height="11" className="t-metal" /><line x1="638" y1="16" x2="638" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="635" y="220" width="6" height="11" className="t-metal" /><line x1="700" y1="16" x2="700" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="697" y="220" width="6" height="11" className="t-metal" /><line x1="762" y1="16" x2="762" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="759" y="220" width="6" height="11" className="t-metal" /><line x1="824" y1="16" x2="824" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="821" y="220" width="6" height="11" className="t-metal" /><line x1="886" y1="16" x2="886" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="883" y="220" width="6" height="11" className="t-metal" /><line x1="948" y1="16" x2="948" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="945" y="220" width="6" height="11" className="t-metal" /><line x1="1010" y1="16" x2="1010" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1007" y="220" width="6" height="11" className="t-metal" /><line x1="1072" y1="16" x2="1072" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1069" y="220" width="6" height="11" className="t-metal" /><line x1="1134" y1="16" x2="1134" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1131" y="220" width="6" height="11" className="t-metal" /><line x1="1196" y1="16" x2="1196" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1193" y="220" width="6" height="11" className="t-metal" /><line x1="1258" y1="16" x2="1258" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1255" y="220" width="6" height="11" className="t-metal" /><line x1="1320" y1="16" x2="1320" y2="234" stroke="#000" strokeOpacity=".32" strokeWidth="2" /><rect x="1317" y="220" width="6" height="11" className="t-metal" />
      <rect x="40" y="14" width="1360" height="10" className="t-hi" opacity=".1" />
      <path d="M 40 2 L 1392 2 Q 1400 2 1400 10 L 1400 16 L 40 16 Z" className="t-metal-dk" />
      <rect x="40" y="234" width="1360" height="21" className="t-metal-dk" /><line x1="40" y1="234.5" x2="1400" y2="234.5" className="t-seam-hi" />
      <rect x="1382" y="2" width="18" height="253" className="t-metal" /><rect x="1382" y="2" width="18" height="253" className="t-shade" />
      <rect x="40" y="2" width="16" height="253" className="t-metal" />
      <rect x="56" y="30" width="10" height="6" className="t-metal-dk" /><rect x="56" y="95" width="10" height="6" className="t-metal-dk" /><rect x="56" y="165" width="10" height="6" className="t-metal-dk" /><rect x="56" y="225" width="10" height="6" className="t-metal-dk" />
      <path className="tr-tape" d="M 1380 246 H 58" />
      
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

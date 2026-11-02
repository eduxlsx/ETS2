/**
 * Reboque: Porta-contêiner (container) — vista lateral.
 * Gerado a partir de docs/design/trailers/container.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'container',
  label: "Porta-contêiner",
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
        <path d="M 1390 255 L 45 255 L 45 283 L 520 283 L 560 296 L 1060 296 L 1100 268 L 1390 268 Z" className="t-chassis t-out" />
        <rect x="1334" y="250" width="12" height="6" className="t-metal" /><rect x="734" y="250" width="12" height="6" className="t-metal" /><rect x="115" y="250" width="12" height="6" className="t-metal" />
      </g>
      <rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="268" width="12" height="62" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g>
      <g data-part="cargo">
        <rect x="121" y="-4" width="1219" height="259" className="c-container" />
        <rect x="136" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="162" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="188" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="214" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="240" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="266" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="292" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="318" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="344" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="370" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="396" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="422" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="448" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="474" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="500" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="526" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="552" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="578" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="604" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="630" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="656" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="682" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="708" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="734" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="760" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="786" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="812" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="838" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="864" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="890" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="916" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="942" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="968" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="994" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1020" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1046" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1072" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1098" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1124" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1150" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1176" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1202" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1228" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1254" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1280" y="10" width="13" height="236" fill="#000" opacity=".12" /><rect x="1306" y="10" width="13" height="236" fill="#000" opacity=".12" />
        <rect x="121" y="-4" width="1219" height="12" className="t-shade-2" /><rect x="121" y="243" width="1219" height="12" className="t-shade-2" />
        <rect x="121" y="8" width="1219" height="3" className="t-hi" />
        <rect x="121" y="-4" width="16" height="14" className="t-metal-dk" /><rect x="125" y="0" width="8" height="5" rx="2.5" className="t-ink" /><rect x="1324" y="-4" width="16" height="14" className="t-metal-dk" /><rect x="1328" y="0" width="8" height="5" rx="2.5" className="t-ink" /><rect x="121" y="241" width="16" height="14" className="t-metal-dk" /><rect x="125" y="245" width="8" height="5" rx="2.5" className="t-ink" /><rect x="1324" y="241" width="16" height="14" className="t-metal-dk" /><rect x="1328" y="245" width="8" height="5" rx="2.5" className="t-ink" />
        <rect x="121" y="10" width="16" height="231" className="t-shade" />
        <line x1="129" y1="12" x2="129" y2="240" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" /><line x1="133" y1="12" x2="133" y2="240" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" />
        <text x="1310" y="36" textAnchor="end" className="c-tx">TPLU 204617 4</text>
        <text x="1310" y="54" textAnchor="end" className="c-tx" style={{ fontSize: "11px" }}>45G1</text>
      </g>
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="128" y="340" width="8" height="52" className="t-rubber" /><rect x="1246" y="270" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1246" y="270" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="976" y="270" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="976" y="270" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="706" y="270" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="706" y="270" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="436" y="270" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="436" y="270" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="166" y="270" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="166" y="270" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
    <rect x="38" y="286" width="14" height="32" rx="1" className="t-plastic" />
    <rect x="40" y="288" width="10" height="6" className="t-lens-amber" /><rect x="40" y="288" width="10" height="6" className={lit("t-lit-amber", L.blinkerLeftOn)} data-lamp="blinker-left-rear" />
    <rect x="40" y="295" width="10" height="6" className="t-lens-red" /><rect x="40" y="295" width="10" height="6" className={lit("t-lit-red", L.parking || L.brake)} style={tailStyle} data-lamp="tail" />
    <rect x="40" y="302" width="10" height="6" className="t-lens-red" /><rect x="40" y="302" width="10" height="6" className={lit("t-lit-red", L.brake)} data-lamp="brake" />
    <rect x="40" y="309" width="10" height="6" className="t-lens-clear" /><rect x="40" y="309" width="10" height="6" className={lit("t-lit-white", L.reverse)} data-lamp="reverse" />
    
  </g>
  <g data-part="underrun"><rect x="54" y="286" width="5" height="54" className="t-metal-dk" /><rect x="38" y="338" width="22" height="12" className="t-metal-dk" /></g>

      </>
    );
  },
  Axle: [
    () => (
      <>

      <ellipse cx="457" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="407" y="283" width="12" height="16" className="t-chassis t-out" /><line x1="413" y1="295" x2="457" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="473" y="283" width="22" height="45" rx="5" className="t-rubber" />
      <TrWheel transform="translate(457 350) scale(1)" />
      <path d="M 399 344 A 58 58 0 0 1 515 344 L 510 344 A 53 53 0 0 0 404 344 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="326" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="276" y="283" width="12" height="16" className="t-chassis t-out" /><line x1="282" y1="295" x2="326" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="342" y="283" width="22" height="45" rx="5" className="t-rubber" />
      <TrWheel transform="translate(326 350) scale(1)" />
      <path d="M 268 344 A 58 58 0 0 1 384 344 L 379 344 A 53 53 0 0 0 273 344 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="195" cy="400" rx="46" ry="3" className="t-ink" opacity=".5" />
      <rect x="145" y="283" width="12" height="16" className="t-chassis t-out" /><line x1="151" y1="295" x2="195" y2="350" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="211" y="283" width="22" height="45" rx="5" className="t-rubber" />
      <TrWheel transform="translate(195 350) scale(1)" />
      <path d="M 137 344 A 58 58 0 0 1 253 344 L 248 344 A 53 53 0 0 0 142 344 Z" className="t-plastic" />
    
      </>
    ),
  ],
};
void TrWheel;
void lit;
export default drawing;

/**
 * Reboque: Prancha rebaixada (lowbed) — vista lateral.
 * Gerado a partir de docs/design/trailers/lowbed.svg (100 px = 1 m; frente em x = 1400,
 * traseira em x = 40, solo em y = 400). As luzes usam as mesmas classes/data-lamp do cavalo.
 */
import { TrWheel, lit, type TrailerDrawing } from './common';

const drawing: TrailerDrawing = {
  type: 'lowbed',
  label: "Prancha rebaixada",
  axles: [{"refX":300,"refY":360,"scale":0.8},{"refX":200,"refY":360,"scale":0.8},{"refX":100,"refY":360,"scale":0.8}],
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
        <path d="M 1390 255 L 1080 255 L 1030 315 L 380 315 L 360 290 L 40 290 L 40 312 L 350 312 L 370 345 L 1040 345 L 1090 285 L 1390 285 Z" className="t-chassis t-out" />
        <rect x="380" y="315" width="650" height="9" className="c-deck" /><line x1="380" y1="316" x2="380" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="402" y1="316" x2="402" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="424" y1="316" x2="424" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="446" y1="316" x2="446" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="468" y1="316" x2="468" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="490" y1="316" x2="490" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="512" y1="316" x2="512" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="534" y1="316" x2="534" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="556" y1="316" x2="556" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="578" y1="316" x2="578" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="600" y1="316" x2="600" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="622" y1="316" x2="622" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="644" y1="316" x2="644" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="666" y1="316" x2="666" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="688" y1="316" x2="688" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="710" y1="316" x2="710" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="732" y1="316" x2="732" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="754" y1="316" x2="754" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="776" y1="316" x2="776" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="798" y1="316" x2="798" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="820" y1="316" x2="820" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="842" y1="316" x2="842" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="864" y1="316" x2="864" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="886" y1="316" x2="886" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="908" y1="316" x2="908" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="930" y1="316" x2="930" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="952" y1="316" x2="952" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="974" y1="316" x2="974" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="996" y1="316" x2="996" y2="324" className="t-seam" strokeOpacity=".4" /><line x1="1018" y1="316" x2="1018" y2="324" className="t-seam" strokeOpacity=".4" />
        <rect x="40" y="286" width="320" height="5" className="t-metal-dk" />
      </g>
      <rect x="1230" y="268" width="100" height="4" className="t-metal-dk" /><rect x="1272" y="272" width="6" height="8" className="t-metal" /><g data-part="landing-gear">
    <rect x="1154" y="285" width="12" height="45" className="t-metal-dk" />
    <rect x="1157" y="330" width="6" height="42" className="t-metal" />
    <rect x="1149" y="372" width="22" height="6" className="t-metal-dk" />
    <rect x="1166" y="296" width="10" height="12" className="t-plastic" />
    <path d="M 1176 302 H 1190 V 318" fill="none" stroke="var(--truck-metal,#8e9196)" strokeWidth="2" />
  </g>
      <g data-part="ramps">
        <path d="M 58 290 L 40 290 L 26 150 L 44 150 Z" className="t-metal-dk" />
        <line x1="32" y1="170" x2="32" y2="170" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" /><line x1="34.5" y1="195" x2="34.5" y2="195" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" /><line x1="37" y1="220" x2="37" y2="220" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" /><line x1="39.5" y1="245" x2="39.5" y2="245" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" /><line x1="42" y1="270" x2="42" y2="270" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="1.5" />
      </g>
      <g data-part="cargo">
        
        <rect x="540" y="246" width="440" height="69" rx="34" className="t-rubber" />
        <rect x="540" y="246" width="440" height="69" rx="34" fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="3" strokeDasharray="6 5" />
        <circle cx="575" cy="280" r="24" className="t-metal-dk" /><circle cx="575" cy="280" r="9" className="t-metal" />
        <circle cx="945" cy="280" r="24" className="t-metal-dk" /><circle cx="945" cy="280" r="9" className="t-metal" />
        <circle cx="600" cy="296" r="9" className="t-metal-dk" /><circle cx="646" cy="296" r="9" className="t-metal-dk" /><circle cx="692" cy="296" r="9" className="t-metal-dk" /><circle cx="738" cy="296" r="9" className="t-metal-dk" /><circle cx="784" cy="296" r="9" className="t-metal-dk" /><circle cx="830" cy="296" r="9" className="t-metal-dk" /><circle cx="876" cy="296" r="9" className="t-metal-dk" />
        <rect x="600" y="248" width="320" height="10" className="t-plastic-2" />
        
        <path d="M 646 206 L 680 188 L 588 30 L 556 48 Z" className="c-machine" />
        <path d="M 646 206 L 680 188 L 588 30 L 556 48 Z" className="t-seam" />
        <path d="M 560 34 L 592 48 L 512 268 L 480 258 Z" className="c-machine" />
        <path d="M 560 34 L 592 48 L 512 268 L 480 258 Z" className="t-shade" />
        <line x1="700" y1="214" x2="618" y2="104" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="7" />
        <line x1="700" y1="214" x2="618" y2="104" stroke="#000" strokeOpacity=".25" strokeWidth="2" />
        <line x1="616" y1="58" x2="548" y2="150" stroke="var(--truck-metal-lt,#c4c6c9)" strokeWidth="6" />
        <path d="M 438 256 L 522 256 L 512 314 L 452 314 Z" className="c-machine" />
        <path d="M 438 256 L 522 256 L 512 314 L 452 314 Z" className="t-shade-2" />
        <rect x="456" y="312" width="8" height="4" className="t-metal-dk" /><rect x="474" y="312" width="8" height="4" className="t-metal-dk" /><rect x="492" y="312" width="8" height="4" className="t-metal-dk" />
        
        <rect x="690" y="232" width="170" height="14" className="t-chassis" />
        <path d="M 620 152 L 930 152 Q 984 152 984 196 L 984 232 L 620 232 Z" className="c-machine" />
        <path d="M 900 152 Q 984 152 984 196 L 984 232 L 900 232 Z" className="t-shade" />
        <rect x="620" y="210" width="364" height="22" className="t-shade" />
        <rect x="760" y="164" width="28" height="4" className="t-ink" opacity=".45" /><rect x="800" y="164" width="28" height="4" className="t-ink" opacity=".45" /><rect x="840" y="164" width="28" height="4" className="t-ink" opacity=".45" /><rect x="880" y="164" width="28" height="4" className="t-ink" opacity=".45" />
        <rect x="904" y="128" width="8" height="24" className="t-ink" />
        <path d="M 760 152 V 140 H 960 V 152" fill="none" stroke="var(--truck-ink,#0b0b0a)" strokeWidth="2" />
        
        <path d="M 628 152 L 628 56 Q 628 46 638 46 L 712 46 Q 724 46 726 58 L 732 152 Z" className="c-machine" />
        <path d="M 640 60 L 712 60 L 718 140 L 640 140 Z" className="t-glass" />
        <path d="M 650 60 L 668 60 L 652 140 L 640 140 Z" fill="#fff" opacity=".08" />
        
        <path d="M 546 300 L 500 316 M 975 300 L 1022 316 M 620 232 L 560 316 M 960 232 L 1000 316" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
      </g>
      
      </>
    );
  },
  Post: ({ L, u }) => {
    const tailStyle = L.parking && !L.brake ? { opacity: 0.55 } : undefined;
    return (
      <>
<rect x="936" y="330" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="936" y="330" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="696" y="330" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="696" y="330" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="456" y="330" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="456" y="330" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><rect x="1246" y="262" width="8" height="5" rx="1" className="t-lens-amber" /><rect x="1246" y="262" width="8" height="5" rx="1" className={lit("t-lit-amber", L.parking)} data-lamp="side-marker" /><g data-part="tail">
    <rect x="20" y="292" width="14" height="32" rx="1" className="t-plastic" />
    <rect x="22" y="294" width="10" height="6" className="t-lens-amber" /><rect x="22" y="294" width="10" height="6" className={lit("t-lit-amber", L.blinkerLeftOn)} data-lamp="blinker-left-rear" />
    <rect x="22" y="301" width="10" height="6" className="t-lens-red" /><rect x="22" y="301" width="10" height="6" className={lit("t-lit-red", L.parking || L.brake)} style={tailStyle} data-lamp="tail" />
    <rect x="22" y="308" width="10" height="6" className="t-lens-red" /><rect x="22" y="308" width="10" height="6" className={lit("t-lit-red", L.brake)} data-lamp="brake" />
    <rect x="22" y="315" width="10" height="6" className="t-lens-clear" /><rect x="22" y="315" width="10" height="6" className={lit("t-lit-white", L.reverse)} data-lamp="reverse" />
    
  </g>
  <g data-part="underrun"><rect x="36" y="292" width="5" height="54" className="t-metal-dk" /><rect x="20" y="338" width="22" height="12" className="t-metal-dk" /></g>

      </>
    );
  },
  Axle: [
    () => (
      <>

      <ellipse cx="300" cy="400" rx="36.800000000000004" ry="3" className="t-ink" opacity=".5" />
      <rect x="250" y="312" width="12" height="16" className="t-chassis t-out" /><line x1="256" y1="324" x2="300" y2="360" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="316" y="312" width="22" height="26" rx="5" className="t-rubber" />
      <TrWheel transform="translate(300 360) scale(0.8)" />
      <path d="M 252 354 A 48 48 0 0 1 348 354 L 343 354 A 43 43 0 0 0 257 354 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="200" cy="400" rx="36.800000000000004" ry="3" className="t-ink" opacity=".5" />
      <rect x="150" y="312" width="12" height="16" className="t-chassis t-out" /><line x1="156" y1="324" x2="200" y2="360" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="216" y="312" width="22" height="26" rx="5" className="t-rubber" />
      <TrWheel transform="translate(200 360) scale(0.8)" />
      <path d="M 152 354 A 48 48 0 0 1 248 354 L 243 354 A 43 43 0 0 0 157 354 Z" className="t-plastic" />
    
      </>
    ),
    () => (
      <>

      <ellipse cx="100" cy="400" rx="36.800000000000004" ry="3" className="t-ink" opacity=".5" />
      <rect x="50" y="312" width="12" height="16" className="t-chassis t-out" /><line x1="56" y1="324" x2="100" y2="360" stroke="var(--truck-metal-dk,#5d6166)" strokeWidth="6" />
      <rect x="116" y="312" width="22" height="26" rx="5" className="t-rubber" />
      <TrWheel transform="translate(100 360) scale(0.8)" />
      <path d="M 52 354 A 48 48 0 0 1 148 354 L 143 354 A 43 43 0 0 0 57 354 Z" className="t-plastic" />
    
      </>
    ),
  ],
};
void TrWheel;
void lit;
export default drawing;

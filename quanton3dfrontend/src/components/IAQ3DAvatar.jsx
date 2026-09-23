import { useId, useState } from "react";
import "./IAQ3DAvatar.css";

// Mascote da IAQ3D: nucleo com rosto + as tres orbitas do logo Quanton3D.
// estado: "" (normal) | "pensando" | "feliz"
// compact: enquadra so o atomo dentro de um circulo (botao, cabecalho, baloes)
// parado: sem animacao (usado nas mensagens antigas do chat)

const ORBITAS = [90, 30, 150];
const VELOCIDADES = [4.2, 5.4, 6.6];
const CAMINHO_ORBITA = "M104 60a44 15 0 1 1-88 0a44 15 0 1 1 88 0";
const POSICAO_PARADA = [0, 2.1, 4.2].map((t) => [44 * Math.cos(t), 15 * Math.sin(t)]);

function prefereMenosMovimento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function IAQ3DAvatar({ size = 40, estado = "", compact = false, parado = false, className = "" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [semMovimento] = useState(prefereMenosMovimento);
  const estatico = parado || semMovimento;
  const gradiente = `iaq3d-nucleo-${uid}`;

  const classes = [
    "iaq3d-atom",
    estado === "pensando" && "is-thinking",
    estado === "feliz" && "is-happy",
    compact && "compact",
    estatico && "is-static",
    className,
  ].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      viewBox={compact ? "8 8 104 104" : "0 0 120 120"}
      width={size}
      height={size}
      role="img"
      aria-label="IAQ3D"
      focusable="false"
    >
      <defs>
        <radialGradient id={gradiente} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#9fd6ff" />
          <stop offset=".55" stopColor="#2f6dff" />
          <stop offset="1" stopColor="#6a4bff" />
        </radialGradient>
      </defs>
      {compact && <rect x="0" y="0" width="120" height="120" fill="#02034f" />}
      <g className="a-float">
        <g className="a-orbits">
          {ORBITAS.map((ang) => (
            <ellipse key={ang} cx="60" cy="60" rx="44" ry="15" transform={`rotate(${ang} 60 60)`} fill="none" stroke="#fff" strokeWidth="3.4" strokeOpacity=".95" />
          ))}
        </g>
        <circle className="a-glow" cx="60" cy="60" r="24" fill="#2f7bff" fillOpacity=".35" />
        <g className="a-core">
          <circle cx="60" cy="60" r="19" fill={`url(#${gradiente})`} />
          <path d="M50 49a13 13 0 0 1 9-5" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" fill="none" />
          <rect x="46" y="56" width="28" height="13" rx="6.5" fill="#0a0f2c" />
          <g className="f-look">
            <g className="f-eyes">
              <rect x="52" y="58.5" width="4.6" height="8" rx="2.3" fill="#7ff3ff" />
              <rect x="63.4" y="58.5" width="4.6" height="8" rx="2.3" fill="#7ff3ff" />
            </g>
          </g>
          <g className="f-happy" fill="none" stroke="#7ff3ff" strokeWidth="2.4" strokeLinecap="round">
            <path d="M51.5 65q2.8-4.4 5.6 0" />
            <path d="M62.9 65q2.8-4.4 5.6 0" />
          </g>
          <g className="f-dots" fill="#7ff3ff">
            <circle cx="54" cy="62.5" r="2" />
            <circle cx="60" cy="62.5" r="2" />
            <circle cx="66" cy="62.5" r="2" />
          </g>
          <g className="f-blush" fill="#ff7ab6" fillOpacity=".6">
            <ellipse cx="47" cy="72" rx="3.4" ry="1.8" />
            <ellipse cx="73" cy="72" rx="3.4" ry="1.8" />
          </g>
        </g>
        <g className="a-orbits">
          {ORBITAS.map((ang, k) => (
            <g key={ang} transform={`rotate(${ang} 60 60)`}>
              <circle
                r="4.6"
                fill="#fff"
                cx={estatico ? 60 + POSICAO_PARADA[k][0] : 0}
                cy={estatico ? 60 + POSICAO_PARADA[k][1] : 0}
              >
                {!estatico && (
                  <animateMotion dur={`${VELOCIDADES[k]}s`} begin={`-${k * 1.7}s`} repeatCount="indefinite" path={CAMINHO_ORBITA} />
                )}
              </circle>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export default IAQ3DAvatar;

import { useEffect, useRef } from "react";

// Fundo da tela de entrada: tunel de circuitos em neon azul vindo na direcao de quem olha.
// Desenhado em canvas (leve, sem video). "acelerar" faz o efeito de dobra ao entrar.
// Com "reduzir movimento" ligado no sistema, desenha um quadro parado.

const COR_FORTE = "95, 208, 255"; // azul neon
const COR_MEDIA = "47, 123, 255"; // azul Quanton
const COR_ROXA = "150, 80, 245";  // ametista

function criarAnel(z) {
  const segmentos = [];
  let angulo = Math.random() * Math.PI * 2;
  const qtd = 5 + Math.floor(Math.random() * 6);
  for (let i = 0; i < qtd; i += 1) {
    const tam = 0.18 + Math.random() * 0.7;
    segmentos.push({ inicio: angulo, fim: angulo + tam });
    angulo += tam + 0.12 + Math.random() * 0.5;
  }
  const trilhas = Array.from({ length: 6 + Math.floor(Math.random() * 8) }, () => ({
    angulo: Math.random() * Math.PI * 2,
    comp: 0.12 + Math.random() * 0.35,
  }));
  return {
    z,
    segmentos,
    trilhas,
    giro: (Math.random() - 0.5) * 0.25,
    rot: Math.random() * Math.PI * 2,
    cor: Math.random() < 0.18 ? COR_ROXA : Math.random() < 0.5 ? COR_FORTE : COR_MEDIA,
    grosso: Math.random() < 0.25,
  };
}

function TunelEntrada({ acelerar = false }) {
  const canvasRef = useRef(null);
  const acelerarRef = useRef(acelerar);
  useEffect(() => { acelerarRef.current = acelerar; }, [acelerar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let largura = 0;
    let altura = 0;
    let dpr = 1;
    const Z_LONGE = 9;
    const Z_PERTO = 0.35;
    const aneis = Array.from({ length: 26 }, (_, i) => criarAnel(Z_PERTO + (i / 26) * (Z_LONGE - Z_PERTO)));
    const faiscas = Array.from({ length: 140 }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random() * Z_LONGE + 0.2, v: 0.6 + Math.random() }));

    function redimensionar() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    redimensionar();
    window.addEventListener("resize", redimensionar);

    let velocidade = 1;
    let ultimo = performance.now();
    let quadro = 0;

    function desenhar(agora) {
      const dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;
      const alvo = acelerarRef.current ? 9 : 1;
      velocidade += (alvo - velocidade) * Math.min(1, dt * 3);

      const cx = largura / 2;
      const cy = altura / 2;
      const escala = Math.max(largura, altura) * 0.16;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(2, 5, 19, 0.38)";
      ctx.fillRect(0, 0, largura, altura);
      ctx.globalCompositeOperation = "lighter";

      // brilho do centro do tunel
      const brilho = ctx.createRadialGradient(cx, cy, 0, cx, cy, escala * 1.6);
      brilho.addColorStop(0, `rgba(${COR_FORTE}, 0.22)`);
      brilho.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = brilho;
      ctx.fillRect(0, 0, largura, altura);

      const passo = dt * 1.35 * velocidade;
      for (const anel of aneis) {
        anel.z -= passo;
        anel.rot += anel.giro * dt;
        if (anel.z < Z_PERTO) Object.assign(anel, criarAnel(Z_LONGE));
        const r = escala / anel.z;
        const perto = 1 - (anel.z - Z_PERTO) / (Z_LONGE - Z_PERTO);
        const alfa = Math.min(1, perto * 1.4) * (anel.z < 0.8 ? anel.z / 0.8 : 1);
        if (alfa <= 0.01) continue;
        const espessura = Math.min(anel.grosso ? 7 : 4, Math.max(0.6, (anel.grosso ? 5 : 2.2) / anel.z));

        for (const seg of anel.segmentos) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, seg.inicio + anel.rot, seg.fim + anel.rot);
          ctx.strokeStyle = `rgba(${anel.cor}, ${alfa * 0.18})`;
          ctx.lineWidth = espessura * 3.2;
          ctx.stroke();
          ctx.strokeStyle = `rgba(${anel.cor}, ${alfa * 0.9})`;
          ctx.lineWidth = espessura;
          ctx.stroke();
        }
        // trilhas de circuito saindo do anel, com um "pad" na ponta
        for (const t of anel.trilhas) {
          const a = t.angulo + anel.rot;
          const r2 = r * (1 + t.comp);
          const x1 = cx + Math.cos(a) * r;
          const y1 = cy + Math.sin(a) * r;
          const x2 = cx + Math.cos(a) * r2;
          const y2 = cy + Math.sin(a) * r2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(${COR_FORTE}, ${alfa * 0.55})`;
          ctx.lineWidth = Math.max(0.5, espessura * 0.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x2, y2, Math.min(3, Math.max(0.8, espessura * 0.7)), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(210, 240, 255, ${alfa * 0.85})`;
          ctx.fill();
        }
      }

      // faiscas passando pelo tunel (viram riscos quando acelera)
      for (const f of faiscas) {
        const zAntes = f.z;
        f.z -= passo * f.v * 1.4;
        if (f.z < 0.15) { f.z = Z_LONGE; f.a = Math.random() * Math.PI * 2; continue; }
        const r1 = (escala * 1.1) / zAntes;
        const r2 = (escala * 1.1) / f.z;
        const alfa = Math.min(1, (1 - f.z / Z_LONGE) * 1.6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(f.a) * r1, cy + Math.sin(f.a) * r1);
        ctx.lineTo(cx + Math.cos(f.a) * r2, cy + Math.sin(f.a) * r2);
        ctx.strokeStyle = `rgba(200, 235, 255, ${alfa * 0.8})`;
        ctx.lineWidth = Math.min(2.5, Math.max(0.6, 1.6 / f.z));
        ctx.stroke();
      }

      quadro = reduzir ? 0 : requestAnimationFrame(desenhar);
    }

    if (reduzir) {
      // um quadro parado bem montado
      for (let i = 0; i < 40; i += 1) desenhar(ultimo + 16 * (i + 1));
    } else {
      quadro = requestAnimationFrame(desenhar);
    }

    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", redimensionar);
    };
  }, []);

  return <canvas ref={canvasRef} className="welcome-tunel" aria-hidden="true" />;
}

export default TunelEntrada;

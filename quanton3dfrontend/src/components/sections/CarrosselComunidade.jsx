import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import api from "../../lib/api";

// Carrossel com as pecas aprovadas na Galeria da Comunidade.
// Usado na Home (variante "home") e no topo da Galeria (variante "galeria").
// Toda peca aprovada no ADM entra aqui sozinha. Com menos de 3 pecas, nao aparece.
// A faixa anda sozinha (movida por JS, nao depende de configuracao de animacao do
// sistema), tem setas, da para arrastar com o dedo/mouse, pausa com o mouse em cima
// e tem botao de pausar.
const MINIMO_PECAS = 3;
const MINIMO_CARTOES_POR_VOLTA = 8;
const VELOCIDADE_PX_S = 55;
const ARRASTO_MINIMO = 6;

function CarrosselComunidade({ onNavegar, pecas: pecasProp, onAbrirPeca, variante = "home" }) {
  const [pecasApi, setPecasApi] = useState([]);
  const [pausadoBotao, setPausadoBotao] = useState(false);
  const janelaRef = useRef(null);
  const pistaRef = useRef(null);
  const estado = useRef({ offset: 0, alvo: null, mouseEmCima: false, arrastando: false, pausadoBotao: false, inicioX: 0, inicioOffset: 0, moveu: false });

  const pecas = (Array.isArray(pecasProp) ? pecasProp : pecasApi).filter((p) => p && p.imagem);
  const temPecas = pecas.length >= MINIMO_PECAS;

  useEffect(() => {
    if (Array.isArray(pecasProp)) return undefined;
    let ativo = true;
    api.get("/gallery")
      .then((res) => {
        const lista = Array.isArray(res.data?.data) ? res.data.data : [];
        if (ativo) setPecasApi(lista);
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [pecasProp]);

  useEffect(() => { estado.current.pausadoBotao = pausadoBotao; }, [pausadoBotao]);

  useEffect(() => {
    if (!temPecas) return undefined;
    const pista = pistaRef.current;
    if (!pista) return undefined;
    const s = estado.current;
    let quadro = 0;
    let ultimo = performance.now();

    function metadeDaPista() {
      return pista.scrollWidth / 2 || 1;
    }
    function aplicar() {
      const volta = metadeDaPista();
      s.offset = ((s.offset % volta) + volta) % volta;
      pista.style.transform = `translate3d(${-s.offset}px, 0, 0)`;
    }
    function passo(agora) {
      const dt = Math.min((agora - ultimo) / 1000, 0.1);
      ultimo = agora;
      if (s.alvo !== null) {
        // animacao das setas: vai suave ate o proximo cartao
        const falta = s.alvo - s.offset;
        if (Math.abs(falta) < 0.5) { s.offset = s.alvo; s.alvo = null; } else { s.offset += falta * Math.min(1, dt * 7); }
      } else if (!s.arrastando && !s.mouseEmCima && !s.pausadoBotao) {
        s.offset += VELOCIDADE_PX_S * dt;
      }
      aplicar();
      quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [temPecas, pecas.length]);

  if (!temPecas) return null;

  // Repete a lista ate encher a tela e duplica a volta inteira: quando anda uma
  // volta, recomeca do inicio sem emenda aparente.
  const repeticoes = Math.max(1, Math.ceil(MINIMO_CARTOES_POR_VOLTA / pecas.length));
  const volta = Array.from({ length: repeticoes }, () => pecas).flat();
  const faixa = [...volta, ...volta];

  function larguraCartao() {
    const card = pistaRef.current?.querySelector(".carrossel-card");
    if (!card) return 300;
    const margem = parseFloat(getComputedStyle(card).marginRight) || 0;
    return card.getBoundingClientRect().width + margem;
  }
  function andar(direcao) {
    const s = estado.current;
    const passoCartao = larguraCartao();
    const base = s.alvo ?? s.offset;
    const alinhado = Math.round(base / passoCartao) * passoCartao;
    let alvo = alinhado + direcao * passoCartao;
    if (alvo < 0) {
      // volta para tras passando do inicio: pula para a copia de mesma posicao
      const metade = (pistaRef.current?.scrollWidth || 0) / 2;
      s.offset += metade;
      alvo += metade;
    }
    s.alvo = alvo;
  }

  function aoPressionar(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = estado.current;
    s.arrastando = true;
    s.moveu = false;
    s.alvo = null;
    s.inicioX = e.clientX;
    s.inicioOffset = s.offset;
  }
  function aoMover(e) {
    const s = estado.current;
    if (!s.arrastando) return;
    const dx = e.clientX - s.inicioX;
    if (!s.moveu && Math.abs(dx) > ARRASTO_MINIMO) {
      s.moveu = true;
      janelaRef.current?.setPointerCapture?.(e.pointerId);
    }
    if (s.moveu) s.offset = s.inicioOffset - dx;
  }
  function aoSoltar() {
    estado.current.arrastando = false;
  }
  function aoClicarPeca(peca, e) {
    if (estado.current.moveu) { e.preventDefault(); estado.current.moveu = false; return; }
    if (onAbrirPeca) onAbrirPeca(peca);
    else if (onNavegar) onNavegar("comunidade");
  }

  const ehHome = variante === "home";

  return (
    <section className={`carrossel-comunidade carrossel-comunidade--${variante}`} aria-labelledby={`carrossel-titulo-${variante}`} aria-roledescription="carrossel">
      {ehHome ? (
        <div className="home-section-heading">
          <span className="q-eyebrow">Comunidade Quanton3D</span>
          <h2 id={`carrossel-titulo-${variante}`}>Feito com resina Quanton3D</h2>
          <p>Peças de parceiros e clientes que imprimem com as nossas resinas.</p>
        </div>
      ) : (
        <h3 id={`carrossel-titulo-${variante}`} className="carrossel-titulo-galeria">Destaques da comunidade</h3>
      )}

      <div className="carrossel-moldura">
        <div
          ref={janelaRef}
          className="carrossel-janela"
          onPointerEnter={(e) => { if (e.pointerType === "mouse") estado.current.mouseEmCima = true; }}
          onPointerLeave={() => { estado.current.mouseEmCima = false; estado.current.arrastando = false; }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        >
          <div ref={pistaRef} className="carrossel-pista">
            {faixa.map((peca, i) => {
              const repetida = i >= pecas.length;
              return (
                <button
                  key={`${peca._id || peca.imagem}-${i}`}
                  type="button"
                  className="carrossel-card"
                  onClick={(e) => aoClicarPeca(peca, e)}
                  onDragStart={(e) => e.preventDefault()}
                  tabIndex={repetida ? -1 : 0}
                  aria-hidden={repetida ? "true" : undefined}
                  aria-label={`${peca.observacao || "Peça da comunidade"}${peca.autor ? `, peça de ${peca.autor}` : ""}. ${onAbrirPeca ? "Ampliar a foto" : "Abrir a galeria"}`}
                >
                  <img src={peca.imagem} alt="" draggable="false" loading={i < 6 ? "eager" : "lazy"} />
                  <span className="carrossel-legenda">
                    {peca.autor && <strong>{peca.autor}</strong>}
                    {peca.observacao && <span>{peca.observacao}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" className="carrossel-seta carrossel-seta--esq" onClick={() => andar(-1)} aria-label="Peça anterior"><ChevronLeft size={22} /></button>
        <button type="button" className="carrossel-seta carrossel-seta--dir" onClick={() => andar(1)} aria-label="Próxima peça"><ChevronRight size={22} /></button>
      </div>

      <div className="carrossel-rodape">
        {ehHome && (
          <button type="button" className="q-btn q-btn--primary carrossel-cta" onClick={() => onNavegar && onNavegar("comunidade")}>
            Ver a galeria completa <ArrowRight size={16} />
          </button>
        )}
        <button type="button" className="q-btn q-btn--ghost q-btn--sm carrossel-pausa" onClick={() => setPausadoBotao((v) => !v)} aria-pressed={pausadoBotao}>
          {pausadoBotao ? <><Play size={14} /> Continuar</> : <><Pause size={14} /> Pausar</>}
        </button>
      </div>
    </section>
  );
}

export default CarrosselComunidade;

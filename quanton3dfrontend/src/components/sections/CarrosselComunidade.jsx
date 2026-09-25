import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../lib/api";

// Carrossel da Home com as pecas aprovadas na Galeria da Comunidade.
// Toda peca aprovada no ADM entra aqui sozinha. Com menos de 3 pecas, nao aparece.
const MINIMO_PECAS = 3;
const INTERVALO_MS = 4500;

function CarrosselComunidade({ onNavegar }) {
  const [pecas, setPecas] = useState([]);
  const [pausado, setPausado] = useState(false);
  const trilhoRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    api.get("/gallery")
      .then((res) => {
        const lista = Array.isArray(res.data?.data) ? res.data.data : [];
        if (ativo) setPecas(lista.filter((p) => p.imagem));
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  const passo = useCallback((direcao) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const cartao = trilho.querySelector(".carrossel-card");
    const largura = cartao ? cartao.getBoundingClientRect().width + 14 : trilho.clientWidth;
    const fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
    if (direcao > 0 && fim) trilho.scrollTo({ left: 0, behavior: "smooth" });
    else trilho.scrollBy({ left: direcao * largura, behavior: "smooth" });
  }, []);

  // Passa sozinho; para quando o mouse esta em cima, quando a aba nao esta visivel
  // ou quando a pessoa pediu menos movimento no sistema.
  useEffect(() => {
    if (pausado || pecas.length < MINIMO_PECAS) return undefined;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) return undefined;
    const id = setInterval(() => { if (!document.hidden) passo(1); }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, pecas.length, passo]);

  if (pecas.length < MINIMO_PECAS) return null;

  return (
    <section className="carrossel-comunidade" aria-labelledby="carrossel-titulo">
      <div className="home-section-heading carrossel-topo">
        <div>
          <span className="q-eyebrow">Comunidade Quanton3D</span>
          <h2 id="carrossel-titulo">Feito com resina Quanton3D</h2>
          <p>Peças de parceiros e clientes que imprimem com as nossas resinas.</p>
        </div>
        <div className="carrossel-controles">
          <button type="button" className="carrossel-seta" onClick={() => passo(-1)} aria-label="Peça anterior"><ChevronLeft size={20} /></button>
          <button type="button" className="carrossel-seta" onClick={() => passo(1)} aria-label="Próxima peça"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div
        className="carrossel-trilho"
        ref={trilhoRef}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
        onTouchStart={() => setPausado(true)}
      >
        {pecas.map((peca) => (
          <button
            key={peca._id || peca.imagem}
            type="button"
            className="carrossel-card"
            onClick={() => onNavegar("comunidade")}
            aria-label={`${peca.observacao || "Peça da comunidade"}${peca.autor ? ` — peça de ${peca.autor}` : ""}. Abrir a galeria`}
          >
            <img src={peca.imagem} alt={peca.observacao || `Peça impressa com ${peca.resina || "resina Quanton3D"}`} loading="lazy" />
            <span className="carrossel-legenda">
              {peca.autor && <strong>{peca.autor}</strong>}
              {peca.observacao && <span>{peca.observacao}</span>}
            </span>
          </button>
        ))}
      </div>

      <button type="button" className="q-btn q-btn--primary carrossel-cta" onClick={() => onNavegar("comunidade")}>
        Ver a galeria completa <ArrowRight size={16} />
      </button>
    </section>
  );
}

export default CarrosselComunidade;

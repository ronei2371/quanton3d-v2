import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import api from "../../lib/api";

// Carrossel da Home com as pecas aprovadas na Galeria da Comunidade.
// Toda peca aprovada no ADM entra aqui sozinha. Com menos de 3 pecas, nao aparece.
// A faixa anda sozinha e sem parar (animacao CSS), pausa com o mouse em cima
// e fica parada (rolagem manual) para quem pediu "reduzir movimento" no sistema.
const MINIMO_PECAS = 3;
const SEGUNDOS_POR_PECA = 7;
const MINIMO_CARTOES_POR_VOLTA = 8;

function CarrosselComunidade({ onNavegar }) {
  const [pecas, setPecas] = useState([]);

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

  if (pecas.length < MINIMO_PECAS) return null;

  // Repete a lista ate encher a tela e duplica a volta inteira: a animacao anda
  // exatamente meia faixa (-50%) e recomeca sem emenda aparente.
  const repeticoes = Math.max(1, Math.ceil(MINIMO_CARTOES_POR_VOLTA / pecas.length));
  const volta = Array.from({ length: repeticoes }, () => pecas).flat();
  const faixa = [...volta, ...volta];
  const duracao = `${volta.length * SEGUNDOS_POR_PECA}s`;

  return (
    <section className="carrossel-comunidade" aria-labelledby="carrossel-titulo">
      <div className="home-section-heading">
        <span className="q-eyebrow">Comunidade Quanton3D</span>
        <h2 id="carrossel-titulo">Feito com resina Quanton3D</h2>
        <p>Peças de parceiros e clientes que imprimem com as nossas resinas.</p>
      </div>

      <div className="carrossel-janela">
        <div className="carrossel-pista" style={{ "--carrossel-duracao": duracao }}>
          {faixa.map((peca, i) => {
            const repetida = i >= pecas.length;
            return (
              <button
                key={`${peca._id || peca.imagem}-${i}`}
                type="button"
                className="carrossel-card"
                onClick={() => onNavegar("comunidade")}
                tabIndex={repetida ? -1 : 0}
                aria-hidden={repetida ? "true" : undefined}
                aria-label={`${peca.observacao || "Peça da comunidade"}${peca.autor ? `, peça de ${peca.autor}` : ""}. Abrir a galeria`}
              >
                <img src={peca.imagem} alt="" loading={i < 6 ? "eager" : "lazy"} />
                <span className="carrossel-legenda">
                  {peca.autor && <strong>{peca.autor}</strong>}
                  {peca.observacao && <span>{peca.observacao}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" className="q-btn q-btn--primary carrossel-cta" onClick={() => onNavegar("comunidade")}>
        Ver a galeria completa <ArrowRight size={16} />
      </button>
    </section>
  );
}

export default CarrosselComunidade;

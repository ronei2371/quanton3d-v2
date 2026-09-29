import { useState } from "react";
import { ArrowLeft, BookOpen, Calculator, ClipboardList, MessageCircle, Phone, RotateCcw, Settings2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SINTOMAS, RESULTADOS, GABARITO_QUANTON } from "../data/diagnostico";
import { GUIDES } from "../data/guides";
import { WHATSAPP_SUPORTE_URL } from "../data/contact";
import { trackEvent } from "../utils/analytics";
import api from "../lib/api";

const NOMES_CALCULADORA = {
  exposicao: "Calculadora de Exposição",
  tolerancia: "Calculadora de Tolerância",
  encolhimento: "Calculadora de Encolhimento",
};

// Diagnostico rapido: o cliente escolhe o sintoma, responde 1 ou 2 perguntas e recebe a
// causa provavel com os passos. Nao usa IA e nao conta no limite de perguntas do bot.
function DiagnosticoGuiado({ onAbrirGuia, onAbrirCalculadora, onIrParametros, onAbrirChamado, onAbrirBot }) {
  const [sintoma, setSintoma] = useState(null);
  const [pergunta, setPergunta] = useState(null);
  const [respostas, setRespostas] = useState([]); // [{ pergunta, resposta }]
  const [resultadoId, setResultadoId] = useState(null);

  function recomecar() {
    setSintoma(null); setPergunta(null); setRespostas([]); setResultadoId(null);
  }

  function concluir(s, idResultado, historico) {
    setResultadoId(idResultado);
    setRespostas(historico);
    trackEvent("diagnostico_resultado", { sintoma: s.id, resultado: idResultado });
    // Conta no ADM > Relatório da semana (sem dado pessoal)
    api.post("/visitas/evento", { tipo: "diagnostico", sintoma: s.id, resultado: idResultado }).catch(() => {});
  }

  function escolherSintoma(s) {
    setSintoma(s);
    setRespostas([]);
    if (s.resultadoDireto) { setPergunta(null); concluir(s, s.resultadoDireto, []); return; }
    setResultadoId(null);
    setPergunta(s.inicio);
  }

  function responder(opcao) {
    const atual = sintoma.perguntas[pergunta];
    const historico = [...respostas, { pergunta: atual.texto, resposta: opcao.rotulo }];
    if (opcao.resultado) { concluir(sintoma, opcao.resultado, historico); return; }
    setRespostas(historico);
    setPergunta(opcao.proxima);
  }

  function voltar() {
    if (resultadoId || respostas.length === 0) { recomecar(); return; }
    // volta uma pergunta: refaz o caminho sem a ultima resposta
    const anteriores = respostas.slice(0, -1);
    let id = sintoma.inicio;
    for (const r of anteriores) {
      const op = sintoma.perguntas[id].opcoes.find((o) => o.rotulo === r.resposta);
      id = op?.proxima || id;
    }
    setRespostas(anteriores);
    setPergunta(id);
  }

  const resultado = resultadoId ? RESULTADOS[resultadoId] : null;
  const resumo = sintoma && resultado
    ? [`Sintoma: ${sintoma.titulo}`, ...respostas.map((r) => `${r.pergunta} ${r.resposta}`), `Sugestão do diagnóstico: ${resultado.titulo}`].join(" | ")
    : "";
  const linkWhatsapp = resumo
    ? `${WHATSAPP_SUPORTE_URL}?text=${encodeURIComponent(`Olá! Fiz o diagnóstico rápido no site da Quanton3D e não resolveu.\n${resumo.split(" | ").join("\n")}`)}`
    : WHATSAPP_SUPORTE_URL;

  // 1) Escolha do sintoma
  if (!sintoma) {
    return (
      <div className="diag">
        <p className="diag-intro">Escolha o que aconteceu com a sua peça. Em uma ou duas perguntas você recebe a causa mais provável e o que fazer, pelo método Quanton3D.</p>
        <div className="diag-sintomas">
          {SINTOMAS.map((s) => (
            <button key={s.id} type="button" className="diag-sintoma" onClick={() => escolherSintoma(s)}>
              {s.titulo}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2) Pergunta
  if (!resultado) {
    const atual = sintoma.perguntas[pergunta];
    return (
      <div className="diag">
        <button type="button" className="diag-voltar" onClick={voltar}><ArrowLeft size={15} /> Voltar</button>
        <span className="diag-sintoma-atual">{sintoma.titulo}</span>
        <h3 className="diag-pergunta">{atual.texto}</h3>
        <div className="diag-opcoes">
          {atual.opcoes.map((o) => (
            <button key={o.rotulo} type="button" className="diag-opcao" onClick={() => responder(o)}>{o.rotulo}</button>
          ))}
        </div>
      </div>
    );
  }

  // 3) Resultado
  const guias = (resultado.guias || []).map((k) => GUIDES[k] && { ...GUIDES[k], chave: k }).filter(Boolean);
  return (
    <div className="diag">
      <button type="button" className="diag-voltar" onClick={recomecar}><RotateCcw size={15} /> Fazer outro diagnóstico</button>
      <span className="diag-sintoma-atual">{sintoma.titulo}{respostas.length ? ` · ${respostas.map((r) => r.resposta).join(" · ")}` : ""}</span>

      <div className="diag-resultado" aria-live="polite">
        <span className="diag-rotulo">Causa mais provável</span>
        <h3 className="diag-causa">{resultado.titulo}</h3>
        <ol className="diag-passos">
          {resultado.passos.map((p) => <li key={p}><CheckCircle2 size={16} aria-hidden="true" /> <span>{p}</span></li>)}
        </ol>
        {resultado.gabarito && <p className="diag-gabarito">{GABARITO_QUANTON}</p>}
        {resultado.aviso && <p className="diag-aviso"><AlertTriangle size={16} aria-hidden="true" /> <span>{resultado.aviso}</span></p>}
        {resultado.extra && <p className="diag-extra">{resultado.extra}</p>}

        <div className="diag-ferramentas">
          {resultado.parametros && onIrParametros && (
            <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={onIrParametros}><Settings2 size={14} /> Ver perfil oficial</button>
          )}
          {resultado.calculadora && onAbrirCalculadora && (
            <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={() => onAbrirCalculadora(resultado.calculadora)}><Calculator size={14} /> {NOMES_CALCULADORA[resultado.calculadora] || "Calculadora"}</button>
          )}
          {onAbrirGuia && guias.map((g) => (
            <button key={g.chave} type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={() => onAbrirGuia(g)}><BookOpen size={14} /> Guia: {g.title}</button>
          ))}
        </div>
      </div>

      <div className="diag-nao-resolveu">
        <strong>Não resolveu?</strong>
        <div className="diag-acoes">
          {onAbrirChamado && (
            <button type="button" className="q-btn q-btn--primary q-btn--sm" onClick={() => onAbrirChamado({ problema: resultado.chamado, resumo })}><ClipboardList size={14} /> Abrir chamado com este diagnóstico</button>
          )}
          {onAbrirBot && (
            <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={onAbrirBot}><MessageCircle size={14} /> Perguntar à IAQ3D</button>
          )}
          <a className="q-btn q-btn--whatsapp q-btn--sm" href={linkWhatsapp} target="_blank" rel="noreferrer"><Phone size={14} /> WhatsApp com o resumo</a>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticoGuiado;

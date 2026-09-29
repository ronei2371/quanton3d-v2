import { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { SINTOMAS, RESULTADOS } from "../../data/diagnostico";

// ADM > Relatório da semana: o que os clientes perguntaram, resinas/impressoras citadas,
// chamados, diagnósticos rápidos e o que o bot não soube. Só lê o banco (não gasta IA).

const NOME_SINTOMA = Object.fromEntries(SINTOMAS.map((s) => [s.id, s.titulo]));
const NOME_RESULTADO = Object.fromEntries(Object.entries(RESULTADOS).map(([id, r]) => [id, r.titulo]));

const COR = { texto: "#eaf3ff", suave: "#9fb4c7", azul: "#0092ff", verde: "#0aff87", laranja: "#dc913c", vermelho: "#d73c3c", borda: "rgba(113,159,219,0.2)" };

function dataCurta(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Variacao({ valor }) {
  if (valor === null || valor === undefined) return <span style={{ color: COR.suave }}>novo</span>;
  if (valor === 0) return <span style={{ color: COR.suave }}>igual</span>;
  const sobe = valor > 0;
  return <span style={{ color: sobe ? COR.verde : COR.laranja }}>{sobe ? "▲" : "▼"} {Math.abs(valor)}%</span>;
}

function Numero({ rotulo, valor, variacao, cor = COR.azul, dica }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: `1px solid ${COR.borda}` }} title={dica}>
      <strong style={{ fontSize: "1.45rem", color: cor, display: "block", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{valor}</strong>
      <span style={{ fontSize: "0.72rem", color: COR.suave, fontWeight: 600, display: "block" }}>{rotulo}</span>
      {variacao === null && <span style={{ fontSize: "0.68rem", color: COR.suave }}>semana anterior: 0</span>}
      {variacao !== undefined && variacao !== null && <span style={{ fontSize: "0.68rem", fontWeight: 700 }}><Variacao valor={variacao} /> <span style={{ color: COR.suave, fontWeight: 500 }}>vs. semana anterior</span></span>}
    </div>
  );
}

function Barras({ titulo, itens, nome = (n) => n, cor = COR.azul, vazio = "Nada nesta semana." }) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COR.borda}`, borderRadius: "12px", padding: "14px" }}>
      <p style={{ margin: "0 0 10px", fontWeight: 800, color: COR.texto, fontSize: "0.85rem" }}>{titulo}</p>
      {itens.length === 0 && <p style={{ margin: 0, color: COR.suave, fontSize: "0.8rem" }}>{vazio}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {itens.map((i) => (
          <div key={i.nome} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 10px", alignItems: "center" }}>
            <span style={{ color: COR.texto, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={nome(i.nome)}>{nome(i.nome)}</span>
            <strong style={{ color: COR.texto, fontSize: "0.8rem", fontVariantNumeric: "tabular-nums" }}>{i.total}</strong>
            <div style={{ gridColumn: "1 / -1", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${(i.total / max) * 100}%`, height: "100%", borderRadius: "999px", background: cor }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function textoParaCopiar(r) {
  const s = r.resumo;
  const linhas = [
    `Relatório Quanton3D — ${dataCurta(r.periodo.inicio)} a ${dataCurta(r.periodo.fim)}`,
    `Perguntas à IA: ${s.perguntasIA} | Clientes que usaram o bot: ${s.clientesAtivos} | Novos cadastros: ${s.novosClientes}`,
    `Chamados: ${s.chamados} | Diagnósticos rápidos: ${s.diagnosticos} | Bot não soube: ${s.botNaoSoube} (${s.botNaoSoubePendentes} para ensinar)`,
    `Ajudou: ${s.ajudou} | Não ajudou: ${s.naoAjudou} | Custo da IA: R$ ${s.custoIABRL.toFixed(2).replace(".", ",")}`,
    "",
    "Assuntos mais perguntados:",
    ...r.temas.slice(0, 6).map((t) => `- ${t.rotulo}: ${t.total}`),
  ];
  if (r.resinas.length) linhas.push("", "Resinas mais citadas: " + r.resinas.map((x) => `${x.nome} (${x.total})`).join(", "));
  if (r.impressoras.length) linhas.push("Impressoras mais citadas: " + r.impressoras.map((x) => `${x.nome} (${x.total})`).join(", "));
  return linhas.join("\n");
}

export default function RelatorioSemanal({ token, onVerLacunas }) {
  const [semana, setSemana] = useState(0);
  const [rel, setRel] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async (n) => {
    try {
      setCarregando(true); setErro("");
      const res = await api.get("/admin/relatorio-semanal", { headers: { Authorization: "Bearer " + token }, params: { semana: n } });
      setRel(res.data);
    } catch {
      setErro("Não consegui carregar o relatório. Tente de novo em instantes.");
    } finally { setCarregando(false); }
  }, [token]);

  useEffect(() => { carregar(semana); }, [semana, carregar]);

  async function copiar() {
    if (!rel) return;
    try { await navigator.clipboard.writeText(textoParaCopiar(rel)); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
    catch { setErro("Não consegui copiar. Selecione o texto e copie manualmente."); }
  }

  const s = rel?.resumo;
  const botao = { padding: "7px 14px", borderRadius: "8px", border: `1px solid ${COR.borda}`, background: "rgba(79,209,255,0.08)", color: COR.azul, cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        <button type="button" style={botao} onClick={() => setSemana((n) => n + 1)} disabled={carregando}>‹ Semana anterior</button>
        <strong style={{ color: COR.texto, fontSize: "0.95rem", padding: "0 6px" }}>
          {rel ? `${dataCurta(rel.periodo.inicio)} a ${dataCurta(rel.periodo.fim)}` : "…"}{semana === 0 ? " · últimos 7 dias" : ""}
        </strong>
        <button type="button" style={{ ...botao, opacity: semana === 0 ? 0.4 : 1, cursor: semana === 0 ? "not-allowed" : "pointer" }} onClick={() => setSemana((n) => Math.max(0, n - 1))} disabled={semana === 0 || carregando}>Próxima ›</button>
        <button type="button" style={{ ...botao, marginLeft: "auto", color: copiado ? COR.verde : COR.azul }} onClick={copiar} disabled={!rel}>{copiado ? "✓ Copiado" : "📋 Copiar resumo"}</button>
      </div>

      {erro && <p style={{ color: COR.vermelho, fontSize: "0.85rem" }}>{erro}</p>}
      {carregando && !rel && <p style={{ color: COR.suave, fontSize: "0.85rem" }}>Carregando…</p>}

      {s && (
        <div style={{ opacity: carregando ? 0.5 : 1, transition: "opacity 0.2s" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "10px", marginBottom: "14px" }}>
            <Numero rotulo="Perguntas respondidas pela IA" valor={s.perguntasIA} variacao={s.perguntasIAVariacao} />
            <Numero rotulo="Clientes que usaram o bot" valor={s.clientesAtivos} />
            <Numero rotulo="Novos cadastros" valor={s.novosClientes} variacao={s.novosClientesVariacao} cor={COR.verde} />
            <Numero rotulo="Diagnósticos rápidos" valor={s.diagnosticos} variacao={s.diagnosticosVariacao} dica="Feitos na aba Atendimento > Diagnóstico rápido (sem IA)" />
            <Numero rotulo="Chamados técnicos" valor={s.chamados} variacao={s.chamadosVariacao} cor={COR.laranja} />
            <Numero rotulo="Custo da IA na semana" valor={"R$ " + s.custoIABRL.toFixed(2).replace(".", ",")} cor={COR.verde} dica="Estimado pelos tokens de cada resposta" />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
            <span style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(10,255,135,0.08)", border: "1px solid rgba(10,255,135,0.25)", color: COR.verde, fontSize: "0.78rem", fontWeight: 800 }}>👍 Ajudou: {s.ajudou}</span>
            <span style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", color: COR.vermelho, fontSize: "0.78rem", fontWeight: 800 }}>👎 Não ajudou: {s.naoAjudou}</span>
            <span style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.04)", border: `1px solid ${COR.borda}`, color: COR.suave, fontSize: "0.78rem", fontWeight: 700 }}>Respostas rápidas (sem IA): {s.respostasFixas}</span>
            {s.botNaoSoube > 0 && (
              <button type="button" onClick={onVerLacunas} style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(255,209,102,0.1)", border: "1px solid rgba(255,209,102,0.4)", color: COR.laranja, fontSize: "0.78rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                🕳️ Bot não soube: {s.botNaoSoube}{s.botNaoSoubePendentes ? ` · ${s.botNaoSoubePendentes} para ensinar →` : ""}
              </button>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COR.borda}`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 800, color: COR.texto, fontSize: "0.85rem" }}>Assuntos que os clientes mais perguntaram à IA</p>
            <p style={{ margin: "0 0 12px", color: COR.suave, fontSize: "0.74rem" }}>Separado pelas palavras da pergunta; com exemplos reais da semana.</p>
            {rel.temas.length === 0 && <p style={{ margin: 0, color: COR.suave, fontSize: "0.8rem" }}>Nenhuma pergunta à IA nesta semana.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "10px" }}>
              {rel.temas.map((t) => (
                <div key={t.id} style={{ borderLeft: `3px solid ${t.id === "outros" ? COR.borda : COR.azul}`, padding: "4px 0 4px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <strong style={{ color: COR.texto, fontSize: "0.84rem" }}>{t.rotulo}</strong>
                    <strong style={{ color: COR.azul, fontSize: "0.84rem", fontVariantNumeric: "tabular-nums" }}>{t.total}</strong>
                  </div>
                  {t.exemplos.map((e) => <p key={e} style={{ margin: "3px 0 0", color: COR.suave, fontSize: "0.75rem", lineHeight: 1.4 }}>“{e}”</p>)}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "10px" }}>
            <Barras titulo="Resinas mais citadas" itens={rel.resinas} cor="#9650f5" vazio="Nenhuma resina citada." />
            <Barras titulo="Impressoras mais citadas" itens={rel.impressoras} cor={COR.azul} vazio="Nenhuma impressora citada." />
            <Barras titulo="Chamados por problema" itens={rel.chamadosPorProblema} cor={COR.laranja} vazio="Nenhum chamado nesta semana." />
            <Barras titulo="Diagnóstico rápido: sintomas" itens={rel.diagnosticosPorSintoma} nome={(n) => NOME_SINTOMA[n] || n} cor={COR.verde} vazio="Ninguém usou o diagnóstico rápido nesta semana." />
            <Barras titulo="Diagnóstico rápido: causas indicadas" itens={rel.diagnosticosPorResultado} nome={(n) => NOME_RESULTADO[n] || n} cor={COR.verde} vazio="—" />
          </div>
          <p style={{ margin: "12px 0 0", color: COR.suave, fontSize: "0.72rem", lineHeight: 1.5 }}>
            Não entram as conversas do teste automático (Homologacao IAQ3D). Os diagnósticos rápidos começaram a ser contados em 29/09/2026.
          </p>
        </div>
      )}
    </div>
  );
}

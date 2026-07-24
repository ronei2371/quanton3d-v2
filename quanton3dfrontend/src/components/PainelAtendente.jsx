import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

function PainelAtendente({ atendente, onClose }) {
  const p = atendente.permissoes || {};
  // Usa permissões reais do backend — mudarStatusChamados, sugerirConhecimento, acessarMetricas
  const podeChamados = p.mudarStatusChamados !== false;
  const podeMensagens = true; // todos atendentes veem mensagens
  const podeClientes = p.acessarMetricas || p.acessoAdmCompleto || true;
  const podeSugestoes = p.sugerirConhecimento !== false;
  const primeiraAba = podeChamados ? "chamados" : podeMensagens ? "mensagens" : podeSugestoes ? "sugestoes" : "chamados";
  const [aba, setAba] = useState(primeiraAba);
  const [dados, setDados] = useState({ chamados: [], mensagens: [], clientes: [] });
  const [carregando, setCarregando] = useState(true);
  const token = localStorage.getItem("quanton3d_atendente_token");

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const headers = { Authorization: "Bearer " + token };
        const [ch, msg, cl] = await Promise.all([
          api.get("/bot-tickets", { headers }),
          api.get("/contact-messages", { headers }),
          api.get("/clientes", { headers }),
        ]);
        setDados({
          chamados: ch.data?.botTickets || ch.data?.tickets || [],
          mensagens: msg.data?.contactMessages || [],
          clientes: cl.data?.clientes || cl.data?.data || [],
        });
      } catch (err) { console.error(err); }
      finally { setCarregando(false); }
    }
    carregar();
  }, []);

  const [sugestoes, setSugestoes] = useState([]);
  const [formSugestao, setFormSugestao] = useState({ categoria: "dica", titulo: "", conteudo: "" });
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);

  useEffect(() => {
    async function carregarSugestoes() {
      try {
        const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
        setSugestoes(r.data?.sugestoes || []);
      } catch(_) {}
    }
    carregarSugestoes();
  }, []);

  async function enviarSugestao() {
    if (!formSugestao.titulo.trim() || !formSugestao.conteudo.trim()) { alert("Preencha título e conteúdo."); return; }
    try {
      setEnviandoSugestao(true);
      await api.post("/sugestoes-conhecimento", {
        ...formSugestao,
        codigoAtendente: atendente.codigo,
        nomeAtendente: atendente.nome,
      }, { headers: { Authorization: "Bearer " + token } });
      setFormSugestao({ categoria: "dica", titulo: "", conteudo: "" });
      const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
      setSugestoes(r.data?.sugestoes || []);
      alert("Sugestão enviada! O administrador será notificado.");
    } catch(e) { alert("Erro ao enviar sugestão."); }
    finally { setEnviandoSugestao(false); }
  }

  const ABAS = [
    podeChamados  && { id: "chamados",  label: "🔧 Chamados",  count: dados.chamados.length },
    podeMensagens && { id: "mensagens", label: "✉️ Mensagens", count: dados.mensagens.length },
    podeClientes  && { id: "clientes",  label: "👥 Clientes",  count: dados.clientes.length },
    podeSugestoes && { id: "sugestoes", label: "💡 Sugestões", count: sugestoes.length },
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#eaf3ff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(79,209,255,0.2)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, background: "linear-gradient(135deg,#4fd1ff,#b89cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📋 Painel do Atendente
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9fb4c7" }}>
            👨‍💼 {atendente.codigo} — {atendente.nome}
          </p>
        </div>
        <button type="button" onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff8fab", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
          Fechar
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {ABAS.map(a => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            style={{ padding: "10px 18px", borderRadius: "999px", border: aba === a.id ? "2px solid #4fd1ff" : "1px solid rgba(113,159,219,0.3)", background: aba === a.id ? "rgba(79,209,255,0.15)" : "rgba(255,255,255,0.04)", color: aba === a.id ? "#4fd1ff" : "#9fb4c7", cursor: "pointer", fontWeight: 800, fontFamily: "inherit", fontSize: "0.82rem" }}>
            {a.label} ({a.count})
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {carregando && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Carregando...</div>}

        {/* CHAMADOS */}
        {!carregando && aba === "chamados" && (
          <div>
            {dados.chamados.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Nenhum chamado.</div>}
            {dados.chamados.map(c => {
              const statusCores = { novo: { bg: "rgba(255,209,102,0.12)", border: "rgba(255,209,102,0.35)", color: "#ffd166", label: "Novo" }, em_analise: { bg: "rgba(79,209,255,0.12)", border: "rgba(79,209,255,0.35)", color: "#4fd1ff", label: "Em análise" }, respondido: { bg: "rgba(184,156,255,0.12)", border: "rgba(184,156,255,0.35)", color: "#b89cff", label: "Respondido" }, fechado: { bg: "rgba(73,230,139,0.12)", border: "rgba(73,230,139,0.35)", color: "#49e68b", label: "Resolvido" }, encaminhado: { bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.35)", color: "#ff8fab", label: "Encaminhado" } };
              const st = statusCores[c.status] || statusCores.novo;
              const mudarStatus = async (novoStatus) => {
                try {
                  await api.patch("/bot-tickets/" + c._id + "/status", { status: novoStatus }, { headers: { Authorization: "Bearer " + token } });
                  const r = await api.get("/bot-tickets", { headers: { Authorization: "Bearer " + token } });
                  setDados(prev => ({ ...prev, chamados: r.data?.botTickets || [] }));
                } catch(e) { alert("Erro ao atualizar status"); }
              };
              return (
              <div key={c._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px", color: "#eaf3ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <strong>{c.nome || "Cliente"}</strong>
                    <div style={{ fontSize: "0.72rem", color: "#9fb4c7" }}>📱 {c.telefone} · ✉️ {c.email || "-"}</div>
                  </div>
                  <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px", background: st.bg, border: "1px solid " + st.border, color: st.color, fontWeight: 800 }}>{st.label}</span>
                </div>
                {c.resina && <div style={{ fontSize: "0.78rem", color: "#4fd1ff", marginBottom: "4px" }}>🧪 {c.resina} {c.impressora ? "· 🖨️ " + c.impressora : ""}</div>}
                <div style={{ fontSize: "0.8rem", color: "#b8cfe8", marginBottom: "8px" }}>
                  🔧 {c.problema || "Sem descrição"}
                  {c.descricao && <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#9fb4c7" }}>{c.descricao}</p>}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (c.nome||"") + ", vi seu chamado sobre " + (c.problema||c.resina||"") + ". Posso ajudar!")}
                    target="_blank" rel="noreferrer"
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.1)", color: "#25d366", fontSize: "0.75rem", fontWeight: 800, textDecoration: "none" }}>
                    💬 WhatsApp
                  </a>
                  {atendente.permissoes?.mudarStatusChamados !== false && <>
                  <button type="button" onClick={() => mudarStatus("em_analise")} disabled={c.status === "em_analise"}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.1)", color: "#ffd166", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "em_analise" ? 0.4 : 1 }}>
                    🔍 Em análise
                  </button>
                  <button type="button" onClick={() => mudarStatus("fechado")} disabled={c.status === "fechado"}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#49e68b", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "fechado" ? 0.4 : 1 }}>
                    ✅ Resolvido
                  </button>
                  </>}
                  {atendente.permissoes?.mudarStatusChamados !== false && c.status === "fechado" && (
                    <button type="button" onClick={() => mudarStatus("novo")}
                      style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                      ↩️ Reabrir
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* MENSAGENS */}
        {!carregando && aba === "mensagens" && (
          <div>
            {dados.mensagens.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Nenhuma mensagem.</div>}
            {dados.mensagens.map(m => (
              <div key={m._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px", color: "#eaf3ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong>{m.nome}</strong>
                  <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "999px", background: m.status === "resolvido" ? "rgba(73,230,139,0.15)" : "rgba(255,209,102,0.15)", color: m.status === "resolvido" ? "#49e68b" : "#ffd166" }}>{m.status || "pendente"}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginBottom: "6px" }}>📱 {m.telefone} · ✉️ {m.email}</div>
                <div style={{ fontSize: "0.82rem", color: "#b8cfe8", marginBottom: "8px" }}>{m.assunto}: {m.mensagem}</div>
                <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (m.nome||"") + ", recebi sua mensagem sobre " + (m.assunto||"") + ". Posso ajudar!")}
                  target="_blank" rel="noreferrer"
                  style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.1)", color: "#25d366", fontSize: "0.75rem", fontWeight: 800, textDecoration: "none" }}>
                  💬 WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

        {/* SUGESTÕES DE CONHECIMENTO */}
        {!carregando && aba === "sugestoes" && (
          <div>
            <div style={{ border: "1px solid rgba(79,209,255,0.2)", borderRadius: "12px", padding: "16px", background: "rgba(79,209,255,0.04)", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>💡 Sugerir conhecimento pro ELIO</p>
              <div style={{ display: "grid", gap: "10px" }}>
                <select value={formSugestao.categoria} onChange={e => setFormSugestao(f => ({ ...f, categoria: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem" }}>
                  <option value="resina">🧪 Resina</option>
                  <option value="impressora">🖨️ Impressora</option>
                  <option value="problema">⚠️ Problema/Solução</option>
                  <option value="dica">💡 Dica Técnica</option>
                  <option value="outro">📝 Outro</option>
                </select>
                <input placeholder="Título (ex: Iron não adere em Elegoo Mars 3)" value={formSugestao.titulo}
                  onChange={e => setFormSugestao(f => ({ ...f, titulo: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem" }} />
                <textarea rows={4} placeholder="Conteúdo detalhado que o ELIO deveria saber..." value={formSugestao.conteudo}
                  onChange={e => setFormSugestao(f => ({ ...f, conteudo: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem", resize: "vertical" }} />
                <button type="button" onClick={enviarSugestao} disabled={enviandoSugestao}
                  style={{ padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, rgba(21,101,192,0.4), rgba(79,209,255,0.2))", color: "#eaf7ff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
                  {enviandoSugestao ? "Enviando..." : "📤 Enviar Sugestão"}
                </button>
              </div>
            </div>
            {sugestoes.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "20px" }}>Nenhuma sugestão enviada ainda.</div>}
            {sugestoes.map(s => {
              const cores = { pendente: "#ffd166", aprovado: "#49e68b", rejeitado: "#ff8fab" };
              return (
                <div key={s._id} style={{ border: "1px solid rgba(113,159,219,0.18)", borderRadius: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.04)", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.88rem", color: "#eaf3ff" }}>{s.titulo}</strong>
                    <span style={{ fontSize: "0.7rem", padding: "2px 10px", borderRadius: "999px", background: `${cores[s.status]}20`, color: cores[s.status], fontWeight: 800 }}>
                      {s.status === "pendente" ? "⏳ Pendente" : s.status === "aprovado" ? "✅ Aprovado" : "❌ Rejeitado"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#7dd3fc", marginBottom: "6px" }}>{s.categoria}</div>
                  <p style={{ fontSize: "0.8rem", color: "#b8cfe8", margin: 0, lineHeight: 1.5 }}>{s.conteudo}</p>
                  {s.observacaoAdmin && <p style={{ fontSize: "0.75rem", color: "#ffd166", margin: "8px 0 0", fontStyle: "italic" }}>Admin: {s.observacaoAdmin}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* CLIENTES */}
        {!carregando && aba === "clientes" && (
          <div>
            {dados.clientes.length === 0 && <div style={{ textAlign: "center", color: "#9pb4c7", padding: "30px" }}>Nenhum cliente.</div>}
            {dados.clientes.filter(c => c && c._id).map(c => (
              <div key={c._id} style={{ border: "1px solid rgba(113,159,219,0.18)", borderRadius: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.04)", marginBottom: "8px", color: "#eaf3ff" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.88rem" }}>{c.nome}</strong>
                  <small style={{ color: "#6b8aad", fontSize: "0.7rem" }}>{c.origem}</small>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "4px" }}>
                  📱 {c.telefone} · ✉️ {c.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PainelAtendente;

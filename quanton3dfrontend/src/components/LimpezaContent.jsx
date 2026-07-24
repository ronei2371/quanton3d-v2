import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

function LimpezaContent({ token }) {
  const COLECOES = [
    { id: "clientes",        label: "👥 Clientes",          desc: "Cadastros de entrada do site" },
    { id: "visitas",         label: "👁️ Visitas",           desc: "Registros de visitas ao site" },
    { id: "conversas",       label: "💬 Conversas ELIO",    desc: "Histórico de conversas com o bot" },
    { id: "bottickets",      label: "🔧 Chamados",          desc: "Chamados técnicos abertos" },
    { id: "contactmessages", label: "✉️ Mensagens",         desc: "Mensagens de contato" },
    { id: "formulacoes",     label: "🧪 Formulações",       desc: "Pedidos de formulação" },
    { id: "logacoes",        label: "📋 Logs de Ações",     desc: "Logs de ações dos atendentes" },
    { id: "partnerrequests", label: "🤝 Parceiros",         desc: "Pedidos de parceria" },
    { id: "galleryitems",    label: "📸 Fotos da Galeria",  desc: "Fotos enviadas por clientes" },
  ];
  const [selecionadas, setSelecionadas] = useState([]);
  const [confirmando, setConfirmando]   = useState(false);
  const [limpando, setLimpando]         = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [confirmInput, setConfirmInput] = useState("");

  function toggleCol(id) {
    setSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function executarLimpeza() {
    if (confirmInput !== "LIMPAR") { alert('Digite "LIMPAR" para confirmar'); return; }
    try {
      setLimpando(true);
      const r = await api.delete("/admin/limpar-testes", {
        data: { colecoes: selecionadas },
        headers: { Authorization: "Bearer " + token }
      });
      setResultado(r.data.resultados);
      setConfirmando(false);
      setConfirmInput("");
      setSelecionadas([]);
    } catch(e) {
      alert("Erro: " + (e.response?.data?.error || e.message));
    } finally { setLimpando(false); }
  }

  return (
    <div>
      <div style={{ background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "12px", padding: "16px 18px", marginBottom: "20px" }}>
        <p style={{ fontWeight: 900, color: "#ff8fab", fontSize: "0.9rem", margin: "0 0 6px" }}>⚠️ Limpeza de Dados</p>
        <p style={{ fontSize: "0.82rem", color: "#c49aab", margin: 0 }}>Selecione as coleções que deseja limpar. <strong style={{ color: "#ff8fab" }}>Esta ação é irreversível!</strong> Os parâmetros do ELIO, atendentes e sugestões aprovadas nunca são afetados.</p>
      </div>

      {resultado && (
        <div style={{ background: "rgba(73,230,139,0.07)", border: "1px solid rgba(73,230,139,0.25)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontWeight: 800, color: "#49e68b", margin: "0 0 8px" }}>✅ Limpeza concluída!</p>
          {Object.entries(resultado).map(([col, qtd]) => (
            <p key={col} style={{ fontSize: "0.82rem", color: "#9fcfad", margin: "3px 0" }}>
              {COLECOES.find(c => c.id === col)?.label || col}: <strong>{qtd} registros removidos</strong>
            </p>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {COLECOES.map(c => (
          <label key={c.id} onClick={() => toggleCol(c.id)}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${selecionadas.includes(c.id) ? "rgba(255,107,107,0.4)" : "rgba(113,159,219,0.2)"}`, background: selecionadas.includes(c.id) ? "rgba(255,107,107,0.07)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
            <input type="checkbox" checked={selecionadas.includes(c.id)} onChange={() => {}} style={{ accentColor: "#ff8fab", width: "16px", height: "16px" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eaf3ff" }}>{c.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#9fb4c7" }}>{c.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={() => setSelecionadas(COLECOES.map(c => c.id))}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Selecionar tudo
        </button>
        <button type="button" onClick={() => setSelecionadas([])}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Limpar seleção
        </button>
      </div>

      {selecionadas.length > 0 && !confirmando && (
        <button type="button" onClick={() => setConfirmando(true)}
          style={{ marginTop: "14px", width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.12)", color: "#ff8fab", fontWeight: 900, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" }}>
          🗑️ Limpar {selecionadas.length} coleção(ões) selecionada(s)
        </button>
      )}

      {confirmando && (
        <div style={{ marginTop: "14px", padding: "16px", borderRadius: "12px", border: "2px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.06)" }}>
          <p style={{ color: "#ff8fab", fontWeight: 800, margin: "0 0 10px", fontSize: "0.9rem" }}>⚠️ Confirmação final — esta ação NÃO pode ser desfeita!</p>
          <p style={{ color: "#c49aab", fontSize: "0.82rem", margin: "0 0 12px" }}>Digite <strong style={{ color: "#ff8fab" }}>LIMPAR</strong> para confirmar:</p>
          <input value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
            placeholder='Digite: LIMPAR'
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={executarLimpeza} disabled={limpando || confirmInput !== "LIMPAR"}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: confirmInput === "LIMPAR" ? "#dc2626" : "rgba(255,107,107,0.2)", color: "#fff", fontWeight: 900, cursor: confirmInput === "LIMPAR" ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.88rem" }}>
              {limpando ? "Limpando..." : "✅ Confirmar Limpeza"}
            </button>
            <button type="button" onClick={() => { setConfirmando(false); setConfirmInput(""); }}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default LimpezaContent;

import { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";

// ADM > Cópia de segurança. O MongoDB Atlas gratuito não faz backup sozinho:
// o administrador baixa o banco inteiro (1 arquivo) e guarda fora do site.

const COR = { texto: "#eaf3ff", suave: "#9fb4c7", azul: "#0092ff", verde: "#0aff87", laranja: "#dc913c", vermelho: "#d73c3c", borda: "rgba(113,159,219,0.2)" };

function diasDesde(data) {
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
}

export default function CopiaSeguranca({ token }) {
  const [status, setStatus] = useState(null);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(false);
  const [ok, setOk] = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const r = await api.get("/admin/backup/status", { headers: { Authorization: "Bearer " + token } });
      setStatus(r.data);
    } catch (e) {
      setErro(e?.response?.status === 403 ? "Só o administrador principal (login do ADM) pode baixar a cópia de segurança." : "Não consegui ler o status da cópia. Tente de novo.");
    }
  }, [token]);

  useEffect(() => { carregar(); }, [carregar]);

  async function baixar() {
    try {
      setBaixando(true); setErro(""); setOk("");
      const r = await api.get("/admin/backup", { headers: { Authorization: "Bearer " + token }, responseType: "blob", timeout: 300000 });
      const nome = /filename="([^"]+)"/.exec(r.headers?.["content-disposition"] || "")?.[1] || `quanton3d-backup-${new Date().toISOString().slice(0, 10)}.ndjson.gz`;
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = nome;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setOk(`Cópia baixada: ${nome} (${(r.data.size / 1048576).toFixed(1).replace(".", ",")} MB). Guarde no computador e no Google Drive.`);
      setTimeout(carregar, 800);
    } catch (e) {
      setErro(e?.response?.status === 403 ? "Só o administrador principal (login do ADM) pode baixar a cópia de segurança." : "Não consegui gerar a cópia agora. Tente de novo em alguns minutos.");
    } finally { setBaixando(false); }
  }

  const dias = status?.ultimo ? diasDesde(status.ultimo.em) : null;
  const atrasado = dias === null || dias > 7;

  return (
    <div style={{ maxWidth: "820px" }}>
      <div style={{ background: "rgba(79,209,255,0.06)", border: `1px solid ${COR.borda}`, borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 800, color: COR.texto, fontSize: "0.95rem" }}>Por que baixar?</p>
        <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.85rem", lineHeight: 1.6 }}>
          O banco do site (MongoDB Atlas gratuito) <strong>não faz cópia de segurança sozinho</strong>. Se algum dado for apagado por engano
          (parâmetros, clientes, conhecimento do bot, galeria), só dá para recuperar com uma cópia guardada. Baixe <strong>uma vez por semana</strong> e
          sempre antes de usar a aba Limpeza.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: "10px", marginBottom: "14px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: `1px solid ${atrasado ? "rgba(255,209,102,0.45)" : "rgba(10,255,135,0.3)"}` }}>
          <strong style={{ fontSize: "1.2rem", color: atrasado ? COR.laranja : COR.verde, display: "block" }}>
            {status?.ultimo ? (dias === 0 ? "Hoje" : dias === 1 ? "Ontem" : `Há ${dias} dias`) : "Nunca"}
          </strong>
          <span style={{ fontSize: "0.72rem", color: COR.suave }}>Última cópia baixada{status?.ultimo ? ` (${new Date(status.ultimo.em).toLocaleDateString("pt-BR")})` : ""}</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: `1px solid ${COR.borda}` }}>
          <strong style={{ fontSize: "1.2rem", color: COR.azul, display: "block", fontVariantNumeric: "tabular-nums" }}>{status ? status.documentos.toLocaleString("pt-BR") : "…"}</strong>
          <span style={{ fontSize: "0.72rem", color: COR.suave }}>Registros no banco ({status?.colecoes ?? "…"} coleções)</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: `1px solid ${COR.borda}` }}>
          <strong style={{ fontSize: "1.2rem", color: COR.azul, display: "block" }}>{status?.tamanhoMB != null ? `${String(status.tamanhoMB).replace(".", ",")} MB` : "…"}</strong>
          <span style={{ fontSize: "0.72rem", color: COR.suave }}>Tamanho dos dados (o plano gratuito vai até 512 MB)</span>
        </div>
      </div>

      {atrasado && status && (
        <p style={{ margin: "0 0 12px", color: COR.laranja, fontSize: "0.85rem", fontWeight: 700 }}>
          {status.ultimo ? "Faz mais de uma semana desde a última cópia." : "Ainda não há nenhuma cópia baixada."} Baixe agora.
        </p>
      )}

      <button type="button" onClick={baixar} disabled={baixando}
        style={{ padding: "12px 20px", borderRadius: "10px", border: "none", background: baixando ? "rgba(79,209,255,0.2)" : "linear-gradient(135deg,#0092ff,#9650f5)", color: "#fff", fontWeight: 800, fontSize: "0.92rem", cursor: baixando ? "wait" : "pointer", fontFamily: "inherit" }}>
        {baixando ? "Gerando a cópia… (pode levar 1 minuto)" : "💾 Baixar cópia de segurança completa"}
      </button>

      {ok && <p style={{ margin: "12px 0 0", color: COR.verde, fontSize: "0.85rem", fontWeight: 700 }}>✓ {ok}</p>}
      {erro && <p style={{ margin: "12px 0 0", color: COR.vermelho, fontSize: "0.85rem", fontWeight: 700 }}>{erro}</p>}

      <div style={{ marginTop: "18px", color: COR.suave, fontSize: "0.78rem", lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 6px" }}><strong style={{ color: COR.texto }}>Onde guardar:</strong> no computador e numa pasta do Google Drive. Guarde as últimas 4 cópias. O arquivo tem dados de clientes (nome, telefone, e-mail): não mande para ninguém.</p>
        <p style={{ margin: 0 }}><strong style={{ color: COR.texto }}>Para restaurar:</strong> em caso de perda de dados, chame o suporte técnico com o arquivo. A restauração usa o script <code>scripts/restaurar-backup.mjs</code> do projeto e nunca apaga dados existentes sem pedir.</p>
      </div>
    </div>
  );
}

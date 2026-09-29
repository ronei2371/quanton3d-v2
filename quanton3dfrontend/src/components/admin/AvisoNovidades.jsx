import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";

// Aviso no ADM quando chega algo novo pelo site (chamado, mensagem, formulação,
// foto da galeria, parceria). Pergunta ao servidor a cada minuto enquanto o painel
// está aberto; mostra uma faixa, põe o número no título da aba e, se permitido,
// uma notificação do computador. Backend: GET /api/admin/novidades.

const INTERVALO_MS = 60 * 1000;
const ROTULOS = {
  chamados:    ["chamado técnico", "chamados técnicos", "chamados"],
  mensagens:   ["mensagem", "mensagens", "mensagens"],
  formulacoes: ["pedido de formulação", "pedidos de formulação", "formulacoes"],
  galeria:     ["foto para aprovar", "fotos para aprovar", "galeria"],
  parceiros:   ["pedido de parceria", "pedidos de parceria", "parceiros"],
};

function textoNovidades(novidades = {}, abasPermitidas = null) {
  return Object.entries(ROTULOS)
    .filter(([k]) => (novidades[k] || 0) > 0 && (!abasPermitidas || abasPermitidas.includes(ROTULOS[k][2])))
    .map(([k, [um, varios]]) => `${novidades[k]} ${novidades[k] === 1 ? um : varios}`)
    .join(", ");
}

function podeNotificar() {
  return typeof window !== "undefined" && "Notification" in window;
}

export default function AvisoNovidades({ token, abasPermitidas = null, onVer }) {
  const [novidades, setNovidades] = useState(null);
  const [permissao, setPermissao] = useState(() => (podeNotificar() ? Notification.permission : "denied"));
  const desdeRef = useRef(new Date().toISOString()); // começa a contar ao abrir o painel
  const agoraRef = useRef(null);
  const ultimoTotalRef = useRef(0);
  const tituloOriginal = useRef(typeof document !== "undefined" ? document.title : "");
  // A lista de abas pode chegar como array novo a cada render: usa uma chave em texto.
  const chaveAbas = abasPermitidas ? abasPermitidas.join(",") : "";
  const abas = useMemo(() => (chaveAbas ? chaveAbas.split(",") : null), [chaveAbas]);

  const texto = novidades ? textoNovidades(novidades, abas) : "";

  const consultar = useCallback(async () => {
    if (!token) return;
    try {
      const r = await api.get("/admin/novidades", { headers: { Authorization: "Bearer " + token }, params: { desde: desdeRef.current } });
      agoraRef.current = r.data?.agora || agoraRef.current;
      const n = r.data?.novidades || {};
      const t = textoNovidades(n, abas);
      const total = Object.entries(n).filter(([k]) => ROTULOS[k] && (!abas || abas.includes(ROTULOS[k][2]))).reduce((s, [, v]) => s + (v || 0), 0);
      setNovidades(total > 0 ? n : null);
      if (total > ultimoTotalRef.current && t && podeNotificar() && Notification.permission === "granted") {
        try { new Notification("Quanton3D: chegou coisa nova", { body: t, tag: "quanton3d-novidades" }); } catch { /* navegador sem suporte */ }
      }
      ultimoTotalRef.current = total;
    } catch { /* sem internet ou sessão expirada: tenta de novo no próximo minuto */ }
  }, [token, abas]);

  useEffect(() => {
    const primeiro = setTimeout(consultar, 5000);
    const t = setInterval(consultar, INTERVALO_MS);
    const aoVoltar = () => { if (!document.hidden) consultar(); };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => { clearTimeout(primeiro); clearInterval(t); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [consultar]);

  // Número de novidades no título da aba do navegador.
  useEffect(() => {
    const base = tituloOriginal.current.replace(/^\(\d+\)\s*/, "");
    const total = novidades ? Object.entries(novidades).filter(([k]) => ROTULOS[k] && (!abas || abas.includes(ROTULOS[k][2]))).reduce((s, [, v]) => s + (v || 0), 0) : 0;
    document.title = total > 0 ? `(${total}) ${base}` : base;
    return () => { document.title = base; };
  }, [novidades, abas]);

  function ver() {
    const primeira = novidades && Object.keys(ROTULOS).find((k) => (novidades[k] || 0) > 0 && (!abas || abas.includes(ROTULOS[k][2])));
    desdeRef.current = agoraRef.current || new Date().toISOString();
    ultimoTotalRef.current = 0;
    setNovidades(null);
    onVer?.(primeira ? ROTULOS[primeira][2] : null);
  }

  async function ativarAvisos() {
    if (!podeNotificar()) return;
    try { setPermissao(await Notification.requestPermission()); } catch { /* ignorado */ }
  }

  return (
    <>
      {texto && (
        <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", padding: "12px 14px", marginBottom: "12px", borderRadius: "12px", border: "1px solid rgba(10,255,135,0.45)", background: "rgba(10,255,135,0.1)", color: "#eaf3ff" }}>
          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>🔔 Chegou pelo site: {texto}</span>
          <button type="button" onClick={ver} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", background: "#0aff87", color: "#04121f", fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>Ver agora</button>
        </div>
      )}
      {permissao === "default" && (
        <button type="button" onClick={ativarAvisos} style={{ marginBottom: "12px", padding: "7px 13px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(255,255,255,0.05)", color: "#9fb4c7", cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>
          🔔 Ativar avisos neste computador (quando chegar chamado novo)
        </button>
      )}
    </>
  );
}

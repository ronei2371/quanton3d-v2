import { useState, useEffect } from "react";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? "" : "http://localhost:10000");

const STATUS_OPTS = [
  { value: "sucesso",       label: "✅ Sucesso",              color: "#00ff88" },
  { value: "falha_parcial", label: "⚠️ Falha parcial",        color: "#ffaa00" },
  { value: "falha_total",   label: "❌ Falha total",           color: "#ff6b6b" },
  { value: "em_andamento",  label: "🔄 Em andamento",         color: "#00d4ff" },
];

const RESINAS = ["Standard", "ABS-like", "Castable", "Dental", "Flexível", "Water Washable", "Outra"];

const PROBLEMAS = ["Layer shifting", "Warping", "Falha de suporte", "Peça não aderiu", "Superfície irregular", "Bolhas", "Fratura", "Outro"];

const EMPTY_FORM = {
  resina: "ABS-like",
  impressora: "",
  exposicao: "",
  bottom: "",
  liftSpeed: "",
  camada: "0.05",
  status: "sucesso",
  problemas: [],
  observacoes: "",
  tempoMin: "",
  fotoUrl: "",
};

export default function DiarioTecnico() {
  const [registros, setRegistros]   = useState([]);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [salvando, setSalvando]     = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroResina, setFiltroResina] = useState("todas");

  const carregarRegistros = async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/api/diario`);
      if (res.ok) {
        const data = await res.json();
        setRegistros(Array.isArray(data) ? data : data.registros || []);
      }
    } catch {
      // fallback localStorage
      const local = localStorage.getItem("diario_q3d");
      if (local) setRegistros(JSON.parse(local));
    } finally {
      setCarregando(false);
    }
  };

  // Carrega registros do backend
  useEffect(() => {
 codex/revise-the-code-dsrf12

 codex/revise-the-code-12oj9t

 codex/revise-the-code-eagrq8

 codex/revise-the-code-s2elcb
 main
 main
 main
    const timer = setTimeout(() => {
      carregarRegistros();
    }, 0);

    return () => clearTimeout(timer);
 codex/revise-the-code-dsrf12

 codex/revise-the-code-12oj9t

 codex/revise-the-code-eagrq8

 // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarRegistros();
 main
 main

 main
  }, []);

  const salvar = async () => {
    if (!form.resina || !form.status) return;
    setSalvando(true);
    const registro = {
      ...form,
      data: new Date().toISOString(),
      id: editId || Date.now().toString(),
    };
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/api/diario/${editId}` : `${API_URL}/api/diario`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro),
      });
    } catch {
      // fallback localStorage
    }
    const novos = editId
      ? registros.map(r => r.id === editId ? registro : r)
      : [registro, ...registros];
    setRegistros(novos);
    localStorage.setItem("diario_q3d", JSON.stringify(novos));
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setSalvando(false);
  };

  const excluir = async id => {
    try { await fetch(`${API_URL}/api/diario/${id}`, { method: "DELETE" }); } catch (err) {
      console.warn("Falha ao excluir no backend, aplicando fallback local", err);
    }
    const novos = registros.filter(r => r.id !== id);
    setRegistros(novos);
    localStorage.setItem("diario_q3d", JSON.stringify(novos));
  };

  const editar = r => {
    setForm({ ...r });
    setEditId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProblema = p => {
    setForm(f => ({
      ...f,
      problemas: f.problemas.includes(p) ? f.problemas.filter(x => x !== p) : [...f.problemas, p],
    }));
  };

  const registrosFiltrados = registros.filter(r => {
    if (filtroStatus !== "todos" && r.status !== filtroStatus) return false;
    if (filtroResina !== "todas" && r.resina !== filtroResina) return false;
    return true;
  });

  const stats = {
    total: registros.length,
    sucesso: registros.filter(r => r.status === "sucesso").length,
    falhas: registros.filter(r => r.status === "falha_total").length,
    taxaSucesso: registros.length ? Math.round((registros.filter(r => r.status === "sucesso").length / registros.length) * 100) : 0,
  };

  return (
    <section style={s.section}>
      <div style={s.header}>
        <span style={s.badge}>DIÁRIO TÉCNICO</span>
        <h2 style={s.title}>Registro de Impressões</h2>
        <p style={s.subtitle}>
          Documente cada impressão com parâmetros, resultado e observações.
          Histórico salvo no servidor e sincronizado entre dispositivos.
        </p>
      </div>

      {/* Stats */}
      {registros.length > 0 && (
        <div style={s.statsGrid}>
          <StatCard label="Total de impressões" value={stats.total} />
          <StatCard label="Sucessos" value={stats.sucesso} color="#00ff88" />
          <StatCard label="Falhas totais" value={stats.falhas} color="#ff6b6b" />
          <StatCard label="Taxa de sucesso" value={`${stats.taxaSucesso}%`} color="#00d4ff" />
        </div>
      )}

      {/* Botão novo registro */}
      <div style={{ marginBottom: 16 }}>
        <button style={s.btnPrimary} onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(v => !v); }}>
          {showForm ? "✕ Fechar" : "+ Novo registro"}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={s.card}>
          <p style={s.cardTitle}>{editId ? "Editar registro" : "Novo registro"}</p>

          <div style={s.grid2}>
            <Field label="Resina">
              <select value={form.resina} onChange={e => setForm(f => ({ ...f, resina: e.target.value }))} style={s.select}>
                {RESINAS.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Impressora">
              <input value={form.impressora} onChange={e => setForm(f => ({ ...f, impressora: e.target.value }))}
                style={s.input} placeholder="Ex: Saturn 3 Ultra" />
            </Field>
          </div>

          <div style={s.grid3}>
            <Field label="Exposição (s)">
              <input type="number" value={form.exposicao} onChange={e => setForm(f => ({ ...f, exposicao: e.target.value }))} style={s.input} placeholder="Ex: 2.8" />
            </Field>
            <Field label="Bottom (s)">
              <input type="number" value={form.bottom} onChange={e => setForm(f => ({ ...f, bottom: e.target.value }))} style={s.input} placeholder="Ex: 16.8" />
            </Field>
            <Field label="Lift speed">
              <input type="number" value={form.liftSpeed} onChange={e => setForm(f => ({ ...f, liftSpeed: e.target.value }))} style={s.input} placeholder="mm/min" />
            </Field>
            <Field label="Camada (mm)">
              <input type="number" step="0.01" value={form.camada} onChange={e => setForm(f => ({ ...f, camada: e.target.value }))} style={s.input} placeholder="0.05" />
            </Field>
            <Field label="Tempo total (min)">
              <input type="number" value={form.tempoMin} onChange={e => setForm(f => ({ ...f, tempoMin: e.target.value }))} style={s.input} placeholder="Ex: 160" />
            </Field>
            <Field label="Resultado">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={s.select}>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Problemas */}
          {["falha_parcial", "falha_total"].includes(form.status) && (
            <Field label="Problemas identificados">
              <div style={s.tagGrid}>
                {PROBLEMAS.map(p => (
                  <button key={p}
                    style={{ ...s.tagBtn, ...(form.problemas.includes(p) ? s.tagBtnActive : {}) }}
                    onClick={() => toggleProblema(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label="Observações">
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              style={{ ...s.input, height: 80, resize: "vertical" }}
              placeholder="Anote o que funcionou, o que falhou, ajustes feitos..." />
          </Field>

          <div style={s.btns}>
            <button style={s.btnSecondary} onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
            <button style={{ ...s.btnPrimary, opacity: salvando ? 0.6 : 1 }} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "💾 Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      {registros.length > 0 && (
        <div style={s.filtros}>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={s.selectSmall}>
            <option value="todos">Todos os resultados</option>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filtroResina} onChange={e => setFiltroResina(e.target.value)} style={s.selectSmall}>
            <option value="todas">Todas as resinas</option>
            {RESINAS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Lista de registros */}
      {carregando ? (
        <p style={s.loading}>Carregando registros...</p>
      ) : registrosFiltrados.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyTitle}>Nenhum registro ainda</p>
          <p style={s.emptySub}>Clique em "Novo registro" para começar seu diário técnico.</p>
        </div>
      ) : (
        registrosFiltrados.map(r => {
          const st = STATUS_OPTS.find(o => o.value === r.status);
          return (
            <div key={r.id} style={s.registroCard}>
              <div style={s.registroTop}>
                <div style={{ flex: 1 }}>
                  <div style={s.registroHeader}>
                    <span style={s.registroResina}>{r.resina}</span>
                    {r.impressora && <span style={s.registroImpressora}>{r.impressora}</span>}
                    <span style={{ ...s.registroStatus, color: st?.color }}>{st?.label}</span>
                  </div>
                  <p style={s.registroData}>{new Date(r.data).toLocaleString("pt-BR")}</p>
                </div>
                <div style={s.registroAcoes}>
                  <button style={s.btnAcao} onClick={() => editar(r)}>✎</button>
                  <button style={{ ...s.btnAcao, color: "rgba(255,100,100,.7)" }} onClick={() => excluir(r.id)}>✕</button>
                </div>
              </div>

              {(r.exposicao || r.liftSpeed || r.camada) && (
                <div style={s.registroParams}>
                  {r.exposicao  && <ParamTag label="Exp" value={`${r.exposicao}s`} />}
                  {r.bottom     && <ParamTag label="Bottom" value={`${r.bottom}s`} />}
                  {r.liftSpeed  && <ParamTag label="Lift" value={`${r.liftSpeed}mm/min`} />}
                  {r.camada     && <ParamTag label="Camada" value={`${r.camada}mm`} />}
                  {r.tempoMin   && <ParamTag label="Tempo" value={`${r.tempoMin}min`} />}
                </div>
              )}

              {r.problemas?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {r.problemas.map(p => (
                    <span key={p} style={s.problemaTag}>{p}</span>
                  ))}
                </div>
              )}

              {r.observacoes && (
                <p style={s.registroObs}>{r.observacoes}</p>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,.4)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
      <p style={{ fontSize: "24px", fontWeight: 700, color: color || "#fff", margin: 0 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      <label style={{ fontSize: "13px", color: "rgba(255,255,255,.5)" }}>{label}</label>
      {children}
    </div>
  );
}

function ParamTag({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 6, padding: "3px 8px", display: "flex", gap: 4, alignItems: "center" }}>
      <span style={{ fontSize: "10px", color: "rgba(255,255,255,.35)" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{value}</span>
    </div>
  );
}

const s = {
  section: { background: "transparent", color: "#fff", padding: "2rem 0", fontFamily: "'Inter',sans-serif" },
  header: { marginBottom: "1.5rem" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", color: "#00d4ff", marginBottom: 8 },
  title: { fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.1 },
  subtitle: { fontSize: "14px", color: "rgba(255,255,255,.55)", maxWidth: 620, lineHeight: 1.6, margin: 0 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "1.25rem", marginBottom: 12 },
  cardTitle: { fontSize: "13px", fontWeight: 600, color: "#00d4ff", marginBottom: 14, letterSpacing: ".06em" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  select: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", padding: "9px 10px", fontSize: "13px", outline: "none", width: "100%" },
  input: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", padding: "9px 10px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  tagGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  tagBtn: { padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", fontSize: "12px", cursor: "pointer" },
  tagBtnActive: { background: "rgba(255,107,107,.12)", border: "1px solid rgba(255,107,107,.3)", color: "#ff6b6b" },
  btns: { display: "flex", gap: 10, marginTop: 4 },
  btnSecondary: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "rgba(255,255,255,.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  btnPrimary: { padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(0,212,255,.35)", background: "rgba(0,212,255,.08)", color: "#00d4ff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  filtros: { display: "flex", gap: 10, marginBottom: 14 },
  selectSmall: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "rgba(255,255,255,.7)", padding: "7px 10px", fontSize: "12px", outline: "none" },
  loading: { fontSize: "13px", color: "rgba(255,255,255,.35)", textAlign: "center", padding: "2rem 0" },
  emptyBox: { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "2rem", textAlign: "center" },
  emptyTitle: { fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,.5)", margin: "0 0 6px" },
  emptySub: { fontSize: "13px", color: "rgba(255,255,255,.3)", margin: 0 },
  registroCard: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 8 },
  registroTop: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 },
  registroHeader: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 3 },
  registroResina: { fontSize: "14px", fontWeight: 700, color: "#fff" },
  registroImpressora: { fontSize: "12px", color: "rgba(255,255,255,.4)" },
  registroStatus: { fontSize: "12px", fontWeight: 600, marginLeft: "auto" },
  registroData: { fontSize: "11px", color: "rgba(255,255,255,.3)", margin: 0 },
  registroAcoes: { display: "flex", gap: 4 },
  btnAcao: { width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.5)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  registroParams: { display: "flex", flexWrap: "wrap", gap: 5 },
  problemaTag: { fontSize: "11px", padding: "2px 7px", borderRadius: 4, background: "rgba(255,107,107,.1)", border: "1px solid rgba(255,107,107,.2)", color: "rgba(255,140,140,.8)" },
  registroObs: { fontSize: "12px", color: "rgba(255,255,255,.45)", margin: "8px 0 0", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 8 },
};

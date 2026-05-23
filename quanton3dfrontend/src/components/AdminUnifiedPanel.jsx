import { useEffect, useState } from "react";
import api from "../api";
import "./AdminUnifiedPanel.css";

function AdminUnifiedPanel({ aberto, aoFechar }) {
  const [aba, setAba] = useState("contatos");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [contatos, setContatos] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [parametros, setParametros] = useState([]);
  const [mostrarFormParam, setMostrarFormParam] = useState(false);
  const [formParam, setFormParam] = useState({
    resina: "",
    marca: "",
    impressora: "",
    alturaCamada: "",
    exposicaoNormal: "",
    exposicaoBase: "",
    camadasBase: "",
    retardoUV: "",
    retardoUVBase: "",
    descansoAntesElevacao: "",
    descansoAposElevacao: "",
    descansoAposRetracao: "",
    potenciaUV: ""
  });

  useEffect(() => {
    if (!aberto) return;
    carregarTudo();
  }, [aberto]);

  if (!aberto) return null;

  async function carregarTudo() {
    try {
      setCarregando(true);
      setErro("");

      const [resContatos, resParceiros, resTickets, resParams] = await Promise.all([
        api.get("/contact-messages"),
        api.get("/partner-requests"),
        api.get("/bot-tickets"),
        api.get("/parametros"),
      ]);

      setContatos(resContatos.data?.contactMessages || []);
      setParceiros(resParceiros.data?.partnerRequests || []);
      setTickets(resTickets.data?.botTickets || []);
      setParametros(resParams.data?.parametros || []);
    } catch (error) {
      console.error("Erro ao carregar admin unificado:", error);
      setErro("Erro ao carregar os dados do painel administrativo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="admin-panel-backdrop">
      <div className="admin-panel-shell">
        <button type="button" className="admin-close" onClick={aoFechar}>
          ✕ Fechar
        </button>

        <div className="admin-panel">
          <div className="admin-header">
            <div>
              <span className="admin-badge">Painel Administrativo</span>
              <h2>Admin Unificado Quanton3D</h2>
              <p>
                Visualize mensagens do site, pedidos de parceria e tickets do bot
                técnico em um só lugar.
              </p>
            </div>

            <button type="button" className="admin-refresh" onClick={carregarTudo}>
              Atualizar
            </button>
          </div>

          <div className="admin-stats">
            <div className="admin-stat-card">
              <span>Contatos</span>
              <strong>{contatos.length}</strong>
            </div>

            <div className="admin-stat-card">
              <span>Parceiros</span>
              <strong>{parceiros.length}</strong>
            </div>

            <div className="admin-stat-card">
              <span>Tickets Bot</span>
              <strong>{tickets.length}</strong>
            </div>
          </div>

          <div className="admin-tabs">
            <button
              type="button"
              className={aba === "contatos" ? "active" : ""}
              onClick={() => setAba("contatos")}
            >
              Fale Conosco
            </button>

            <button
              type="button"
              className={aba === "parceiros" ? "active" : ""}
              onClick={() => setAba("parceiros")}
            >
              Parceiros
            </button>

            <button
              type="button"
              className={aba === "tickets" ? "active" : ""}
              onClick={() => setAba("tickets")}
            >
              Bot Técnico
            </button>

            <button
              type="button"
              className={aba === "parametros" ? "active" : ""}
              onClick={() => setAba("parametros")}
            >
              Parâmetros
            </button>
          </div>

          {carregando && <div className="admin-info">Carregando dados...</div>}
          {erro && <div className="admin-error">{erro}</div>}

          {!carregando && !erro && aba === "contatos" && (
            <div className="admin-list">
              {contatos.length === 0 ? (
                <div className="admin-empty">Nenhuma mensagem encontrada.</div>
              ) : (
                contatos.map((item) => (
                  <article key={item._id} className="admin-card">
                    <div className="admin-card-top">
                      <h3>{item.assunto || "Sem assunto"}</h3>
                      <span className="admin-status">{item.status || "nova"}</span>
                    </div>

                    <p><strong>Nome:</strong> {item.nome || "-"}</p>
                    <p><strong>Telefone:</strong> {item.telefone || "-"}</p>
                    <p><strong>E-mail:</strong> {item.email || "-"}</p>
                    <p><strong>Mensagem:</strong> {item.mensagem || "-"}</p>
                  </article>
                ))
              )}
            </div>
          )}

          {!carregando && !erro && aba === "parceiros" && (
            <div className="admin-list">
              {parceiros.length === 0 ? (
                <div className="admin-empty">Nenhuma solicitação de parceria.</div>
              ) : (
                parceiros.map((item) => (
                  <article key={item._id} className="admin-card">
                    <div className="admin-card-top">
                      <h3>{item.titulo || "Sem título"}</h3>
                      <span className="admin-status">{item.status || "pendente"}</span>
                    </div>

                    <p><strong>Nome:</strong> {item.nome || "-"}</p>
                    <p><strong>Telefone:</strong> {item.telefone || "-"}</p>
                    <p><strong>E-mail:</strong> {item.email || "-"}</p>
                    <p><strong>Tipo:</strong> {item.tipo || "-"}</p>
                    <p><strong>Categoria:</strong> {item.categoria || "-"}</p>
                    <p><strong>Descrição:</strong> {item.descricao || "-"}</p>

                    {Array.isArray(item.fotos) && item.fotos.length > 0 && (
                      <div className="admin-photo-grid">
                        {item.fotos.map((foto, index) => (
                          <img
                            key={`${item._id}-${index}`}
                            src={foto.url.startsWith('http') ? foto.url : `${api.defaults.baseURL.replace('/api', '')}${foto.url}`}
                            alt={foto.nomeOriginal || "foto parceiro"}
                          />
                        ))}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          )}

          {!carregando && !erro && aba === "tickets" && (
            <div className="admin-list">
              {tickets.length === 0 ? (
                <div className="admin-empty">Nenhum ticket técnico.</div>
              ) : (
                tickets.map((item) => (
                  <article key={item._id} className="admin-card">
                    <div className="admin-card-top">
                      <h3>{item.problema || "Sem problema informado"}</h3>
                      <span className="admin-status">{item.status || "novo"}</span>
                    </div>

                    <p><strong>Nome:</strong> {item.nome || "-"}</p>
                    <p><strong>Resina:</strong> {item.resina || "-"}</p>
                    <p><strong>Impressora:</strong> {item.impressora || "-"}</p>
                    <p><strong>Descrição:</strong> {item.descricao || "-"}</p>
                    <p><strong>Resposta do bot:</strong> {item.respostaBot || "-"}</p>

                    {Array.isArray(item.fotos) && item.fotos.length > 0 && (
                      <div className="admin-photo-grid">
                        {item.fotos.map((foto, index) => (
                          <img
                            key={`${item._id}-${index}`}
                            src={foto.url.startsWith('http') ? foto.url : `${api.defaults.baseURL.replace('/api', '')}${foto.url}`}
                            alt={foto.nomeOriginal || "foto ticket"}
                          />
                        ))}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          )}

          {!carregando && !erro && aba === "parametros" && (
            <div className="admin-list">
              <div style={{ marginBottom: "20px" }}>
                <button 
                  type="button" 
                  className="admin-refresh"
                  onClick={() => setMostrarFormParam(!mostrarFormParam)}
                >
                  {mostrarFormParam ? "Cancelar" : "+ Adicionar Parâmetro"}
                </button>
              </div>

              {mostrarFormParam && (
                <div className="admin-card" style={{ marginBottom: "20px" }}>
                  <h3>Novo Parâmetro</h3>
                  <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
                    <input placeholder="Resina" value={formParam.resina} onChange={e => setFormParam({...formParam, resina: e.target.value})} />
                    <input placeholder="Marca" value={formParam.marca} onChange={e => setFormParam({...formParam, marca: e.target.value})} />
                    <input placeholder="Impressora" value={formParam.impressora} onChange={e => setFormParam({...formParam, impressora: e.target.value})} />
                    <input placeholder="Altura Camada" value={formParam.alturaCamada} onChange={e => setFormParam({...formParam, alturaCamada: e.target.value})} />
                    <input placeholder="Exp Normal" value={formParam.exposicaoNormal} onChange={e => setFormParam({...formParam, exposicaoNormal: e.target.value})} />
                    <input placeholder="Exp Base" value={formParam.exposicaoBase} onChange={e => setFormParam({...formParam, exposicaoBase: e.target.value})} />
                    <input placeholder="Camadas Base" value={formParam.camadasBase} onChange={e => setFormParam({...formParam, camadasBase: e.target.value})} />
                    <input placeholder="Retardo UV" value={formParam.retardoUV} onChange={e => setFormParam({...formParam, retardoUV: e.target.value})} />
                    <input placeholder="Potência UV" value={formParam.potenciaUV} onChange={e => setFormParam({...formParam, potenciaUV: e.target.value})} />
                  </div>
                  <button 
                    type="button" 
                    className="admin-refresh" 
                    style={{ marginTop: "15px", width: "100%" }}
                    onClick={async () => {
                      try {
                        await api.post("/parametros", formParam);
                        alert("Parâmetro salvo!");
                        setMostrarFormParam(false);
                        carregarTudo();
                      } catch (e) { alert("Erro ao salvar"); }
                    }}
                  >
                    Salvar Parâmetro
                  </button>
                </div>
              )}

              {parametros.length === 0 ? (
                <div className="admin-empty">Nenhum parâmetro cadastrado.</div>
              ) : (
                parametros.map((item) => (
                  <article key={item._id} className="admin-card">
                    <div className="admin-card-top">
                      <h3>{item.resina} - {item.impressora}</h3>
                      <button 
                        style={{ background: "none", border: "none", color: "red", cursor: "pointer" }}
                        onClick={async () => {
                          if(confirm("Excluir este parâmetro?")) {
                            try {
                              await api.delete(`/parametros/${item._id}`);
                              carregarTudo();
                            } catch(e) { alert("Erro ao excluir"); }
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                    <p><strong>Marca:</strong> {item.marca || "-"}</p>
                    <p><strong>Exp:</strong> {item.exposicaoNormal} | <strong>Base:</strong> {item.exposicaoBase} | <strong>Camadas:</strong> {item.camadasBase}</p>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUnifiedPanel;

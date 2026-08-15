import { X } from "lucide-react";
import { AdminContent, PainelAtendente } from "../admin/AdminInternals";

function AdminModal({ atendenteLogado, onClose }) {
  const acessoCompleto = atendenteLogado?.permissoes?.acessoAdmCompleto;
  const tokenAtendente = acessoCompleto ? localStorage.getItem("quanton3d_atendente_token") : null;

  return (
    <div className="q-modal-backdrop">
      <section className="q-modal q-modal--wide" style={{ display: "flex", flexDirection: "column" }}>
        <div className="q-modal-head">
          <h2 style={{ fontSize: "1.05rem" }}>{atendenteLogado && !acessoCompleto ? "Painel do Atendente" : "Painel Administrativo"}</h2>
          <button type="button" className="q-modal-close" onClick={onClose}><X size={13} /> Fechar</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {atendenteLogado && !acessoCompleto ? (
            <PainelAtendente atendente={atendenteLogado} onClose={onClose} />
          ) : (
            <AdminContent tokenAtendente={tokenAtendente} />
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminModal;

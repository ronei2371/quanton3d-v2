import { X } from "lucide-react";

function GuideModal({ guide, onClose }) {
  return (
    <div className="q-modal-backdrop">
      <section className="q-modal q-modal--wide calculator-modal" style={{ display: "flex", flexDirection: "column" }}>
        <div className="q-modal-head">
          <h2 style={{ fontSize: "1.05rem" }}>{guide.title}</h2>
          <button type="button" className="q-modal-close" onClick={onClose}><X size={13} /> Fechar</button>
        </div>
        <div className="calculator-shell" style={{ flex: 1, display: "flex", padding: 0 }}>
          <iframe title={guide.title} src={guide.file} style={{ flex: 1, width: "100%", border: "none", background: "#fff" }} />
        </div>
      </section>
    </div>
  );
}

export default GuideModal;

import { Bot, X } from "lucide-react";
import BotContent from "../BotContent";

function BotModal({ cliente, onClose }) {
  return (
    <div className="q-modal-backdrop">
      <section className="q-modal" style={{ width: "98vw", maxWidth: "760px", height: "88vh", maxHeight: "88vh", padding: "18px 20px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="q-modal-head">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
            <Bot size={18} color="var(--primary)" /> IAQ3D — Assistente Técnico Quanton3D
          </h2>
          <button type="button" className="q-modal-close" onClick={onClose}><X size={13} /> Fechar</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}><BotContent cliente={cliente} /></div>
      </section>
    </div>
  );
}
export default BotModal;

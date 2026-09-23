import { X } from "lucide-react";
import BotChat from "./BotChat";
import IAQ3DAvatar from "../IAQ3DAvatar";

function BotModal({ cliente, onClose }) {
  return (
    <div className="q-modal-backdrop">
      <section
        className="q-modal"
        style={{
          width: "min(760px, calc(100vw - 20px))",
          height: "88dvh", maxHeight: "calc(100dvh - 20px)",
          padding: "18px 20px", boxSizing: "border-box", minWidth: 0,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div className="q-modal-head">
          <h2 className="iaq3d-head" style={{ fontSize: "1rem" }}>
            <IAQ3DAvatar size={42} compact />
            <span className="iaq3d-head-text">IAQ3D<small>assistente técnica · online</small></span>
          </h2>
          <button type="button" className="q-modal-close" onClick={onClose}><X size={13} /> Fechar</button>
        </div>
        <BotChat cliente={cliente} />
      </section>
    </div>
  );
}

export default BotModal;

import { ShieldCheck } from "lucide-react";

// Aviso mostrado em todo lugar onde o cliente manda foto (chat, chamado, galeria, parceiros).
// Pensado principalmente para odontologia: foto só da peça, nunca dado de paciente.
function AvisoFotoPrivacidade({ publica = false, style }) {
  return (
    <p className="aviso-foto" style={style}>
      <ShieldCheck size={14} aria-hidden="true" />
      <span>
        <strong>Antes de enviar:</strong> a foto deve mostrar só a peça, a plataforma ou a cuba.
        Não envie rosto, nome, prontuário ou etiqueta com dados de paciente ou de outra pessoa.
        {publica
          ? " Depois de aprovada pela Quanton3D, a foto aparece na galeria pública do site."
          : " A foto é usada só para a análise técnica da equipe Quanton3D."}
      </span>
    </p>
  );
}

export default AvisoFotoPrivacidade;

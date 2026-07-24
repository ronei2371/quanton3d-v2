import React from "react";

function QualidadeContent({ abrirGuia }) {
  return (
    <div className="modal-rich-content">
      <p>Conheça nossas resinas e encontre a ideal para sua aplicação.</p>
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("otimizacao")}>Otimização e pós-processamento</button>
        <button type="button" onClick={() => abrirGuia("calibracaoQuanton3D")}>Calibração Q3D</button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>Diagnóstico de problemas</button>
        <a href="https://quanton3d.com.br/produtos" target="_blank" rel="noreferrer">Ver todas as resinas no site</a>
      </div>
    </div>
  );
}

const RESINAS_BOT = [
  "ALCHEMIST","IRON","IRON 70/30","FLEXFORM","ATHOM DENTAL","ATHOM ALINHADORES",
  "ATHOM WASHABLE","POSEIDON","PYROBLAST","VULCAN CAST","SPIN","SPARK","LOW SMELL","VELVET SKIN","Não sei / Outra"
];


export default QualidadeContent;

import { UserPlus } from "lucide-react";

// Aparece no lugar de um recurso de suporte (IAQ3D, chamado, formulação, envio de peça)
// quando a pessoa fechou o cadastro sem se identificar.
function PedirCadastro({ texto, onPedirCadastro }) {
  return (
    <div className="pedir-cadastro">
      <UserPlus size={22} aria-hidden="true" />
      <div>
        <strong>Cadastro necessário</strong>
        <p>{texto || "Para usar o suporte técnico, faça seu cadastro rápido. Leva menos de 1 minuto."}</p>
      </div>
      <button type="button" className="q-btn q-btn--primary" onClick={onPedirCadastro}>Fazer cadastro</button>
    </div>
  );
}

export default PedirCadastro;

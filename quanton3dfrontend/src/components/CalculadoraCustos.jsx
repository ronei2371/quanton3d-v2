export default function CalculadoraCustos({ cliente }) {
  // Monta URL com dados do cliente logado (nome, telefone, email)
  // A calculadora HTML lê esses params e preenche automaticamente
  const params = new URLSearchParams();
  if (cliente?.nome) params.set("nome", cliente.nome);
  if (cliente?.telefone) params.set("telefone", cliente.telefone);
  if (cliente?.email) params.set("email", cliente.email);
  const qs = params.toString();
  const src = "/calculadora-custos.html" + (qs ? "?" + qs : "");

  return (
    <div style={{ width: "100%", height: "calc(100vh - 120px)", minHeight: "600px", overflow: "hidden", borderRadius: "8px" }}>
      <iframe
        title="Calculadora de Custos e Orçamentos"
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="clipboard-write"
      />
    </div>
  );
}

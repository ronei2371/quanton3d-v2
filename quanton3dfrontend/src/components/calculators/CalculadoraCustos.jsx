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
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0 }}>
      <div style={{ textAlign: "right", padding: "4px 8px 4px 0", flexShrink: 0 }}>
        <a href="/guias/07-guia-custos-orcamentos-avancado-quanton3d.html" target="_blank" rel="noreferrer" className="q-btn q-btn--primary" style={{ fontSize: "0.78rem", textDecoration: "none" }}>
          📖 Dúvida? Clique aqui — Guia da Calculadora
        </a>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: "8px" }}>
      <iframe
        title="Calculadora de Custos e Orçamentos"
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="clipboard-write"
      />
      </div>
    </div>
  );
}

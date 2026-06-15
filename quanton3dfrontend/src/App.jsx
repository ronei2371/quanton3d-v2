// Trecho corrigido do App.jsx (Seção de Experiência e Produtos)

// 1. Seção de Experiência (Colabore com sua experiência de configuração)
// Mantemos os botões principais que o senhor gosta.
<section className="experience-section">
  <span className="section-label">Colaboração técnica</span>
  <h2>Colabore com sua experiência de configuração</h2>
  <p>Envie uma foto da peça e os tempos usados no Chitubox para ajudar a Quanton3D a melhorar a base técnica.</p>
  <div className="experience-actions">
    <button type="button" onClick={() => setActiveModal("galeria")}>📷 Compartilhar minhas configurações</button>
    <button type="button" onClick={() => setActiveModal("galeriaPublica")}>🖼️ Ver configurações e fotos de clientes</button>
    <button type="button" onClick={abrirParceiroModal}>🤝 Quero ser parceiro</button>
  </div>
</section>

// 2. Seção de Produtos (Nossas Resinas)
// REMOVIDO o InfoCard "Quero ser parceiro" daqui para evitar a duplicação.
<section id="produtos" className="panel">
  <div className="panel-header">
    <div>
      <span className="section-label">Catálogo Elite</span>
      <h2>Nossas Resinas</h2>
    </div>
  </div>
  <div className="cards-grid">
    <InfoCard 
      title="Alta Qualidade" 
      text="Conheça linhas, aplicações e FISPQs." 
      onClick={() => setActiveModal("qualidade")} 
    />
    <InfoCard 
      title="Parâmetros detalhados" 
      text="Abra o guia completo do Chitubox." 
      onClick={() => abrirGuia("parametrosDetalhados")} 
    />
    <InfoCard 
      title="Parceiros e cursos" 
      text="Veja parceiros e serviços recomendados." 
      onClick={() => abrirGuia("parceiros")} 
    />
    {/* O card 'Quero ser parceiro' foi removido daqui pois já existe na seção acima */}
  </div>
</section>

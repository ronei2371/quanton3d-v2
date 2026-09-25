import { useState } from "react";
import { Factory, Target, Microscope, Users, Shield, MapPin, ShoppingCart, MessageCircle, Flag, X } from "lucide-react";
import { WHATSAPP_VENDAS_URL } from "../../data/contact";

const VALORES = [
  { icon: Microscope, titulo: "Qualidade e Rigor Técnico", texto: "Nossas fórmulas passam por testes rigorosos para oferecer cura rápida, baixíssima contração e estabilidade dimensional impecável." },
  { icon: Users, titulo: "Suporte Próximo", texto: "Atendemos de forma humana, técnica e rápida, ajudando quem imprime a calibrar suas máquinas e alcançar a peça perfeita." },
  { icon: Shield, titulo: "Responsabilidade e Segurança", texto: "Indústria totalmente regularizada: Certificado IBAMA, Licença Ambiental, AVCB Bombeiros e certificação CRQ – 2ª Região." },
];

// Patrocinio: Nelsinho Piquet, carro 33 da Stock Car (fotos enviadas pelo fundador)
const FOTOS_PISTA = [
  { src: "/images/sobre/stock-car-33-pista.webp", legenda: "Carro 33 da Stock Car com a marca Quanton3D no para-choque" },
  { src: "/images/sobre/nelsinho-podio.webp", legenda: "Nelsinho Piquet no pódio, com a Quanton3D no macacão", pos: "center 15%" },
  { src: "/images/sobre/stock-car-33-curva.webp", legenda: "Carro 33 na pista" },
  { src: "/images/sobre/stock-car-33-logo.webp", legenda: "Marca Quanton3D na traseira do carro 33" },
  { src: "/images/sobre/stock-car-33-rosa.webp", legenda: "Carro 33 com a pintura rosa" },
  { src: "/images/sobre/nelsinho-macacao.webp", legenda: "Macacão do piloto com a marca Quanton3D", pos: "center 30%" },
  { src: "/images/sobre/nelsinho-box.webp", legenda: "Nelsinho Piquet no box", pos: "center 25%" },
  { src: "/images/sobre/stock-car-33-box.webp", legenda: "Equipe no box com o carro 33" },
];

function SobreSection() {
  const [fotoAberta, setFotoAberta] = useState(null);
  const fundadores = [
    { nome: "Ronei Martins", cargo: "Fundador e Desenvolvimento", foto: "/images/sobre/Ronei Martins.png" },
    { nome: "Gislene Peixoto", cargo: "Cofundadora e Gestão", foto: "/images/sobre/Gislene.png" },
  ];

  return (
    <section className="q-card q-panel">
      <div className="q-grid" style={{ marginBottom: "26px" }}>
        {fundadores.map((pessoa) => (
          <article key={pessoa.nome} className="q-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px" }}>
            <img src={pessoa.foto} alt={pessoa.nome} style={{ width: "86px", height: "86px", flexShrink: 0, borderRadius: "50%", objectFit: "cover", objectPosition: "center", border: "2px solid var(--border-strong)" }} />
            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: "5px" }}>{pessoa.nome}</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--primary-strong)", fontWeight: 700 }}>{pessoa.cargo}</p>
            </div>
          </article>
        ))}
      </div>
      <div style={{ padding: "8px 8px 26px", marginBottom: "12px", borderBottom: "1px solid var(--border-soft)" }}>
        <span className="q-badge q-badge--accent">Fundada em abril de 2020</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", margin: "12px 0 4px" }}>Quanton3D</h1>
        <p style={{ fontSize: "1rem", color: "var(--primary)", fontStyle: "italic" }}>Para quem transforma resina em resultado.</p>
      </div>

      <div style={{ maxWidth: "960px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", marginBottom: "8px" }}><Factory size={16} /> Origem e Pioneirismo</h3>
        <p style={{ fontSize: "0.88rem" }}>
          Fundada em <strong style={{ color: "var(--text-primary)" }}>abril de 2020</strong>, em <strong style={{ color: "var(--text-primary)" }}>Belo Horizonte (MG)</strong>, a Quanton3D nasceu da união de seus fundadores,
          <strong style={{ color: "var(--text-primary)" }}> Ronei e Gislene</strong> — casal e sócios que trouxeram da <strong style={{ color: "var(--text-primary)" }}>fabricação técnica de manequins</strong> o rigor industrial,
          o olho clínico para o acabamento e a seriedade comercial que aplicaram ao universo da impressão 3D.
        </p>
        <p style={{ fontSize: "0.88rem", marginTop: "10px" }}>
          Fomos a <strong style={{ color: "var(--text-primary)" }}>primeira fábrica nacional</strong> focada em resinas de altíssima performance com preço genuinamente justo — num mercado
          até então dominado por insumos importados e caros. Esse pioneirismo democratizou o acesso para milhares de makers, clínicas e
          laboratórios, e forçou o mercado nacional a se reposicionar.
        </p>
        <p style={{ fontSize: "0.88rem", marginTop: "10px", fontStyle: "italic", color: "var(--q-ametista)" }}>
          Para nós, não é só sobre vender resina. É sobre o que você consegue criar com ela.
        </p>
      </div>

      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", margin: "24px 0 12px" }}><Target size={16} /> Nossos Valores e Compromisso Industrial</h3>
      <div className="q-grid">
        {VALORES.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.titulo} className="q-card" style={{ padding: "18px" }}>
              <span className="q-icon-badge" style={{ marginBottom: "10px" }}><Icon size={17} /></span>
              <h4 style={{ fontSize: "0.9rem", marginBottom: "6px" }}>{v.titulo}</h4>
              <p style={{ fontSize: "0.8rem" }}>{v.texto}</p>
            </div>
          );
        })}
      </div>

      <div className="sobre-pista">
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", margin: "0 0 8px" }}><Flag size={16} /> Quanton3D nas pistas</h3>
        <p style={{ fontSize: "0.88rem", maxWidth: "80ch", margin: "0 0 14px" }}>
          A Quanton3D patrocina o piloto <strong style={{ color: "var(--text-primary)" }}>Nelson Piquet Jr. (Nelsinho)</strong> na <strong style={{ color: "var(--text-primary)" }}>Stock Car</strong>.
          Nossa marca está no carro 33 e no macacão do piloto: uma resina brasileira acompanhando o automobilismo brasileiro.
        </p>
        <div className="sobre-pista-grade">
          {FOTOS_PISTA.map((foto) => (
            <button key={foto.src} type="button" className="sobre-pista-foto" onClick={() => setFotoAberta(foto)} aria-label={`Ampliar: ${foto.legenda}`}>
              <img src={foto.src} alt={foto.legenda} loading="lazy" style={foto.pos ? { objectPosition: foto.pos } : undefined} />
            </button>
          ))}
        </div>
      </div>

      {fotoAberta && (
        <div role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setFotoAberta(null)} className="sobre-pista-zoom">
          <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={() => setFotoAberta(null)}><X size={16} /> Fechar</button>
          <img src={fotoAberta.src} alt={fotoAberta.legenda} onClick={(e) => e.stopPropagation()} />
          <p>{fotoAberta.legenda}</p>
        </div>
      )}

      <div style={{ maxWidth: "960px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", margin: "26px 0 8px" }}><MapPin size={16} /> Onde Estamos</h3>
        <p style={{ fontSize: "0.88rem" }}>
          Nossa fábrica e centro de distribuição ficam estrategicamente localizados na <strong style={{ color: "var(--text-primary)" }}>Avenida Dom Pedro II, 5056 — Jardim Montanhês,
          Belo Horizonte – MG</strong>. Daqui, enviamos tecnologia e inovação diariamente para laboratórios, clínicas, estúdios de arte e
          indústrias em todos os cantos do Brasil.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "22px" }}>
        <a href="https://quanton3d.com.br" target="_blank" rel="noreferrer" className="q-btn q-btn--primary"><ShoppingCart size={15} /> Visite nossa loja</a>
        <a href={WHATSAPP_VENDAS_URL} target="_blank" rel="noreferrer" className="q-btn q-btn--whatsapp"><MessageCircle size={15} /> WhatsApp Vendas</a>
      </div>
    </section>
  );
}

export default SobreSection;

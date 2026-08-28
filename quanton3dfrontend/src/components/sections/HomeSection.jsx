import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Settings2,
  Wrench,
} from "lucide-react";

const CAMINHOS = [
  {
    id: "configurar",
    icon: Settings2,
    label: "Vou começar uma impressão",
    title: "Encontre uma base confiável para configurar sua máquina.",
    desc: "Cruze a resina Quanton3D com o modelo da sua impressora e consulte os parâmetros iniciais recomendados.",
    action: "Consultar parâmetros",
    page: "parametros",
    imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-configurar.png",
  },
  {
    id: "corrigir",
    icon: Wrench,
    label: "Minha peça apresentou falha",
    title: "Transforme o sintoma em um próximo passo claro.",
    desc: "Use os guias de diagnóstico ou abra um chamado com as informações que ajudam nossa equipe a entender o caso.",
    action: "Resolver uma falha",
    page: "atendimento",
    imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-corrigir.png",
  },
  {
    id: "calcular",
    icon: Calculator,
    label: "Preciso calcular ou ajustar",
    title: "Tome decisões com números, não com tentativa e erro.",
    desc: "Calcule custo, exposição, tolerância, tempo e compensações para trabalhar com mais previsibilidade.",
    action: "Abrir calculadoras",
    page: "calculadoras",
    imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-calcular.png",
  },
  {
    id: "aprender",
    icon: BookOpen,
    label: "Quero dominar o processo",
    title: "Aprenda cada etapa no seu ritmo.",
    desc: "Acesse guias objetivos sobre nivelamento, fatiamento, calibração, suportes, manutenção e otimização.",
    action: "Explorar os guias",
    page: "guias",
    imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-aprender.png",
  },
];

function HomeSection({ onNavegar }) {
  const [caminhoAtivo, setCaminhoAtivo] = useState(CAMINHOS[0]);
  const CaminhoIcon = caminhoAtivo.icon;

  return (
    <div className="home-experience">
      <div className="home-fluid-bg" aria-hidden="true">
        <span className="home-fluid-blob home-fluid-blob--safira" />
        <span className="home-fluid-blob home-fluid-blob--celeste" />
        <span className="home-fluid-blob home-fluid-blob--ametista" />
        <span className="home-fluid-blob home-fluid-blob--marine" />
        <span className="home-fluid-noise" />
      </div>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <span className="home-kicker">Central de suporte e conhecimento</span>
          <h1 id="home-title">Mais controle.<br /><span>Menos tentativa e erro.</span></h1>
          <p className="home-hero-lead">
            A Quanton3D oferece um repositório completo para que você possa obter os melhores resultados em suas impressões. Acesse a opção abaixo que melhor se adeque às suas necessidades.
          </p>

          <div className="home-trust-row" aria-label="Recursos disponíveis">
            <span><CheckCircle2 size={15} /> Parâmetros de partida</span>
            <span><CheckCircle2 size={15} /> Ferramentas práticas</span>
            <span><CheckCircle2 size={15} /> Suporte especializado</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <video
            className="home-hero-video"
            src="/images/videos/video_banner_home.mp4"
            poster="/images/videos/foto_hero_site.png"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <img className="home-hero-video-fallback" src="/images/videos/foto_hero_site.png" alt="Pessoa interagindo com uma impressora 3D em um estúdio de luz azul e roxa" />
        </div>
      </section>

      <section className="home-pathfinder-section" aria-labelledby="pathfinder-title">
        <div className="home-section-heading home-pathfinder-intro">
          <span className="q-eyebrow">Comece pela sua necessidade</span>
          <h2 id="pathfinder-title">O que você quer resolver agora?</h2>
          <p>Escolha um caminho e encontre o recurso mais útil para o momento da sua impressão.</p>
        </div>

        <div className="home-pathfinder q-card">
          <div className="home-pathfinder-options" role="tablist" aria-label="Escolha sua necessidade">
            {CAMINHOS.map((caminho) => {
              const Icon = caminho.icon;
              const ativo = caminhoAtivo.id === caminho.id;
              return (
                <button
                  key={caminho.id}
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  className={`home-path-option${ativo ? " is-active" : ""}`}
                  onClick={() => setCaminhoAtivo(caminho)}
                >
                  <Icon size={17} />
                  <span>{caminho.label}</span>
                </button>
              );
            })}
          </div>

          <div className={`home-pathfinder-visual is-${caminhoAtivo.id}`} aria-live="polite">
            <img className="home-pathfinder-visual-img" src={caminhoAtivo.imagem} alt={caminhoAtivo.label} />
            <div className="home-pathfinder-visual-frame">
              <span className="home-pathfinder-visual-icon"><CaminhoIcon size={30} /></span>
              <strong>{caminhoAtivo.label}</strong>
            </div>
          </div>

          <div className="home-pathfinder-result" role="tabpanel" aria-live="polite">
            <span className="home-path-number">0{CAMINHOS.findIndex((item) => item.id === caminhoAtivo.id) + 1}</span>
            <h3>{caminhoAtivo.title}</h3>
            <p>{caminhoAtivo.desc}</p>
            <button type="button" className="q-btn q-btn--primary home-pathfinder-action" onClick={() => onNavegar(caminhoAtivo.page)}>
              {caminhoAtivo.action} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="home-product-banner" aria-labelledby="product-banner-title">
        <img src="/images/linha-resinas-quanton3d.png" alt="Linha de resinas Quanton3D" />
        <div className="home-product-banner-overlay">
          <span className="q-eyebrow">Do material ao resultado</span>
          <h2 id="product-banner-title">A resina certa muda o que é possível imprimir.</h2>
          <p>Nem toda resina foi feita para o mesmo desafio. Antes de ajustar a impressora, entenda o que você espera da peça — cada formulação Quanton3D foi pensada para um resultado diferente.</p>
          <div className="home-product-attributes" aria-label="Características das resinas">
            <span>Detalhe</span>
            <span>Resistência</span>
            <span>Flexibilidade</span>
            <span>Acabamento</span>
          </div>
          <button type="button" className="q-btn q-btn--primary" onClick={() => onNavegar("catalogo")}>
            Conhecer as resinas <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomeSection;

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-number">404</div>
        <h1>Página não encontrada</h1>
        <p>A página que você está procurando não existe ou foi movida.</p>
        <div className="not-found-actions">
          <a href="/" className="home-button">
            Voltar ao Início
          </a>
          <a href="/#contato" className="contact-button">
            Fale Conosco
          </a>
        </div>
      </div>

      <style>{`
        .not-found-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 200px);
          padding: 40px 20px;
        }

        .not-found-content {
          text-align: center;
          max-width: 500px;
        }

        .not-found-number {
          font-size: 120px;
          font-weight: 900;
          background: linear-gradient(135deg, #00d4ff, #0066ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 20px;
        }

        .not-found-content h1 {
          color: #ffffff;
          font-size: 32px;
          margin-bottom: 15px;
        }

        .not-found-content p {
          color: #cccccc;
          font-size: 16px;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .not-found-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .home-button,
        .contact-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .home-button {
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: white;
        }

        .home-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 212, 255, 0.3);
        }

        .contact-button {
          background: transparent;
          color: #00d4ff;
          border: 2px solid #00d4ff;
        }

        .contact-button:hover {
          background: rgba(0, 212, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default NotFound;

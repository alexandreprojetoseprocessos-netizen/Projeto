type NotFoundPageProps = {
  onBackToDashboard?: () => void;
  onViewProjects?: () => void;
};

export const NotFoundPage = ({ onBackToDashboard, onViewProjects }: NotFoundPageProps) => (
  <section className="notfound-page">
    <div className="notfound-illustration" aria-hidden>
      <svg width="220" height="160" viewBox="0 0 220 160" role="presentation">
        <defs>
          <linearGradient id="notfoundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b3fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1f2a44" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect x="10" y="20" width="200" height="120" rx="16" fill="url(#notfoundGradient)" opacity="0.2" />
        <rect x="30" y="35" width="120" height="20" rx="8" fill="#5b3fff" opacity="0.5" />
        <rect x="30" y="65" width="160" height="12" rx="6" fill="#1f2a44" opacity="0.25" />
        <rect x="30" y="85" width="160" height="12" rx="6" fill="#1f2a44" opacity="0.18" />
        <circle cx="170" cy="48" r="18" fill="#ff5a5a" opacity="0.3" />
        <circle cx="60" cy="120" r="12" fill="#1ec28b" opacity="0.4" />
      </svg>
    </div>
    <div className="notfound-content">
      <p className="eyebrow">Erro 404</p>
      <h2>Essa página ou projeto não foi encontrado.</h2>
      <p className="subtext">
        Talvez o link tenha expirado ou o projeto tenha sido arquivado. Você pode voltar ao dashboard ou abrir a listagem
        de projetos para escolher outro workspace.
      </p>
      <div className="notfound-actions">
        <button type="button" className="primary-button" onClick={onBackToDashboard}>
          Voltar ao Dashboard
        </button>
        <button type="button" className="ghost-button" onClick={onViewProjects}>
          Ver projetos
        </button>
      </div>
    </div>
  </section>
);

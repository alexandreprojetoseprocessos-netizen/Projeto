import { type ReactNode } from "react";

type AppPageHeroTone = "default" | "info" | "success" | "warning" | "danger";

export type AppPageHeroStat = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: AppPageHeroTone;
};

type AppPageHeroProps = {
  kicker: string;
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  stats?: AppPageHeroStat[];
  className?: string;
};

type AppStateCardProps = {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  tone?: AppPageHeroTone;
  className?: string;
};

const joinClasses = (...values: Array<string | undefined | false | null>) => values.filter(Boolean).join(" ");

export const AppPageHero = ({ kicker, title, subtitle, actions, stats = [], className }: AppPageHeroProps) => (
  <header className={joinClasses("app-page-hero", className)}>
    <div className="app-page-hero__top">
      <div className="app-page-hero__content">
        <p className="app-page-hero__kicker">{kicker}</p>
        <h1 className="app-page-hero__title">{title}</h1>
        <p className="app-page-hero__subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="app-page-hero__actions">{actions}</div> : null}
    </div>
    {stats.length ? (
      <div className="app-page-hero__stats">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={joinClasses("app-page-hero__stat", stat.tone ? `is-${stat.tone}` : undefined)}
          >
            {stat.icon ? <div className="app-page-hero__stat-icon">{stat.icon}</div> : null}
            <div className="app-page-hero__stat-copy">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              {stat.helper ? <small>{stat.helper}</small> : null}
            </div>
          </article>
        ))}
      </div>
    ) : null}
  </header>
);

export const AppStateCard = ({
  title,
  description,
  action,
  tone = "default",
  className
}: AppStateCardProps) => (
  <article className={joinClasses("app-state-card", `is-${tone}`, className)}>
    <div className="app-state-card__content">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
    {action ? <div className="app-state-card__action">{action}</div> : null}
  </article>
);

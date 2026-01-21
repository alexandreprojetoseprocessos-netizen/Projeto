import type { LucideIcon } from "lucide-react";

export type KPIItem = {
  label: string;
  value: string;
  subLabel: string;
  delta: string;
  tone: "success" | "warning" | "danger" | "info";
  icon: LucideIcon;
};

type KPICardsProps = {
  items: KPIItem[];
};

export const KPICards = ({ items }: KPICardsProps) => (
  <div className="dashboard-kpi-grid">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <article
          key={item.label}
          className={`dashboard-card dashboard-kpi-card dashboard-hover tone-${item.tone}`}
        >
          <div className="dashboard-kpi-header">
            <span className="dashboard-label">{item.label}</span>
            <span className="dashboard-kpi-icon">
              <Icon className="dashboard-kpi-icon-svg" />
            </span>
          </div>
          <div className="dashboard-kpi-value">{item.value}</div>
          <div className="dashboard-kpi-meta">
            <span className="dashboard-muted">{item.subLabel}</span>
            <span className="dashboard-kpi-delta">{item.delta}</span>
          </div>
        </article>
      );
    })}
  </div>
);

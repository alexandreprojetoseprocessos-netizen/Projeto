import { useMemo, useState } from "react";

type DeadlineItem = {
  id: string;
  title: string;
  projectId?: string | null;
  projectName?: string | null;
  date: string;
  priority: string;
  statusLabel?: string;
  isLate?: boolean;
};

type UpcomingDeadlinesProps = {
  items: DeadlineItem[];
  monthItems: DeadlineItem[];
};

export const UpcomingDeadlines = ({ items, monthItems }: UpcomingDeadlinesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resolvedMonthItems = monthItems ?? [];
  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
      }),
    []
  );

  const renderItem = (item: DeadlineItem) => {
    const priorityTone = item.isLate
      ? "danger"
      : item.priority.toLowerCase() === "alta"
        ? "warning"
        : item.priority.toLowerCase() === "media"
          ? "info"
          : "neutral";
    const statusText = item.statusLabel?.toLowerCase() ?? "";
    const statusTone =
      item.isLate || statusText.includes("atras") || statusText.includes("risco")
        ? "danger"
        : statusText.includes("andamento") || statusText.includes("progresso")
          ? "info"
          : statusText.includes("revis") || statusText.includes("homolog")
            ? "warning"
            : "neutral";

    return (
      <div key={item.id} className={`dashboard-deadline-item ${item.isLate ? "is-late" : ""}`}>
        <div className="dashboard-deadline-main">
          <div className="dashboard-deadline-title">{item.title}</div>
          {item.projectName && <div className="dashboard-deadline-project dashboard-muted">{item.projectName}</div>}
          <div className="dashboard-deadline-date">{item.date}</div>
        </div>
        <div className="dashboard-deadline-tags">
          {item.isLate && <span className="dashboard-pill dashboard-pill--danger">Atrasado</span>}
          {item.statusLabel && <span className={`dashboard-pill dashboard-pill--${statusTone}`}>{item.statusLabel}</span>}
          <span className={`dashboard-pill dashboard-pill--${priorityTone}`}>{item.priority}</span>
        </div>
      </div>
    );
  };

  return (
    <article className="dashboard-card dashboard-hover">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Proximos Prazos</h3>
          <p className="dashboard-muted">Tarefas com vencimento proximo</p>
        </div>
        <button type="button" className="dashboard-link-button" onClick={() => setIsModalOpen(true)}>
          Ver todos
        </button>
      </div>
      <div className="dashboard-deadlines">{items.map(renderItem)}</div>

      {isModalOpen && (
        <div className="gp-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="gp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="gp-modal-header">
              <h2>Proximos Prazos</h2>
              <button type="button" className="gp-modal-close" onClick={() => setIsModalOpen(false)}>
                x
              </button>
            </div>
            <p className="gp-modal-subtitle">Tarefas com vencimento em {monthLabel}</p>
            <div className="gp-modal-body">
              {resolvedMonthItems.length ? (
                <div className="dashboard-deadlines">{resolvedMonthItems.map(renderItem)}</div>
              ) : (
                <p className="dashboard-muted">Sem tarefas neste mes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

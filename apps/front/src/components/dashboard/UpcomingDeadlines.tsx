type DeadlineItem = {
  id: string;
  title: string;
  date: string;
  priority: string;
  isLate?: boolean;
};

type UpcomingDeadlinesProps = {
  items: DeadlineItem[];
};

export const UpcomingDeadlines = ({ items }: UpcomingDeadlinesProps) => (
  <article className="dashboard-card dashboard-hover">
    <div className="dashboard-card-header">
      <div>
        <h3 className="dashboard-card-title">Proximos Prazos</h3>
        <p className="dashboard-muted">Tarefas com vencimento proximo</p>
      </div>
      <span className="dashboard-link">Ver todos</span>
    </div>
    <div className="dashboard-deadlines">
      {items.map((item) => {
        const priorityTone = item.isLate
          ? "danger"
          : item.priority.toLowerCase() === "alta"
            ? "warning"
            : item.priority.toLowerCase() === "media"
              ? "info"
              : "neutral";
        return (
          <div key={item.id} className={`dashboard-deadline-item ${item.isLate ? "is-late" : ""}`}>
            <div className="dashboard-deadline-main">
              <div className="dashboard-deadline-title">{item.title}</div>
              <div className="dashboard-deadline-date">{item.date}</div>
            </div>
            <div className="dashboard-deadline-tags">
              {item.isLate && <span className="dashboard-pill dashboard-pill--danger">Atrasado</span>}
              <span className={`dashboard-pill dashboard-pill--${priorityTone}`}>{item.priority}</span>
            </div>
          </div>
        );
      })}
    </div>
  </article>
);

type PriorityItem = {
  name: string;
  value: number;
  color: string;
};

type TasksByPriorityProps = {
  items: PriorityItem[];
};

export const TasksByPriority = ({ items }: TasksByPriorityProps) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="dashboard-card dashboard-hover">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Tarefas por Prioridade</h3>
          <p className="dashboard-muted">Nivel de urgencia por volume</p>
        </div>
      </div>
      <div className="dashboard-priority-list">
        {items.map((item) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="dashboard-priority-item">
              <div className="dashboard-priority-header">
                <span className="dashboard-priority-label">{item.name}</span>
                <span className="dashboard-priority-value">{item.value}</span>
              </div>
              <div className="dashboard-priority-bar">
                <div
                  className="dashboard-priority-fill"
                  style={{ width: `${percent}%`, background: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="dashboard-priority-summary">
        {items.map((item) => (
          <div key={`summary-${item.name}`} className="dashboard-summary-dot">
            <span className="dashboard-legend-dot" style={{ background: item.color }} />
            <span className="dashboard-muted">{item.name}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
};

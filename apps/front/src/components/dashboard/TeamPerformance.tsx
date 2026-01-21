type TeamMember = {
  id: string;
  name: string;
  done: number;
  total: number;
  percent: number;
};

type TeamPerformanceProps = {
  members: TeamMember[];
};

export const TeamPerformance = ({ members }: TeamPerformanceProps) => {
  const topMember = members[0]?.name ?? "Equipe";

  return (
    <article className="dashboard-card dashboard-hover">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Desempenho da Equipe</h3>
          <p className="dashboard-muted">Resumo semanal das entregas</p>
        </div>
        <span className="dashboard-badge">Top: {topMember}</span>
      </div>
      <div className="dashboard-team-list">
        {members.map((member) => {
          const initials = member.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");
          return (
            <div key={member.id} className="dashboard-team-item">
              <div className="dashboard-team-avatar">{initials || "?"}</div>
              <div className="dashboard-team-info">
                <div className="dashboard-team-name">{member.name}</div>
                <div className="dashboard-team-meta">
                  {member.done}/{member.total} tarefas
                </div>
              </div>
              <div className="dashboard-team-progress">
                <div className="dashboard-progress-track">
                  <div className="dashboard-progress-fill" style={{ width: `${member.percent}%` }} />
                </div>
                <span className="dashboard-team-percent">{member.percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
};

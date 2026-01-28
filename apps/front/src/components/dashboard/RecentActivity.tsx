import { CheckCircle2, MessageCircle, PencilLine } from "lucide-react";

type ActivityItem = {
  id: string;
  description: string;
  timeAgo: string;
};

type RecentActivityProps = {
  items: ActivityItem[];
};

const activityIcons = [CheckCircle2, PencilLine, MessageCircle];

export const RecentActivity = ({ items }: RecentActivityProps) => (
  <article className="dashboard-card dashboard-hover">
    <div className="dashboard-card-header">
      <div>
        <h3 className="dashboard-card-title">Atividade Recente</h3>
        <p className="dashboard-muted">Atualizacoes e entregas recentes</p>
      </div>
      <span className="dashboard-link">Ver tudo</span>
    </div>
    <div className="dashboard-activity-list">
      {items.length ? (
        items.map((item, index) => {
          const Icon = activityIcons[index % activityIcons.length];
          const author = item.description.split(" ")[0] || "?";
          return (
            <div key={item.id} className="dashboard-activity-item">
              <div className="dashboard-activity-avatar">{author[0]?.toUpperCase() || "?"}</div>
              <div className="dashboard-activity-body">
                <div className="dashboard-activity-text">{item.description}</div>
                <div className="dashboard-activity-time">{item.timeAgo}</div>
              </div>
              <div className="dashboard-activity-icon">
                <Icon className="dashboard-activity-type" />
              </div>
            </div>
          );
        })
      ) : (
        <p className="dashboard-muted">Nenhuma atividade recente.</p>
      )}
    </div>
  </article>
);

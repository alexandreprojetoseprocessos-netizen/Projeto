import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";

const formatShortDate = (value?: string | null) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    });
  } catch {
    return "";
  }
};

export const ActivitiesPage = () => {
  const { comments, commentsError } = useOutletContext<DashboardOutletContext>();

  const activityItems = (comments ?? []).map((comment: any) => ({
    id: comment.id,
    author: comment.author?.name ?? comment.authorName ?? "Colaborador",
    role: comment.author?.role ?? comment.authorRole ?? "Equipe",
    body: comment.body,
    createdAt: comment.createdAt ?? new Date().toISOString()
  }));

  return (
    <section className="activities-page">
      <header className="page-header">
        <h1>Atividades</h1>
        {commentsError && <p className="error-text">{commentsError}</p>}
      </header>

      <div className="activity-panel">
        <article className="card">
          <div className="card-header">
            <h3>Timeline de atividades</h3>
          </div>

          {activityItems.length ? (
            <ul className="activity-timeline">
              {activityItems.map((activity) => (
                <li key={activity.id}>
                  <div className="activity-avatar">{activity.author?.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{activity.author}</strong>
                    <span>{activity.role}</span>
                    <p>{activity.body}</p>
                    <small>{formatShortDate(activity.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhuma atividade registrada.</p>
          )}
        </article>
      </div>
    </section>
  );
};

export default ActivitiesPage;

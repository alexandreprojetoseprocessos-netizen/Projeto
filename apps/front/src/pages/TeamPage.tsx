import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canManageTeam, type OrgRole } from "../components/permissions";

type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type Member = {
  id: string;
  role: MemberRole;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const TeamPage = () => {
  const { token, user } = useAuth();
  const { selectedOrganizationId, currentOrgRole } = useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!token || !selectedOrganizationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${selectedOrganizationId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.message ?? "Falha ao carregar equipe";
        throw new Error(message);
      }
      setMembers(body.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar equipe");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId, token]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedOrganizationId) return;
    if (!inviteEmail.trim()) {
      setInviteError("Informe um e-mail válido.");
      return;
    }

    setInviteSubmitting(true);
    setInviteError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${selectedOrganizationId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.message ?? "Falha ao enviar convite";
        throw new Error(message);
      }
      setInviteEmail("");
      setInviteRole("MEMBER");
      await fetchMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const isOnboarding = useMemo(() => members.length <= 1, [members.length]);
  const canInvite = canManageTeam(orgRole);

  const roleLabels: Record<MemberRole, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MEMBER: "Membro",
    VIEWER: "Visualizador"
  };

  const currentUserId = user?.id ?? null;

  return (
    <section className="team-page">
      <header className="page-header">
        <p className="eyebrow">Administração</p>
        <h1>Equipe</h1>
      </header>

      {loading ? (
        <p className="muted">Carregando equipe...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : isOnboarding ? (
        <div className="workspace-empty-card team-onboarding">
          <h2>Passo 3 de 3: Convide sua equipe</h2>
          <p>Convide colegas para colaborar em projetos, quadros, cronogramas e relatórios.</p>

          {canInvite ? (
            <form className="workspace-form" onSubmit={handleInvite}>
              <label className="input-group">
                <span>E-mail</span>
                <input
                  type="email"
                  placeholder="colega@empresa.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                />
              </label>

              <label className="input-group">
                <span>Papel</span>
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MemberRole)}>
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Membro</option>
                  <option value="VIEWER">Visualizador</option>
                </select>
              </label>

              {inviteError && <p className="error-text">{inviteError}</p>}

              <button type="submit" className="primary-button" disabled={inviteSubmitting}>
                {inviteSubmitting ? "Enviando..." : "Enviar convite"}
              </button>
            </form>
          ) : (
            <p className="muted">Você pode visualizar a equipe, mas não pode convidar novos membros.</p>
          )}
        </div>
      ) : (
        <div className="team-list">
          <div className="team-list__header">
            <h2>Membros da organização</h2>
            {canInvite ? (
              <button className="secondary-button" type="button" onClick={() => setInviteRole("MEMBER")}>
                Convidar novo membro
              </button>
            ) : null}
          </div>

          <table className="team-members-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    {member.user.fullName || member.user.email}{" "}
                    {currentUserId === member.user.id ? <span className="muted">(você)</span> : null}
                  </td>
                  <td>{member.user.email}</td>
                  <td>{roleLabels[member.role] ?? member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {canInvite ? (
            <div className="team-invite-inline">
              <h3>Convidar mais alguém</h3>
              <form className="workspace-form" onSubmit={handleInvite}>
                <label className="input-group">
                  <span>E-mail</span>
                  <input
                    type="email"
                    placeholder="colega@empresa.com"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="input-group">
                  <span>Papel</span>
                  <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MemberRole)}>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Membro</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                </label>

                {inviteError && <p className="error-text">{inviteError}</p>}

                <button type="submit" className="primary-button" disabled={inviteSubmitting}>
                  {inviteSubmitting ? "Enviando..." : "Convidar"}
                </button>
              </form>
            </div>
          ) : (
            <p className="muted">Você não tem permissão para convidar novos membros nesta organização.</p>
          )}
        </div>
      )}
    </section>
  );
};

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, Search, TrendingUp, UserPlus, Users, X, Pencil } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canManageTeam, type OrgRole } from "../components/permissions";
import { apiUrl } from "../config/api";

type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type Member = {
  id: string;
  role: MemberRole;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    address?: string | null;
    jobTitle?: string | null;
    avatarUrl?: string | null;
    active?: boolean | null;
    documentNumber?: string | null;
  };
};

type TaskNode = {
  id: string;
  status: string;
  type?: string | null;
  projectId: string;
  responsible?: {
    membershipId?: string | null;
    userId?: string | null;
  } | null;
};

const normalizeTaskStatus = (value?: string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ");

const resolveTaskStatus = (value?: string | null) => {
  const key = normalizeTaskStatus(value);
  if (!key) return "BACKLOG";
  if (["done", "finalizado", "finalizada", "concluido", "concluida", "completed", "finished"].includes(key)) {
    return "DONE";
  }
  if (["in progress", "em andamento", "andamento", "fazendo", "doing", "em progresso", "progresso"].includes(key)) {
    return "IN_PROGRESS";
  }
  if (["delayed", "em atraso", "atrasado", "atrasada", "late", "overdue"].includes(key)) {
    return "DELAYED";
  }
  if (["risk", "em risco", "risco"].includes(key)) {
    return "RISK";
  }
  if (["blocked", "bloqueado", "bloqueada"].includes(key)) {
    return "BLOCKED";
  }
  if (["review", "revisao", "homologacao"].includes(key)) {
    return "REVIEW";
  }
  if (["todo", "a fazer", "afazer", "planejado", "planejamento"].includes(key)) {
    return "TODO";
  }
  if (["backlog", "nao iniciado", "não iniciado"].includes(key)) {
    return "BACKLOG";
  }
  return key.toUpperCase().replace(/ /g, "_");
};

const flattenWbsNodes = (nodes: any[], projectId: string): TaskNode[] => {
  const result: TaskNode[] = [];
  const stack = [...nodes];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.children?.length) {
      stack.push(...node.children);
    }
    result.push({
      id: node.id,
      status: node.status,
      type: node.type,
      projectId,
      responsible: node.responsible
        ? {
            membershipId: node.responsible.membershipId,
            userId: node.responsible.userId
          }
        : null
    });
  }
  return result;
};

const getInitials = (value: string) => {
  const clean = value.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const TeamPage = () => {
  const { token, user } = useAuth();
  const { selectedOrganizationId, currentOrgRole, projects } = useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taskNodes, setTaskNodes] = useState<TaskNode[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    cpf: "",
    roleLabel: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    avatarUrl: ""
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPayload, setAvatarPayload] = useState<{
    base64: string;
    fileName: string;
    contentType: string;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const openProfileModal = (member: Member) => {
    setEditingMember(member);
    setProfileDraft({
      fullName: member.user.fullName ?? "",
      email: member.user.email ?? "",
      phone: member.user.phone ?? "",
      address: member.user.address ?? "",
      cpf: member.user.documentNumber ?? "",
      roleLabel: member.user.jobTitle ?? roleLabels[member.role] ?? member.role,
      status: member.user.active === false ? "INACTIVE" : "ACTIVE",
      avatarUrl: member.user.avatarUrl ?? ""
    });
    setAvatarPreview(member.user.avatarUrl ?? null);
    setAvatarPayload(null);
    setProfileError(null);
  };

  const handleSaveProfile = async () => {
    if (!editingMember || !token || !selectedOrganizationId) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${editingMember.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileDraft.fullName,
          email: profileDraft.email,
          phone: profileDraft.phone,
          address: profileDraft.address,
          cpf: profileDraft.cpf,
          jobTitle: profileDraft.roleLabel,
          status: profileDraft.status,
          avatarBase64: avatarPayload?.base64,
          avatarFileName: avatarPayload?.fileName,
          avatarContentType: avatarPayload?.contentType
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Falha ao salvar perfil");
      }
      setEditingMember(null);
      await fetchMembers();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Falha ao salvar perfil");
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchMembers = async () => {
    if (!token || !selectedOrganizationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.message ?? "Falha ao carregar a equipe";
        throw new Error(message);
      }
      setMembers(body.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a equipe");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!token || !selectedOrganizationId) return;
    if (!projects?.length) {
      setTaskNodes([]);
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const errors: string[] = [];
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(apiUrl(`/projects/${project.id}/wbs`), {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(body?.message ?? "Falha ao carregar tarefas");
            }
            return flattenWbsNodes(body.nodes ?? [], project.id);
          } catch (err) {
            errors.push(err instanceof Error ? err.message : "Falha ao carregar tarefas");
            return [];
          }
        })
      );
      setTaskNodes(results.flat());
      if (errors.length) {
        setTasksError("Alguns dados de tarefas não puderam ser carregados.");
      }
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedOrganizationId, token]);

  useEffect(() => {
    fetchTasks();
  }, [selectedOrganizationId, token, projects]);

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
      const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members`), {
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
      setShowInvite(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const canInvite = canManageTeam(orgRole);
  const currentUserId = user?.id ?? null;

  const roleLabels: Record<MemberRole, string> = {
    OWNER: "Liderança",
    ADMIN: "Administração",
    MEMBER: "Equipe",
    VIEWER: "Convidado"
  };

  const memberStats = useMemo(() => {
    return members.map((member) => {
      const assignedTasks = taskNodes.filter(
        (node) => node.responsible?.membershipId === member.id || node.responsible?.userId === member.user.id
      );
      const total = assignedTasks.length;
      const done = assignedTasks.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
      const progress = total ? Math.round((done / total) * 100) : 0;
      const projectCount = new Set(assignedTasks.map((node) => node.projectId)).size;
      return {
        ...member,
        assignedTasks: total,
        completedTasks: done,
        progress,
        projectCount
      };
    });
  }, [members, taskNodes]);

  const totalTasks = taskNodes.length;
  const doneTasks = taskNodes.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
  const productivity = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const departmentGroups = useMemo(() => {
    const counts = members.reduce<Record<MemberRole, number>>(
      (acc, member) => {
        acc[member.role] = (acc[member.role] ?? 0) + 1;
        return acc;
      },
      { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 }
    );
    return (Object.keys(counts) as MemberRole[])
      .map((role) => ({ role, count: counts[role], label: roleLabels[role] }))
      .filter((group) => group.count > 0);
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return memberStats;
    const term = searchTerm.trim().toLowerCase();
    return memberStats.filter(
      (member) =>
        member.user.fullName?.toLowerCase().includes(term) || member.user.email?.toLowerCase().includes(term)
    );
  }, [memberStats, searchTerm]);

  return (
    <section className="team-page">
      <header className="team-header">
        <div>
          <h1>Equipes</h1>
          <p className="muted">Gerencie os membros e departamentos da sua organização.</p>
        </div>
        {canInvite ? (
          <button type="button" className="primary-button team-header__cta" onClick={() => setShowInvite((prev) => !prev)}>
            <UserPlus size={18} />
            {showInvite ? "Fechar" : "Adicionar membro"}
          </button>
        ) : null}
      </header>

      {showInvite && canInvite ? (
        <article className="team-invite-card">
          <h2>Convide um membro</h2>
          <p className="muted">Envie um convite para colaborar com sua organização.</p>
          <form className="team-invite-form" onSubmit={handleInvite}>
            <label>
              <span>E-mail</span>
              <input
                type="email"
                placeholder="colega@empresa.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Papel</span>
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MemberRole)}>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Membro</option>
                <option value="VIEWER">Convidado</option>
              </select>
            </label>
            {inviteError && <p className="error-text">{inviteError}</p>}
            <button type="submit" className="primary-button" disabled={inviteSubmitting}>
              {inviteSubmitting ? "Enviando..." : "Enviar convite"}
            </button>
          </form>
        </article>
      ) : null}

      {loading ? (
        <p className="muted">Carregando equipe...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <>
          <section className="team-overview">
            <article className="team-overview-card">
              <div className="team-overview-icon is-blue">
                <Users size={22} />
              </div>
              <div>
                <h3>Membros ativos</h3>
                <strong>{members.length}</strong>
                <span className="muted">Equipe cadastrada</span>
              </div>
            </article>
            <article className="team-overview-card">
              <div className="team-overview-icon is-green">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3>Tarefas concluídas</h3>
                <strong>{doneTasks}</strong>
                <span className="muted">{totalTasks ? `${doneTasks} de ${totalTasks} tarefas` : "Sem tarefas atribuídas"}</span>
              </div>
            </article>
            <article className="team-overview-card">
              <div className="team-overview-icon is-orange">
                <TrendingUp size={22} />
              </div>
              <div>
                <h3>Projetos atribuídos</h3>
                <strong>{projects?.length ?? 0}</strong>
                <span className="muted">Projetos vinculados à organização</span>
              </div>
            </article>
            <article className="team-overview-card">
              <div className="team-overview-icon is-purple">
                <Users size={22} />
              </div>
              <div>
                <h3>Produtividade</h3>
                <strong>{totalTasks ? `${productivity}%` : "—"}</strong>
                <span className="muted">Média de tarefas concluídas</span>
              </div>
              <div className="team-progress">
                <div className="team-progress__bar">
                  <span style={{ width: `${productivity}%` }} />
                </div>
                <small>{totalTasks ? `${productivity}% concluído` : "Sem dados suficientes"}</small>
              </div>
            </article>
          </section>

          {tasksLoading ? <p className="muted">Carregando tarefas atribuídas...</p> : null}
          {tasksError ? <p className="error-text">{tasksError}</p> : null}

          <section className="team-departments">
            <div className="team-section-header">
              <h2>Departamentos</h2>
              <span className="muted">Distribuição por perfil de acesso</span>
            </div>
            <div className="team-departments-grid">
              {departmentGroups.map((group) => (
                <div key={group.role} className={`team-department-card is-${group.role.toLowerCase()}`}>
                  <div>
                    <strong>{group.label}</strong>
                    <span>{group.count} membros</span>
                  </div>
                </div>
              ))}
              {!departmentGroups.length ? <p className="muted">Sem membros cadastrados.</p> : null}
            </div>
          </section>

          <section className="team-members">
            <div className="team-section-header">
              <h2>Membros</h2>
              <div className="team-search">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Buscar membros..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="team-members-grid">
              {filteredMembers.map((member) => (
                <article key={member.id} className="team-member-card">
                  <header>
                    <div className="team-member-avatar">
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt={`Foto de ${member.user.fullName || member.user.email}`} />
                      ) : (
                        getInitials(member.user.fullName || member.user.email)
                      )}
                    </div>
                    <div className="team-member-info">
                      <h3>
                        {member.user.fullName || member.user.email}
                        {currentUserId === member.user.id ? <span className="muted"> (você)</span> : null}
                      </h3>
                      <p>{member.user.email}</p>
                    </div>
                    <button type="button" className="team-edit-button" onClick={() => openProfileModal(member)} aria-label="Editar perfil">
                      <Pencil size={16} />
                      Editar perfil
                    </button>
                    <span className={`team-role-badge is-${member.role.toLowerCase()}`}>
                      {roleLabels[member.role] ?? member.role}
                    </span>
                  </header>

                  <div className="team-member-stats">
                    <div>
                      <span>Tarefas</span>
                      <strong>
                        {member.assignedTasks ? `${member.completedTasks}/${member.assignedTasks}` : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Projetos</span>
                      <strong>{member.projectCount ?? 0}</strong>
                    </div>
                  </div>

                  <div className="team-member-progress">
                    <div className="team-progress__bar">
                      <span style={{ width: `${member.progress}%` }} />
                    </div>
                    <span>{member.assignedTasks ? `${member.progress}% concluído` : "Sem tarefas atribuídas"}</span>
                  </div>
                </article>
              ))}
              {!filteredMembers.length ? (
                <div className="team-empty">
                  <h3>Nenhum membro encontrado</h3>
                  <p>Verifique o filtro ou convide novos membros para a organização.</p>
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}

      {editingMember ? (
        <div className="team-modal-overlay" role="dialog" aria-modal="true">
          <div className="team-modal">
            <header>
              <div>
                <h2>Perfil do membro</h2>
                <p className="muted">Dados cadastrados na organização.</p>
              </div>
              <button type="button" className="team-modal-close" onClick={() => setEditingMember(null)}>
                <X size={18} />
              </button>
            </header>

            <div className="team-modal-body">
              <div className="team-modal-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Foto do perfil" />
                ) : (
                  getInitials(profileDraft.fullName || profileDraft.email)
                )}
                <label className="team-avatar-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setAvatarPreview(url);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const result = typeof reader.result === "string" ? reader.result : "";
                        setAvatarPayload({
                          base64: result,
                          fileName: file.name,
                          contentType: file.type || "image/png"
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  Trocar foto
                </label>
              </div>

              <div className="team-modal-grid">
                <div>
                  <label>Nome</label>
                  <input
                    type="text"
                    value={profileDraft.fullName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={profileDraft.phone}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="(11) 99999-0000"
                  />
                </div>
                <div>
                  <label>CPF</label>
                  <input
                    type="text"
                    value={profileDraft.cpf}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, cpf: event.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={profileDraft.address}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="Rua, número, cidade"
                  />
                </div>
                <div>
                  <label>Função</label>
                  <input
                    type="text"
                    value={profileDraft.roleLabel}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, roleLabel: event.target.value }))}
                    placeholder={roleLabels[editingMember.role] ?? editingMember.role}
                  />
                </div>
                <div>
                  <label>Status</label>
                  <div className="team-status-toggle">
                    <button
                      type="button"
                      className={profileDraft.status === "ACTIVE" ? "is-active" : ""}
                      onClick={() => setProfileDraft((prev) => ({ ...prev, status: "ACTIVE" }))}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      className={profileDraft.status === "INACTIVE" ? "is-active" : ""}
                      onClick={() => setProfileDraft((prev) => ({ ...prev, status: "INACTIVE" }))}
                    >
                      Desativado
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <footer className="team-modal-footer">
              <button type="button" className="secondary-button" onClick={() => setEditingMember(null)}>
                Fechar
              </button>
              <button type="button" className="primary-button" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </footer>
            {profileError ? <p className="error-text">{profileError}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};


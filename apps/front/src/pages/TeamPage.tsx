import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, Search, TrendingUp, UserPlus, Users, X, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import {
  canManageTeam,
  getDefaultModulePermissions,
  MODULE_PERMISSION_ACTIONS,
  MODULE_PERMISSION_DEFINITIONS,
  normalizeModulePermissionsForRole,
  type ModulePermissionAction,
  type ModulePermissionKey,
  type ModulePermissionMatrix,
  type OrgRole
} from "../components/permissions";
import { apiUrl } from "../config/api";

type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

type Member = {
  id: string;
  role: MemberRole;
  modulePermissions?: ModulePermissionMatrix | null;
  user: {
    id: string;
    email: string;
    corporateEmail?: string | null;
    personalEmail?: string | null;
    fullName: string;
    phone?: string | null;
    address?: string | null;
    jobTitle?: string | null;
    locale?: string | null;
    timezone?: string | null;
    twoFactorEnabled?: boolean | null;
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

const LOCALE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" }
];

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "UTC", label: "UTC" }
];

const cloneModulePermissions = (permissions: ModulePermissionMatrix): ModulePermissionMatrix =>
  MODULE_PERMISSION_DEFINITIONS.reduce((acc, moduleDefinition) => {
    acc[moduleDefinition.key] = {
      view: Boolean(permissions[moduleDefinition.key]?.view),
      create: Boolean(permissions[moduleDefinition.key]?.create),
      edit: Boolean(permissions[moduleDefinition.key]?.edit),
      delete: Boolean(permissions[moduleDefinition.key]?.delete)
    };
    return acc;
  }, {} as ModulePermissionMatrix);

const areModulePermissionsEqual = (left: ModulePermissionMatrix, right: ModulePermissionMatrix) =>
  MODULE_PERMISSION_DEFINITIONS.every((moduleDefinition) =>
    MODULE_PERMISSION_ACTIONS.every(
      (action) => Boolean(left[moduleDefinition.key]?.[action]) === Boolean(right[moduleDefinition.key]?.[action])
    )
  );

export const TeamPage = () => {
  const { token, user } = useAuth();
  const { selectedOrganizationId, currentOrgRole, projects, organizations } = useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taskNodes, setTaskNodes] = useState<TaskNode[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrganizationId, setInviteOrganizationId] = useState(selectedOrganizationId ?? "");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "ALL">("ALL");
  const [pendingRoles, setPendingRoles] = useState<Record<string, MemberRole>>({});
  const [roleUpdatingMemberId, setRoleUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    email: "",
    corporateEmail: "",
    personalEmail: "",
    phone: "",
    address: "",
    cpf: "",
    jobTitle: "",
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
    twoFactorEnabled: false,
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
  const [modulePermissionsDraft, setModulePermissionsDraft] = useState<ModulePermissionMatrix>(() =>
    getDefaultModulePermissions("MEMBER")
  );
  const [modulePermissionsBaseline, setModulePermissionsBaseline] = useState<ModulePermissionMatrix>(() =>
    getDefaultModulePermissions("MEMBER")
  );

  const openProfileModal = (member: Member) => {
    setEditingMember(member);
    setProfileDraft({
      fullName: member.user.fullName ?? "",
      email: member.user.email ?? "",
      corporateEmail: member.user.corporateEmail ?? "",
      personalEmail: member.user.personalEmail ?? "",
      phone: member.user.phone ?? "",
      address: member.user.address ?? "",
      cpf: member.user.documentNumber ?? "",
      jobTitle: member.user.jobTitle ?? roleLabels[member.role] ?? member.role,
      locale: member.user.locale ?? "pt-BR",
      timezone: member.user.timezone ?? "America/Sao_Paulo",
      twoFactorEnabled: Boolean(member.user.twoFactorEnabled),
      status: member.user.active === false ? "INACTIVE" : "ACTIVE",
      avatarUrl: member.user.avatarUrl ?? ""
    });
    setAvatarPreview(member.user.avatarUrl ?? null);
    setAvatarPayload(null);
    setProfileError(null);
    const resolvedModulePermissions = normalizeModulePermissionsForRole(member.role, member.modulePermissions);
    setModulePermissionsDraft(cloneModulePermissions(resolvedModulePermissions));
    setModulePermissionsBaseline(cloneModulePermissions(resolvedModulePermissions));
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
          corporateEmail: profileDraft.corporateEmail,
          personalEmail: profileDraft.personalEmail,
          phone: profileDraft.phone,
          address: profileDraft.address,
          cpf: profileDraft.cpf,
          jobTitle: profileDraft.jobTitle,
          locale: profileDraft.locale,
          timezone: profileDraft.timezone,
          status: profileDraft.status,
          ...(canManageMemberAccess(editingMember) ? { modulePermissions: modulePermissionsDraft } : {}),
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
      const fetchedMembers = (body.members ?? []) as Member[];
      setMembers(fetchedMembers);
      setPendingRoles(
        fetchedMembers.reduce<Record<string, MemberRole>>((acc, member) => {
          acc[member.id] = member.role;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a equipe");
      setMembers([]);
      setPendingRoles({});
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
                Authorization: `Bearer ${token}`,
                ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
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
    if (!token || !inviteOrganizationId) return;
    if (!inviteEmail.trim()) {
      setInviteError("Informe um e-mail válido.");
      return;
    }
    if (!inviteTargetOrganization) {
      setInviteError("Selecione uma organização para enviar o convite.");
      return;
    }
    if (!inviteRoleOptions.includes(inviteRole)) {
      setInviteError("Seu perfil não permite convidar este nível de acesso.");
      return;
    }

    setInviteSubmitting(true);
    setInviteError(null);
    try {
      const response = await fetch(apiUrl(`/organizations/${inviteOrganizationId}/members`), {
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
      setInviteRole(inviteRoleOptions[0] ?? "MEMBER");
      if (inviteOrganizationId === selectedOrganizationId) {
        await fetchMembers();
      }
      setShowInvite(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const canManageCurrentOrgTeam = canManageTeam(orgRole);
  const currentUserId = user?.id ?? null;

  const roleLabels: Record<MemberRole, string> = {
    OWNER: "Liderança",
    ADMIN: "Administração",
    MEMBER: "Equipe",
    VIEWER: "Convidado"
  };

  const roleCapabilities: Array<{ role: MemberRole; title: string; items: string[] }> = [
    {
      role: "OWNER",
      title: "Controle total da organização",
      items: ["Gerencia equipe e permissões", "Configura organização e plano", "Pode administrar owners e admins"]
    },
    {
      role: "ADMIN",
      title: "Administração operacional",
      items: ["Convida e edita membros", "Ajusta papéis de acesso", "Organiza projetos e responsáveis"]
    },
    {
      role: "MEMBER",
      title: "Execução do trabalho",
      items: ["Atualiza tarefas e entregas", "Colabora em projetos", "Não altera configuração global"]
    },
    {
      role: "VIEWER",
      title: "Acesso de leitura",
      items: ["Consulta dashboards e progresso", "Visualiza tarefas e documentos", "Sem edição de dados"]
    }
  ];

  const organizationsForInvite = useMemo(
    () =>
      (organizations ?? []).filter((organization) =>
        canManageTeam(((organization.role ?? "MEMBER") as OrgRole) ?? "MEMBER")
      ),
    [organizations]
  );

  const inviteTargetOrganization = useMemo(
    () => organizationsForInvite.find((organization) => organization.id === inviteOrganizationId) ?? null,
    [inviteOrganizationId, organizationsForInvite]
  );

  const inviteTargetOrgRole = ((inviteTargetOrganization?.role ?? "MEMBER") as OrgRole) ?? "MEMBER";
  const canInviteAnyOrganization = organizationsForInvite.length > 0;

  const inviteRoleOptions = useMemo<MemberRole[]>(() => {
    if (inviteTargetOrgRole === "OWNER") return ["ADMIN", "MEMBER", "VIEWER"];
    if (inviteTargetOrgRole === "ADMIN") return ["MEMBER", "VIEWER"];
    return [];
  }, [inviteTargetOrgRole]);

  const roleEditorOptions = useMemo<MemberRole[]>(() => {
    if (orgRole === "OWNER") return ["ADMIN", "MEMBER", "VIEWER"];
    if (orgRole === "ADMIN") return ["MEMBER", "VIEWER"];
    return [];
  }, [orgRole]);

  const selectedInviteCapability =
    roleCapabilities.find((capability) => capability.role === inviteRole) ??
    roleCapabilities.find((capability) => capability.role === inviteRoleOptions[0]) ??
    null;

  const inviteRuleHint = useMemo(() => {
    if (inviteTargetOrgRole === "OWNER") {
      return "Liderança pode convidar Administração, Equipe e Convidado.";
    }
    if (inviteTargetOrgRole === "ADMIN") {
      return "Administração pode convidar apenas Equipe e Convidado.";
    }
    return "Seu papel atual não permite enviar convites.";
  }, [inviteTargetOrgRole]);

  useEffect(() => {
    if (!organizationsForInvite.length) {
      setInviteOrganizationId("");
      return;
    }
    setInviteOrganizationId((current) => {
      if (current && organizationsForInvite.some((organization) => organization.id === current)) {
        return current;
      }
      if (selectedOrganizationId && organizationsForInvite.some((organization) => organization.id === selectedOrganizationId)) {
        return selectedOrganizationId;
      }
      return organizationsForInvite[0].id;
    });
  }, [organizationsForInvite, selectedOrganizationId]);

  useEffect(() => {
    if (!inviteRoleOptions.length) return;
    if (!inviteRoleOptions.includes(inviteRole)) {
      setInviteRole(inviteRoleOptions[0]);
    }
  }, [inviteRoleOptions, inviteRole]);

  const canManageMemberAccess = (member: Member) => {
    if (!canManageCurrentOrgTeam) return false;
    if (member.user.id === currentUserId) return false;
    if (orgRole === "OWNER") return member.role !== "OWNER";
    if (orgRole === "ADMIN") return member.role === "MEMBER" || member.role === "VIEWER";
    return true;
  };

  const hasModulePermissionChanges = useMemo(
    () => !areModulePermissionsEqual(modulePermissionsDraft, modulePermissionsBaseline),
    [modulePermissionsBaseline, modulePermissionsDraft]
  );

  const updateModulePermission = (moduleKey: ModulePermissionKey, action: ModulePermissionAction) => {
    setModulePermissionsDraft((current) => {
      const next = cloneModulePermissions(current);
      const nextValue = !next[moduleKey][action];
      next[moduleKey][action] = nextValue;

      if (action === "view" && !nextValue) {
        next[moduleKey].create = false;
        next[moduleKey].edit = false;
        next[moduleKey].delete = false;
      }

      if (action !== "view" && nextValue) {
        next[moduleKey].view = true;
      }

      return next;
    });
  };

  const resetModulePermissionsDraft = () => {
    setModulePermissionsDraft(cloneModulePermissions(modulePermissionsBaseline));
  };

  const handleRoleUpdate = async (member: Member) => {
    if (!token || !selectedOrganizationId) return;
    const nextRole = pendingRoles[member.id] ?? member.role;
    if (nextRole === member.role) return;
    if (!canManageMemberAccess(member)) return;

    setRoleUpdatingMemberId(member.id);
    setMemberActionError(null);

    try {
      const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${member.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Não foi possível atualizar o papel do membro.");
      }
      const updatedMember = (body?.member ?? null) as Member | null;
      if (updatedMember) {
        setMembers((current) => current.map((item) => (item.id === member.id ? updatedMember : item)));
      } else {
        setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: nextRole } : item)));
      }
      setPendingRoles((current) => ({ ...current, [member.id]: nextRole }));
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Não foi possível atualizar o papel do membro.");
    } finally {
      setRoleUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!token || !selectedOrganizationId) return;
    if (!canManageMemberAccess(member)) return;
    if (!window.confirm(`Remover ${member.user.fullName || member.user.email} da organização?`)) return;

    setRemovingMemberId(member.id);
    setMemberActionError(null);

    try {
      const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${member.id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Não foi possível remover o membro.");
      }
      await fetchMembers();
      await fetchTasks();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Não foi possível remover o membro.");
    } finally {
      setRemovingMemberId(null);
    }
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
    const term = searchTerm.trim().toLowerCase();
    return memberStats.filter(
      (member) => {
        const roleMatches = roleFilter === "ALL" || member.role === roleFilter;
        const textMatches =
          !term ||
          member.user.fullName?.toLowerCase().includes(term) ||
          member.user.email?.toLowerCase().includes(term);
        return roleMatches && textMatches;
      }
    );
  }, [memberStats, roleFilter, searchTerm]);

  const canConfigureModulePermissions = editingMember ? canManageMemberAccess(editingMember) : false;

  return (
    <section className="team-page">
      <header className="team-header">
        <div className="team-header__intro">
          <p className="team-header__eyebrow">Governança de acesso</p>
          <h1>Equipes</h1>
          <p className="muted">Gerencie membros, permissões e responsabilidades da organização em um painel único.</p>
        </div>
        {canInviteAnyOrganization ? (
          <button type="button" className="primary-button team-header__cta" onClick={() => setShowInvite((prev) => !prev)}>
            <UserPlus size={18} />
            {showInvite ? "Fechar" : "Adicionar membro"}
          </button>
        ) : null}
      </header>

      {showInvite && canInviteAnyOrganization ? (
        <article className="team-invite-card">
          <div className="team-invite-card__head">
            <div>
              <h2>Convide um membro</h2>
              <p className="muted">Envie um convite com papel já alinhado às regras de permissão.</p>
            </div>
            <span className="team-invite-rule-badge">Regras ativas</span>
          </div>
          <p className="team-invite-rule-hint">{inviteRuleHint}</p>
          <form className="team-invite-form" onSubmit={handleInvite}>
            <label>
              <span>Organização</span>
              <select
                value={inviteOrganizationId}
                onChange={(event) => setInviteOrganizationId(event.target.value)}
                required
              >
                {organizationsForInvite.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
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
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as MemberRole)}
                disabled={!inviteRoleOptions.length}
              >
                {inviteRoleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleLabels[roleOption]}
                  </option>
                ))}
              </select>
            </label>
            {inviteError && <p className="error-text">{inviteError}</p>}
            <button
              type="submit"
              className="primary-button"
              disabled={inviteSubmitting || !inviteOrganizationId || !inviteRoleOptions.length}
            >
              {inviteSubmitting ? "Enviando..." : "Enviar convite"}
            </button>
          </form>
          {selectedInviteCapability ? (
            <div className="team-invite-role-preview">
              <div className="team-invite-role-preview__head">
                <span className={`team-role-badge is-${selectedInviteCapability.role.toLowerCase()}`}>
                  {roleLabels[selectedInviteCapability.role]}
                </span>
                <strong>{selectedInviteCapability.title}</strong>
              </div>
              <ul>
                {selectedInviteCapability.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
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

          <section className="team-governance">
            <div className="team-section-header">
              <h2>Painel de permissões</h2>
              <span className="muted">Níveis de acesso e responsabilidades por papel</span>
            </div>
            <div className="team-governance-grid">
              {roleCapabilities.map((capability) => (
                <article key={capability.role} className={`team-governance-card is-${capability.role.toLowerCase()}`}>
                  <div className="team-governance-card__head">
                    <span className={`team-role-badge is-${capability.role.toLowerCase()}`}>
                      {roleLabels[capability.role]}
                    </span>
                    <ShieldCheck size={16} />
                  </div>
                  <h3>{capability.title}</h3>
                  <ul>
                    {capability.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="team-members">
            <div className="team-section-header">
              <h2>Membros</h2>
              <div className="team-members-tools">
                <div className="team-role-filter">
                  <label htmlFor="teamRoleFilter">Papel</label>
                  <select
                    id="teamRoleFilter"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as MemberRole | "ALL")}
                  >
                    <option value="ALL">Todos os papéis</option>
                    <option value="OWNER">{roleLabels.OWNER}</option>
                    <option value="ADMIN">{roleLabels.ADMIN}</option>
                    <option value="MEMBER">{roleLabels.MEMBER}</option>
                    <option value="VIEWER">{roleLabels.VIEWER}</option>
                  </select>
                </div>
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
            </div>
            {memberActionError ? <p className="error-text">{memberActionError}</p> : null}

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
                    <div className="team-member-actions">
                      <span className={`team-role-badge is-${member.role.toLowerCase()}`}>
                        {roleLabels[member.role] ?? member.role}
                      </span>

                      {canManageMemberAccess(member) ? (
                        <>
                          <label className="team-role-editor" aria-label={`Permissão de ${member.user.fullName || member.user.email}`}>
                            <span>Permissão</span>
                            <select
                              value={pendingRoles[member.id] ?? member.role}
                              onChange={(event) =>
                                setPendingRoles((current) => ({
                                  ...current,
                                  [member.id]: event.target.value as MemberRole
                                }))
                              }
                            >
                              {roleEditorOptions.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleLabels[roleOption]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="team-access-button"
                            onClick={() => handleRoleUpdate(member)}
                            disabled={roleUpdatingMemberId === member.id || (pendingRoles[member.id] ?? member.role) === member.role}
                          >
                            {roleUpdatingMemberId === member.id ? "Salvando..." : "Aplicar acesso"}
                          </button>
                          <button
                            type="button"
                            className="team-remove-button"
                            onClick={() => handleRemoveMember(member)}
                            disabled={removingMemberId === member.id}
                          >
                            <Trash2 size={14} />
                            {removingMemberId === member.id ? "Removendo..." : "Remover"}
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        className="team-edit-button"
                        onClick={() => openProfileModal(member)}
                        aria-label="Editar perfil"
                      >
                        <Pencil size={16} />
                        Editar perfil
                      </button>
                    </div>
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
              <div className="team-modal-avatar-wrap">
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
                <div className="team-profile-meta">
                  <span className={`team-role-badge is-${editingMember.role.toLowerCase()}`}>
                    {roleLabels[editingMember.role] ?? editingMember.role}
                  </span>
                  <span className={`team-profile-security ${profileDraft.twoFactorEnabled ? "is-on" : "is-off"}`}>
                    2FA {profileDraft.twoFactorEnabled ? "ativo" : "desativado"}
                  </span>
                </div>
              </div>

              <div className="team-modal-grid">
                <div>
                  <label>Nome completo</label>
                  <input
                    type="text"
                    value={profileDraft.fullName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label>E-mail de acesso</label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label>E-mail corporativo</label>
                  <input
                    type="email"
                    value={profileDraft.corporateEmail}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({ ...prev, corporateEmail: event.target.value }))
                    }
                    placeholder="nome.sobrenome@empresa.com"
                  />
                </div>
                <div>
                  <label>E-mail pessoal</label>
                  <input
                    type="email"
                    value={profileDraft.personalEmail}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, personalEmail: event.target.value }))}
                    placeholder="nome@gmail.com"
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
                  <label>Função/Cargo</label>
                  <input
                    type="text"
                    value={profileDraft.jobTitle}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, jobTitle: event.target.value }))}
                    placeholder={roleLabels[editingMember.role] ?? editingMember.role}
                  />
                </div>
                <div>
                  <label>Idioma</label>
                  <select
                    value={profileDraft.locale}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, locale: event.target.value }))}
                  >
                    {LOCALE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Fuso horário</label>
                  <select
                    value={profileDraft.timezone}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, timezone: event.target.value }))}
                  >
                    {TIMEZONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="team-modal-field--span-2">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={profileDraft.address}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
                <div className="team-modal-field--span-2">
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

                {canConfigureModulePermissions ? (
                  <div className="team-modal-field--span-2 team-module-matrix-wrap">
                    <div className="team-module-matrix-head">
                      <div>
                        <label>Matriz de permissões por módulo</label>
                        <p className="muted">Administre acesso detalhado de cada usuário por módulo.</p>
                      </div>
                      <button
                        type="button"
                        className="secondary-button team-module-matrix-reset"
                        onClick={resetModulePermissionsDraft}
                        disabled={!hasModulePermissionChanges}
                      >
                        Reverter matriz
                      </button>
                    </div>
                    <div className="team-module-matrix-table-wrap">
                      <table className="team-module-matrix-table">
                        <thead>
                          <tr>
                            <th>Módulo</th>
                            <th>Visualizar</th>
                            <th>Criar</th>
                            <th>Editar</th>
                            <th>Excluir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MODULE_PERMISSION_DEFINITIONS.map((moduleDefinition) => (
                            <tr key={moduleDefinition.key}>
                              <td>
                                <strong>{moduleDefinition.label}</strong>
                                <small>{moduleDefinition.description}</small>
                              </td>
                              {MODULE_PERMISSION_ACTIONS.map((action) => (
                                <td key={`${moduleDefinition.key}-${action}`}>
                                  <label className="team-module-matrix-check" aria-label={`${moduleDefinition.label} - ${action}`}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(modulePermissionsDraft[moduleDefinition.key]?.[action])}
                                      onChange={() => updateModulePermission(moduleDefinition.key, action)}
                                    />
                                  </label>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
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












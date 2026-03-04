import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { apiRequest, createAuthFixture, ensureOk } from "./helpers/api";
import { loginWithFixture } from "./helpers/ui";

type RestrictedModule = "dashboard" | "kanban" | "timeline" | "documents" | "reports";

const addMemberToOrganization = async (
  request: APIRequestContext,
  ownerToken: string,
  organizationId: string,
  email: string,
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
) => {
  return ensureOk<{ member?: { id?: string } }>(
    request,
    `/organizations/${organizationId}/members`,
    {
      method: "POST",
      token: ownerToken,
      body: { email, role }
    },
    `Add ${role} member to organization`
  );
};

const revokeModuleView = async (
  request: APIRequestContext,
  ownerToken: string,
  organizationId: string,
  memberId: string,
  moduleKey: RestrictedModule
) => {
  await ensureOk(
    request,
    `/organizations/${organizationId}/members/${memberId}`,
    {
      method: "PATCH",
      token: ownerToken,
      body: {
        modulePermissions: {
          [moduleKey]: {
            view: false,
            create: false,
            edit: false,
            delete: false
          }
        }
      }
    },
    `Revoke ${moduleKey} module permissions`
  );
};

const setupRestrictedMember = async (request: APIRequestContext, moduleKey: RestrictedModule) => {
  const restrictedUser = await createAuthFixture(request, {
    orgNamePrefix: `Org Week3 ${moduleKey} RestrictedUser`
  });
  const owner = await createAuthFixture(request, {
    orgNamePrefix: `Org Week3 ${moduleKey} Owner`,
    teamMembers: [restrictedUser.corporateEmail]
  });

  const memberResponse = await addMemberToOrganization(
    request,
    owner.token,
    owner.organizationId,
    restrictedUser.corporateEmail,
    "MEMBER"
  );
  const memberId = memberResponse.body.member?.id ?? "";
  expect(memberId).toBeTruthy();

  await revokeModuleView(request, owner.token, owner.organizationId, memberId, moduleKey);

  return { owner, restrictedUser };
};

const expectRestrictedModuleUi = async (page: Page, route: string) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: /Acesso restrito/i })).toBeVisible({ timeout: 20_000 });
};

test.describe("Semana 3 - View permissions por modulo (UI + API)", () => {
  test("Dashboard bloqueado para membro sem permissao de visualizacao", async ({ page, request }) => {
    const { owner, restrictedUser } = await setupRestrictedMember(request, "dashboard");

    await loginWithFixture(page, restrictedUser, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });
    await expectRestrictedModuleUi(page, "/dashboard");

    const summaryAttempt = await apiRequest<{ message?: string }>(request, `/projects/${owner.projectId}/summary`, {
      method: "GET",
      token: restrictedUser.token,
      organizationId: owner.organizationId
    });

    expect(summaryAttempt.status).toBe(403);
    expect(String(summaryAttempt.body?.message ?? "")).toMatch(/permiss/i);
  });

  const scenarios: Array<{
    title: string;
    moduleKey: RestrictedModule;
    route: string;
    apiPath: (projectId: string) => string;
  }> = [
    {
      title: "Kanban bloqueado para membro sem permissao de visualizacao",
      moduleKey: "kanban",
      route: "/kanban",
      apiPath: (projectId) => `/projects/${projectId}/board`
    },
    {
      title: "Cronograma bloqueado para membro sem permissao de visualizacao",
      moduleKey: "timeline",
      route: "/cronograma",
      apiPath: (projectId) => `/projects/${projectId}/gantt`
    },
    {
      title: "Documentos bloqueados para membro sem permissao de visualizacao",
      moduleKey: "documents",
      route: "/documentos",
      apiPath: (projectId) => `/projects/${projectId}/attachments`
    },
    {
      title: "Relatorios bloqueados para membro sem permissao de visualizacao",
      moduleKey: "reports",
      route: "/relatorios",
      apiPath: () => "/reports/portfolio"
    }
  ];

  for (const scenario of scenarios) {
    test(scenario.title, async ({ page, request }) => {
      const { owner, restrictedUser } = await setupRestrictedMember(request, scenario.moduleKey);

      await loginWithFixture(page, restrictedUser, {
        organizationId: owner.organizationId,
        projectId: owner.projectId
      });
      await expectRestrictedModuleUi(page, scenario.route);

      const apiAttempt = await apiRequest<{ message?: string }>(request, scenario.apiPath(owner.projectId), {
        method: "GET",
        token: restrictedUser.token,
        organizationId: owner.organizationId
      });

      expect(apiAttempt.status).toBe(403);
      expect(String(apiAttempt.body?.message ?? "")).toMatch(/permiss/i);
    });
  }
});

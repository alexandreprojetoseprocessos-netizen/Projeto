import { expect, test } from "@playwright/test";
import { apiRequest, createAuthFixture, ensureOk } from "./helpers/api";
import { loginWithFixture } from "./helpers/ui";

const addMemberToOrganization = async (
  request: Parameters<typeof ensureOk>[0],
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

const updateMemberModulePermissions = async (
  request: Parameters<typeof ensureOk>[0],
  ownerToken: string,
  organizationId: string,
  memberId: string,
  moduleKey: "eap" | "budget"
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

test.describe("Semana 2 - RBAC EAP/Orcamento (UI + API)", () => {
  test("EAP bloqueada para membro sem permissao de modulo", async ({ page, request }) => {
    const restrictedUser = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC EAP RestrictedUser"
    });
    const owner = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC EAP Owner",
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

    await updateMemberModulePermissions(request, owner.token, owner.organizationId, memberId, "eap");

    await loginWithFixture(page, restrictedUser, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });
    await page.goto(`/EAP/organizacao/${owner.organizationId}/projeto/${owner.projectId}`);

    await expect(page.getByRole("heading", { name: /Acesso restrito/i })).toBeVisible({ timeout: 20_000 });

    const createAttempt = await apiRequest<{ message?: string }>(
      request,
      `/projects/${owner.projectId}/wbs`,
      {
        method: "POST",
        token: restrictedUser.token,
        organizationId: owner.organizationId,
        body: {
          title: `RBAC EAP blocked ${Date.now()}`,
          type: "TASK",
          status: "BACKLOG",
          priority: "MEDIUM"
        }
      }
    );

    expect(createAttempt.status).toBe(403);
    expect(String(createAttempt.body?.message ?? "")).toMatch(/permiss/i);
  });

  test("Orcamento bloqueado para membro sem permissao de modulo", async ({ page, request }) => {
    const restrictedUser = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC Budget RestrictedUser"
    });
    const owner = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC Budget Owner",
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

    await updateMemberModulePermissions(request, owner.token, owner.organizationId, memberId, "budget");

    await loginWithFixture(page, restrictedUser, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });
    await page.goto("/atividades");

    await expect(page.getByRole("heading", { name: /Acesso restrito/i })).toBeVisible({ timeout: 20_000 });

    const saveAttempt = await apiRequest<{ message?: string }>(
      request,
      `/projects/${owner.projectId}/budget`,
      {
        method: "PUT",
        token: restrictedUser.token,
        organizationId: owner.organizationId,
        body: {
          projectValue: 1000,
          contingency: 10,
          notes: "rbac budget",
          items: []
        }
      }
    );

    expect(saveAttempt.status).toBe(403);
    expect(String(saveAttempt.body?.message ?? "")).toMatch(/permiss/i);
  });
});


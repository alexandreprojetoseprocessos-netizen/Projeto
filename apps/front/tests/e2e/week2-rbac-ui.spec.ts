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
  return ensureOk<{ member?: { id?: string; role?: string; user?: { id?: string; email?: string } } }>(
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

test.describe("Semana 2 - RBAC Equipes (UI + API)", () => {
  test("ADMIN nao pode convidar OWNER e UI limita papeis de convite", async ({ page, request }) => {
    const adminUser = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC AdminUser"
    });
    const owner = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC Owner",
      teamMembers: [adminUser.corporateEmail]
    });

    await addMemberToOrganization(
      request,
      owner.token,
      owner.organizationId,
      adminUser.corporateEmail,
      "ADMIN"
    );

    await loginWithFixture(page, adminUser, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });
    await page.goto("/equipe");

    await expect(page.getByRole("heading", { name: "Equipes" })).toBeVisible({ timeout: 20_000 });

    const toggleInvite = page.getByRole("button", { name: /Adicionar membro|Fechar/i }).first();
    await expect(toggleInvite).toBeVisible({ timeout: 20_000 });
    await toggleInvite.click();

    const inviteForm = page.locator("form.team-invite-form");
    await expect(inviteForm).toBeVisible({ timeout: 20_000 });

    const organizationSelect = inviteForm.locator("label").filter({ hasText: /Organiza/i }).locator("select");
    if ((await organizationSelect.count()) > 0) {
      await organizationSelect.first().selectOption(owner.organizationId);
    }

    const roleSelect = inviteForm.locator("label").filter({ hasText: /Papel/i }).locator("select").first();
    await expect(roleSelect).toBeVisible({ timeout: 20_000 });

    const roleOptions = await roleSelect
      .locator("option")
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));

    expect(roleOptions).toEqual(expect.arrayContaining(["MEMBER", "VIEWER"]));
    expect(roleOptions).not.toContain("OWNER");
    expect(roleOptions).not.toContain("ADMIN");

    const ownerInviteAttempt = await apiRequest<{ message?: string }>(
      request,
      `/organizations/${owner.organizationId}/members`,
      {
        method: "POST",
        token: adminUser.token,
        body: {
          email: `admin-owner-block.${Date.now()}@example.com`,
          role: "OWNER"
        }
      }
    );

    expect(ownerInviteAttempt.status).toBe(403);
    expect(String(ownerInviteAttempt.body?.message ?? "")).toMatch(/papel|nivel|permissao/i);
  });

  test("MEMBER nao pode convidar membros e API retorna 403", async ({ page, request }) => {
    const memberUser = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC MemberUser"
    });
    const owner = await createAuthFixture(request, {
      orgNamePrefix: "Org Week2 RBAC Owner",
      teamMembers: [memberUser.corporateEmail]
    });

    await addMemberToOrganization(
      request,
      owner.token,
      owner.organizationId,
      memberUser.corporateEmail,
      "MEMBER"
    );

    await loginWithFixture(page, memberUser, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });
    await page.goto("/equipe");

    await expect(page.getByRole("heading", { name: "Equipes" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Adicionar membro/i })).toHaveCount(0);

    const inviteAttempt = await apiRequest<{ message?: string }>(
      request,
      `/organizations/${owner.organizationId}/members`,
      {
        method: "POST",
        token: memberUser.token,
        body: {
          email: `member-invite-block.${Date.now()}@example.com`,
          role: "MEMBER"
        }
      }
    );

    expect(inviteAttempt.status).toBe(403);
    expect(String(inviteAttempt.body?.message ?? "")).toMatch(/gerenciar|convidar|permissao/i);
  });
});


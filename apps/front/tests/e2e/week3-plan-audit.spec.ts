import { expect, test } from "@playwright/test";
import { apiRequest, createAuthFixture, ensureOk } from "./helpers/api";
import { loginWithFixture } from "./helpers/ui";

test.describe("Semana 3 - Auditoria do plano", () => {
  test("filtra eventos de assinatura e exibe historico no Meu plano", async ({ page, request }) => {
    const owner = await createAuthFixture(request, {
      orgNamePrefix: "Org Week3 Plan Audit"
    });

    const budgetUpdate = await apiRequest<{ budget?: unknown; message?: string }>(request, `/projects/${owner.projectId}/budget`, {
      method: "PUT",
      token: owner.token,
      organizationId: owner.organizationId,
      body: {
        projectValue: 25000,
        contingency: 12,
        notes: "week3 audit budget",
        items: []
      }
    });

    expect(budgetUpdate.status).toBe(200);

    const planChange = await ensureOk<{ subscription?: { id?: string; product?: { code?: string | null } | null } }>(
      request,
      "/subscriptions/change-plan",
      {
        method: "POST",
        token: owner.token,
        organizationId: owner.organizationId,
        body: {
          planCode: "BUSINESS"
        }
      },
      "Change plan for audit trail"
    );

    expect(planChange.body.subscription?.product?.code).toBe("BUSINESS");

    const filteredAudit = await ensureOk<{ logs?: Array<{ entity?: string; action?: string }> }>(
      request,
      `/organizations/${owner.organizationId}/audit-logs?limit=10&entity=SUBSCRIPTION&actionPrefix=SUBSCRIPTION_`,
      {
        method: "GET",
        token: owner.token
      },
      "Load filtered subscription audit logs"
    );

    const logs = filteredAudit.body.logs ?? [];
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every((entry) => entry.entity === "SUBSCRIPTION")).toBeTruthy();
    expect(logs.every((entry) => String(entry.action ?? "").startsWith("SUBSCRIPTION_"))).toBeTruthy();
    expect(logs.some((entry) => entry.action === "SUBSCRIPTION_PLAN_CHANGED")).toBeTruthy();
    expect(logs.some((entry) => entry.action === "PROJECT_BUDGET_UPDATED")).toBeFalsy();

    await loginWithFixture(page, owner, {
      organizationId: owner.organizationId,
      projectId: owner.projectId
    });

    await page.goto("/plano");

    await expect(page.getByRole("heading", { name: /Histórico administrativo/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Plano alterado/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/ENTERPRISE/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/BUSINESS/i).first()).toBeVisible({ timeout: 20_000 });
  });
});

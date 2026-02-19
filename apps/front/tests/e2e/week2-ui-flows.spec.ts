import { expect, test } from "@playwright/test";
import { apiRequest, createAuthFixture, ensureOk, flattenNodes } from "./helpers/api";
import { loginWithFixture } from "./helpers/ui";

const localDateKey = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addLocalDays = (value: string | Date, amount: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const diffCalendarDaysLocal = (start: string | Date, end: string | Date) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const dayEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.round((dayEnd - dayStart) / (1000 * 60 * 60 * 24));
};

const resolveResponsibleMembershipId = (node: Record<string, any> | undefined | null) => {
  if (!node || typeof node !== "object") return null;
  const direct = node.responsible;
  if (direct && typeof direct === "object" && typeof direct.membershipId === "string") {
    return direct.membershipId;
  }
  const legacy = node.responsibleMembership;
  if (legacy && typeof legacy === "object" && typeof legacy.id === "string") {
    return legacy.id;
  }
  return null;
};

test.describe("Semana 2 - fluxos UI", () => {
  test("Equipes: carrega painel e permite abrir/enviar convite", async ({ page, request }) => {
    const fixture = await createAuthFixture(request);
    await loginWithFixture(page, fixture);

    await page.goto("/equipe");
    await expect(page.getByRole("heading", { name: "Equipes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Membros", exact: true })).toBeVisible();

    const toggleInvite = page.getByRole("button", { name: /Adicionar membro|Fechar/i }).first();
    await toggleInvite.click();
    await expect(page.getByRole("heading", { name: "Convide um membro" })).toBeVisible();

    const inviteForm = page.locator("form.team-invite-form");
    await inviteForm.locator("input[type='email']").fill(`convite.ui.${Date.now()}@example.com`);
    await inviteForm.getByRole("button", { name: /Enviar convite/i }).click();

    await expect(page.getByRole("heading", { name: "Convide um membro" })).toBeHidden({ timeout: 20_000 });
  });

  test("EAP: atualiza responsavel, dependencia e recarrega datas pela UI", async ({ page, request }) => {
    const fixture = await createAuthFixture(request);

    const members = await ensureOk<{ members?: Array<{ id: string; userId: string }> }>(
      request,
      `/projects/${fixture.projectId}/members`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Load project members"
    );
    const ownMember =
      members.body.members?.find((member) => member.userId === fixture.userId) ??
      members.body.members?.[0];
    expect(ownMember?.id).toBeTruthy();

    const predecessorTitle = `UI predecessora ${Date.now()}`;
    const successorTitle = `UI sucessora ${Date.now()}`;

    const predecessor = await ensureOk<{ node?: { id?: string } }>(
      request,
      `/projects/${fixture.projectId}/wbs`,
      {
        method: "POST",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          title: predecessorTitle,
          type: "TASK",
          status: "BACKLOG",
          priority: "MEDIUM",
          startDate: "2026-04-01",
          endDate: "2026-04-03"
        }
      },
      "Create predecessor node"
    );
    const successor = await ensureOk<{ node?: { id?: string } }>(
      request,
      `/projects/${fixture.projectId}/wbs`,
      {
        method: "POST",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          title: successorTitle,
          type: "TASK",
          status: "BACKLOG",
          priority: "MEDIUM",
          startDate: "2026-04-01",
          endDate: "2026-04-02"
        }
      },
      "Create successor node"
    );

    const predecessorId = predecessor.body.node?.id ?? "";
    const successorId = successor.body.node?.id ?? "";
    expect(predecessorId).toBeTruthy();
    expect(successorId).toBeTruthy();

    await loginWithFixture(page, fixture);
    await page.goto(`/EAP/organizacao/${fixture.organizationId}/projeto/${fixture.projectId}`);

    await expect(page.getByRole("button", { name: /\+ Nova tarefa/i })).toBeVisible({ timeout: 20_000 });

    const successorRow = page.locator("tr").filter({ hasText: successorTitle }).first();
    await expect(successorRow).toBeVisible({ timeout: 20_000 });

    await successorRow.locator("select.wbs-responsible-select").selectOption(ownMember?.id ?? "");

    await successorRow.locator(".dependencies-dropdown__trigger").click();
    const predecessorDependencyOption = page
      .locator(".dependencies-dropdown__item")
      .filter({ hasText: predecessorTitle })
      .first();
    await expect(predecessorDependencyOption).toBeVisible({ timeout: 20_000 });
    const predecessorCheckbox = predecessorDependencyOption.locator("input[type='checkbox']").first();
    if (!(await predecessorCheckbox.isChecked())) {
      await predecessorDependencyOption.click();
    }
    await expect(predecessorCheckbox).toBeChecked();
    await page.locator(".dependencies-dropdown__done").click();

    await page.getByRole("button", { name: /Recarregar/i }).first().click();
    await expect(page.locator(".gp-alert-success")).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(
        async () => {
          const reloaded = await ensureOk<{ nodes?: unknown[] }>(
            request,
            `/wbs?projectId=${encodeURIComponent(fixture.projectId)}`,
            { token: fixture.token, organizationId: fixture.organizationId },
            "Reload WBS after UI dependency updates"
          );
          const allNodes = flattenNodes(Array.isArray(reloaded.body.nodes) ? reloaded.body.nodes : []);
          const loadedPredecessor = allNodes.find((node) => node.id === predecessorId) as Record<string, any> | undefined;
          const loadedSuccessor = allNodes.find((node) => node.id === successorId) as Record<string, any> | undefined;
          if (!loadedPredecessor || !loadedSuccessor) return false;

          const dependencies = Array.isArray(loadedSuccessor.dependenciesAsSuccessor)
            ? loadedSuccessor.dependenciesAsSuccessor
                .map((item: any) => item?.predecessorId)
                .filter(Boolean)
            : [];
          const hasDependency = dependencies.includes(predecessorId);

          const expectedStart = loadedPredecessor.endDate
            ? localDateKey(addLocalDays(loadedPredecessor.endDate, 1))
            : null;
          const startMatches = localDateKey(loadedSuccessor.startDate) === expectedStart;
          const duration =
            loadedSuccessor.startDate && loadedSuccessor.endDate
              ? diffCalendarDaysLocal(loadedSuccessor.startDate, loadedSuccessor.endDate) + 1
              : null;
          const durationMatches = duration === 2;
          const responsibleMatches = resolveResponsibleMembershipId(loadedSuccessor) === ownMember?.id;

          return hasDependency && startMatches && durationMatches && responsibleMatches;
        },
        { timeout: 20_000, intervals: [500, 1000, 1500] }
      )
      .toBe(true);
  });

  test("Orcamento: remove item, salva e persiste apos reload", async ({ page, request }) => {
    const fixture = await createAuthFixture(request);
    const seededItemDescription = `Item UI ${Date.now()}`;

    await loginWithFixture(page, fixture);
    await page.goto("/atividades");

    await expect(page.getByRole("heading", { name: "Orcamento", exact: true })).toBeVisible({ timeout: 20_000 });

    const valueInput = page
      .locator(".budget-form label")
      .filter({ hasText: "Valor do Projeto (R$)" })
      .locator("input")
      .first();
    await valueInput.fill("123456");

    await page.getByRole("button", { name: /Adicionar Item/i }).click();
    const createdRow = page.locator(".budget-table-row").first();
    const firstRowDescriptionInput = createdRow.locator("input.budget-input").first();
    await firstRowDescriptionInput.fill(seededItemDescription);

    await createdRow.locator("button.budget-icon-button").click();

    await page.getByRole("button", { name: /Salvar agora/i }).click();
    await expect(page.locator(".budget-save-status")).toContainText(/Salvo em/i, { timeout: 20_000 });

    await page.reload();
    await expect(page.getByRole("heading", { name: "Orcamento", exact: true })).toBeVisible({ timeout: 20_000 });
    const hasSeededInputValue = await page.evaluate((targetValue) => {
      const inputs = Array.from(document.querySelectorAll(".budget-table-row input.budget-input"));
      return inputs.some((input) => (input as HTMLInputElement).value === targetValue);
    }, seededItemDescription);
    expect(hasSeededInputValue).toBe(false);

    const budget = await ensureOk<{ budget?: { projectValue?: number; items?: Array<{ id?: string; description?: string }> } }>(
      request,
      `/projects/${fixture.projectId}/budget`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Load budget after UI save"
    );

    expect(budget.body.budget).toBeTruthy();
    const hasSeededItem = (budget.body.budget?.items ?? []).some(
      (item) => item.description === seededItemDescription
    );
    expect(hasSeededItem).toBe(false);
  });
});

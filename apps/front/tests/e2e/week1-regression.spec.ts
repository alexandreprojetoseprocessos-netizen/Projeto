import { expect, test } from "@playwright/test";
import {
  apiRequest,
  createAuthFixture,
  ensureOk,
  flattenNodes,
  randomUuid
} from "./helpers/api";

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

test.describe("Semana 1 - regressao automatizada", () => {
  test("Equipes: carregamento resiliente com falhas isoladas", async ({ request }) => {
    const fixture = await createAuthFixture(request);

    const members = await apiRequest<{ members?: unknown[] }>(
      request,
      `/organizations/${fixture.organizationId}/members`,
      { token: fixture.token }
    );
    expect(members.status).toBe(200);
    expect(Array.isArray(members.body.members)).toBeTruthy();

    const validWbs = await apiRequest<{ nodes?: unknown[] }>(
      request,
      `/wbs?projectId=${encodeURIComponent(fixture.projectId)}`,
      { token: fixture.token, organizationId: fixture.organizationId }
    );
    const invalidWbs = await apiRequest(
      request,
      `/wbs?projectId=${encodeURIComponent(randomUuid())}`,
      { token: fixture.token, organizationId: fixture.organizationId }
    );

    expect(validWbs.status).toBe(200);
    expect([400, 403, 404]).toContain(invalidWbs.status);
  });

  test("EAP: atualiza responsavel, salva dependencia e recalcula datas", async ({ request }) => {
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

    const nodeA = await ensureOk<{ node?: { id?: string } }>(
      request,
      `/projects/${fixture.projectId}/wbs`,
      {
        method: "POST",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          title: "Atividade A",
          type: "TASK",
          status: "BACKLOG",
          priority: "MEDIUM",
          startDate: "2026-04-01",
          endDate: "2026-04-03"
        }
      },
      "Create predecessor node"
    );
    const nodeB = await ensureOk<{ node?: { id?: string } }>(
      request,
      `/projects/${fixture.projectId}/wbs`,
      {
        method: "POST",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          title: "Atividade B",
          type: "TASK",
          status: "BACKLOG",
          priority: "MEDIUM",
          startDate: "2026-04-01",
          endDate: "2026-04-02"
        }
      },
      "Create successor node"
    );

    const nodeAId = nodeA.body.node?.id ?? "";
    const nodeBId = nodeB.body.node?.id ?? "";
    expect(nodeAId).toBeTruthy();
    expect(nodeBId).toBeTruthy();

    await ensureOk(
      request,
      `/wbs/${nodeBId}/responsible`,
      {
        method: "PATCH",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: { membershipId: ownMember?.id ?? null }
      },
      "Update responsible"
    );

    await ensureOk(
      request,
      `/wbs/${nodeBId}`,
      {
        method: "PATCH",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: { dependencies: [nodeAId] }
      },
      "Save dependency"
    );

    const reloaded = await ensureOk<{ nodes?: unknown[] }>(
      request,
      `/wbs?projectId=${encodeURIComponent(fixture.projectId)}`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Reload WBS"
    );
    const allNodes = flattenNodes(Array.isArray(reloaded.body.nodes) ? reloaded.body.nodes : []);
    const loadedA = allNodes.find((node) => node.id === nodeAId);
    const loadedB = allNodes.find((node) => node.id === nodeBId);
    expect(loadedA).toBeTruthy();
    expect(loadedB).toBeTruthy();

    const dependencies = Array.isArray(loadedB?.dependenciesAsSuccessor)
      ? loadedB.dependenciesAsSuccessor.map((item: any) => item?.predecessorId).filter(Boolean)
      : [];
    expect(dependencies).toContain(nodeAId);

    const predecessorEnd = loadedA?.endDate as string | undefined;
    const successorStart = loadedB?.startDate as string | undefined;
    const successorEnd = loadedB?.endDate as string | undefined;
    const expectedStartLocal = predecessorEnd ? localDateKey(addLocalDays(predecessorEnd, 1)) : null;

    expect(localDateKey(successorStart)).toBe(expectedStartLocal);

    const duration = successorStart && successorEnd ? diffCalendarDaysLocal(successorStart, successorEnd) + 1 : null;
    expect(duration).toBe(2);
  });

  test("Orcamento: salva, remove itens e persiste apos recarga", async ({ request }) => {
    const fixture = await createAuthFixture(request);

    const saveWithItems = await ensureOk<{ budget?: { items?: unknown[]; projectValue?: number } }>(
      request,
      `/projects/${fixture.projectId}/budget`,
      {
        method: "PUT",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          projectValue: 150000,
          contingency: 10,
          notes: "Semana 1 - e2e",
          items: [
            { id: "wk1-e2e-1", category: "Mao de Obra", description: "Dev A", quantity: 10, unitValue: 100 },
            { id: "wk1-e2e-2", category: "Material", description: "Licenca", quantity: 1, unitValue: 500 }
          ]
        }
      },
      "Save budget with items"
    );
    expect(saveWithItems.ok).toBeTruthy();

    const load1 = await ensureOk<{ budget?: { items?: unknown[]; projectValue?: number } }>(
      request,
      `/projects/${fixture.projectId}/budget`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Load budget (step 1)"
    );
    expect(load1.body.budget?.projectValue).toBe(150000);
    expect(Array.isArray(load1.body.budget?.items)).toBeTruthy();
    expect(load1.body.budget?.items?.length).toBe(2);

    await ensureOk(
      request,
      `/projects/${fixture.projectId}/budget`,
      {
        method: "PUT",
        token: fixture.token,
        organizationId: fixture.organizationId,
        body: {
          projectValue: 0,
          contingency: 10,
          notes: "",
          items: []
        }
      },
      "Save budget without items"
    );

    const load2 = await ensureOk<{ budget?: { items?: unknown[]; projectValue?: number } }>(
      request,
      `/projects/${fixture.projectId}/budget`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Load budget (step 2)"
    );
    const load3 = await ensureOk<{ budget?: { items?: unknown[]; projectValue?: number } }>(
      request,
      `/projects/${fixture.projectId}/budget`,
      { token: fixture.token, organizationId: fixture.organizationId },
      "Load budget (step 3)"
    );

    expect(load2.body.budget?.projectValue).toBe(0);
    expect(load3.body.budget?.projectValue).toBe(0);
    expect(load2.body.budget?.items?.length ?? -1).toBe(0);
    expect(load3.body.budget?.items?.length ?? -1).toBe(0);
  });
});

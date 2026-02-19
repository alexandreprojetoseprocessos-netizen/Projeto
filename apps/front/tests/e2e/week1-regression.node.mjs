const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:4000";

const randomInt = (max) => Math.floor(Math.random() * max);
const randomId = () => `${Date.now()}${randomInt(1000)}`;

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const generateCpf = () => {
  const nums = [];
  while (nums.length < 9) nums.push(randomInt(10));
  if (nums.every((digit) => digit === nums[0])) {
    nums[0] = (nums[0] + 1) % 10;
  }

  const calcDigit = (slice, factor) => {
    let total = 0;
    for (const digit of slice) {
      total += digit * factor;
      factor -= 1;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcDigit(nums, 10);
  const d2 = calcDigit([...nums, d1], 11);
  return [...nums, d1, d2].join("");
};

const randomUuid = () => {
  const p = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${p()}${p()}-${p()}-4${p().slice(1)}-a${p().slice(1)}-${p()}${p()}${p()}`;
};

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const apiRequest = async (path, { method = "GET", token, organizationId, body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (typeof body !== "undefined") headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: typeof body !== "undefined" ? JSON.stringify(body) : undefined
  });
  const parsed = await parseBody(response);
  return {
    ok: response.ok,
    status: response.status,
    body: parsed
  };
};

const ensureOk = async (path, options = {}, label = "Request failed") => {
  const result = await apiRequest(path, options);
  if (!result.ok) {
    throw new Error(
      `${label}: ${options.method || "GET"} ${path} -> ${result.status} ${JSON.stringify(result.body)}`
    );
  }
  return result;
};

const flattenNodes = (nodes) => {
  const output = [];
  const stack = [...nodes];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    output.push(current);
    if (Array.isArray(current.children) && current.children.length) {
      stack.push(...current.children);
    }
  }
  return output;
};

const localDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addLocalDays = (value, amount) => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const diffCalendarDaysLocal = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const dayEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  return Math.round((dayEnd - dayStart) / (1000 * 60 * 60 * 24));
};

const createAuthFixture = async () => {
  const id = randomId();
  const register = await ensureOk(
    "/auth/register",
    {
      method: "POST",
      body: {
        fullName: "Week1 Node Regression",
        corporateEmail: `week1.node.${id}@example.com`,
        personalEmail: `week1.node.personal.${id}@example.com`,
        documentType: "CPF",
        documentNumber: generateCpf(),
        password: "Semana1Node123",
        startMode: "NEW_ORG",
        organizationName: `Org Week1 Node ${id}`
      }
    },
    "Register user"
  );

  const token = register.body?.session?.access_token || "";
  assert(token, "No access token returned by /auth/register");

  const me = await ensureOk("/me", { token }, "Load /me");
  const organizationId = me.body?.organizations?.[0]?.id || "";
  const userId = me.body?.user?.id || "";
  assert(organizationId && userId, `Invalid /me payload: ${JSON.stringify(me.body)}`);

  const project = await ensureOk(
    "/projects",
    {
      method: "POST",
      token,
      organizationId,
      body: {
        name: `Projeto Week1 Node ${id}`,
        clientName: "Cliente Week1 Node"
      }
    },
    "Create project"
  );
  const projectId = project.body?.project?.id || "";
  assert(projectId, `Project not created: ${JSON.stringify(project.body)}`);

  return { token, organizationId, userId, projectId };
};

const testEquipes = async () => {
  const fixture = await createAuthFixture();

  const members = await apiRequest(`/organizations/${fixture.organizationId}/members`, {
    token: fixture.token
  });
  assert(members.status === 200, `Equipes members expected 200, got ${members.status}`);
  assert(Array.isArray(members.body?.members), "Equipes members payload is not array");

  const validWbs = await apiRequest(`/wbs?projectId=${encodeURIComponent(fixture.projectId)}`, {
    token: fixture.token,
    organizationId: fixture.organizationId
  });
  const invalidWbs = await apiRequest(`/wbs?projectId=${encodeURIComponent(randomUuid())}`, {
    token: fixture.token,
    organizationId: fixture.organizationId
  });

  assert(validWbs.status === 200, `Equipes valid WBS expected 200, got ${validWbs.status}`);
  assert(
    [400, 403, 404].includes(invalidWbs.status),
    `Equipes invalid WBS expected 400/403/404, got ${invalidWbs.status}`
  );
};

const testEap = async () => {
  const fixture = await createAuthFixture();

  const members = await ensureOk(
    `/projects/${fixture.projectId}/members`,
    { token: fixture.token, organizationId: fixture.organizationId },
    "Load project members"
  );

  const ownMember =
    members.body?.members?.find((member) => member.userId === fixture.userId) ||
    members.body?.members?.[0];
  assert(ownMember?.id, "No member found in project");

  const nodeA = await ensureOk(
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

  const nodeB = await ensureOk(
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

  const nodeAId = nodeA.body?.node?.id || "";
  const nodeBId = nodeB.body?.node?.id || "";
  assert(nodeAId && nodeBId, "Failed to create WBS nodes");

  await ensureOk(
    `/wbs/${nodeBId}/responsible`,
    {
      method: "PATCH",
      token: fixture.token,
      organizationId: fixture.organizationId,
      body: { membershipId: ownMember.id }
    },
    "Update responsible"
  );

  await ensureOk(
    `/wbs/${nodeBId}`,
    {
      method: "PATCH",
      token: fixture.token,
      organizationId: fixture.organizationId,
      body: { dependencies: [nodeAId] }
    },
    "Save dependency"
  );

  const reloaded = await ensureOk(
    `/wbs?projectId=${encodeURIComponent(fixture.projectId)}`,
    { token: fixture.token, organizationId: fixture.organizationId },
    "Reload WBS"
  );

  const allNodes = flattenNodes(Array.isArray(reloaded.body?.nodes) ? reloaded.body.nodes : []);
  const loadedA = allNodes.find((node) => node.id === nodeAId);
  const loadedB = allNodes.find((node) => node.id === nodeBId);
  assert(loadedA && loadedB, "Failed to reload nodes after dependency update");

  const dependencies = Array.isArray(loadedB.dependenciesAsSuccessor)
    ? loadedB.dependenciesAsSuccessor.map((item) => item?.predecessorId).filter(Boolean)
    : [];
  assert(dependencies.includes(nodeAId), "Dependency predecessor not persisted");

  const predecessorEnd = loadedA.endDate;
  const successorStart = loadedB.startDate;
  const successorEnd = loadedB.endDate;
  const expectedStart = predecessorEnd ? localDateKey(addLocalDays(predecessorEnd, 1)) : null;
  assert(
    localDateKey(successorStart) === expectedStart,
    `Successor start mismatch. expected=${expectedStart} got=${localDateKey(successorStart)}`
  );

  const duration = successorStart && successorEnd ? diffCalendarDaysLocal(successorStart, successorEnd) + 1 : null;
  assert(duration === 2, `Successor duration mismatch. expected=2 got=${duration}`);
};

const testOrcamento = async () => {
  const fixture = await createAuthFixture();

  await ensureOk(
    `/projects/${fixture.projectId}/budget`,
    {
      method: "PUT",
      token: fixture.token,
      organizationId: fixture.organizationId,
      body: {
        projectValue: 150000,
        contingency: 10,
        notes: "Semana 1 - node regression",
        items: [
          { id: "wk1-node-1", category: "Mao de Obra", description: "Dev A", quantity: 10, unitValue: 100 },
          { id: "wk1-node-2", category: "Material", description: "Licenca", quantity: 1, unitValue: 500 }
        ]
      }
    },
    "Save budget with items"
  );

  const load1 = await ensureOk(
    `/projects/${fixture.projectId}/budget`,
    { token: fixture.token, organizationId: fixture.organizationId },
    "Load budget step 1"
  );
  assert(load1.body?.budget?.projectValue === 150000, "Budget projectValue should be 150000");
  assert((load1.body?.budget?.items || []).length === 2, "Budget items length should be 2");

  await ensureOk(
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

  const load2 = await ensureOk(
    `/projects/${fixture.projectId}/budget`,
    { token: fixture.token, organizationId: fixture.organizationId },
    "Load budget step 2"
  );
  const load3 = await ensureOk(
    `/projects/${fixture.projectId}/budget`,
    { token: fixture.token, organizationId: fixture.organizationId },
    "Load budget step 3"
  );

  assert(load2.body?.budget?.projectValue === 0, "Budget projectValue after reset should be 0 (load2)");
  assert(load3.body?.budget?.projectValue === 0, "Budget projectValue after reset should be 0 (load3)");
  assert((load2.body?.budget?.items || []).length === 0, "Budget items after reset should be 0 (load2)");
  assert((load3.body?.budget?.items || []).length === 0, "Budget items after reset should be 0 (load3)");
};

const run = async () => {
  const startedAt = new Date().toISOString();
  console.log(`[week1-regression] start ${startedAt} base=${API_BASE}`);

  try {
    await testEquipes();
    console.log("[week1-regression] OK Equipes");

    await testEap();
    console.log("[week1-regression] OK EAP");

    await testOrcamento();
    console.log("[week1-regression] OK Orcamento");

    console.log("[week1-regression] RESULT: SUCCESS");
  } catch (error) {
    console.error("[week1-regression] RESULT: FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};

run();

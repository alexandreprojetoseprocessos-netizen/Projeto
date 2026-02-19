import type { APIRequestContext, APIResponse } from "@playwright/test";

export type ApiResult<T = unknown> = {
  response: APIResponse;
  status: number;
  ok: boolean;
  body: T;
};

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  token?: string | null;
  organizationId?: string | null;
  body?: unknown;
};

const randomInt = (max: number) => Math.floor(Math.random() * max);

const randomId = () => `${Date.now()}${randomInt(1000)}`;

const generateCpf = () => {
  const nums: number[] = [];
  while (nums.length < 9) nums.push(randomInt(10));
  if (nums.every((digit) => digit === nums[0])) {
    nums[0] = (nums[0] + 1) % 10;
  }

  const calcDigit = (slice: number[], factor: number) => {
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

const parseBody = async <T>(response: APIResponse): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return { raw: text } as T;
  }
};

export const apiRequest = async <T = unknown>(
  request: APIRequestContext,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> => {
  const { method = "GET", token, organizationId, body } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (organizationId) headers["X-Organization-Id"] = organizationId;
  if (typeof body !== "undefined") headers["Content-Type"] = "application/json";

  const response = await request.fetch(path, {
    method,
    headers,
    data: typeof body !== "undefined" ? body : undefined
  });

  const parsed = await parseBody<T>(response);
  return {
    response,
    status: response.status(),
    ok: response.ok(),
    body: parsed
  };
};

export const ensureOk = async <T = unknown>(
  request: APIRequestContext,
  path: string,
  options: RequestOptions = {},
  errorLabel?: string
) => {
  const result = await apiRequest<T>(request, path, options);
  if (!result.ok) {
    throw new Error(
      `${errorLabel ?? "Request failed"}: ${options.method ?? "GET"} ${path} -> ${result.status} ${JSON.stringify(result.body)}`
    );
  }
  return result;
};

export type AuthFixture = {
  token: string;
  organizationId: string;
  userId: string;
  projectId: string;
};

export const createAuthFixture = async (request: APIRequestContext): Promise<AuthFixture> => {
  const id = randomId();
  const corporateEmail = `week1.e2e.${id}@example.com`;
  const personalEmail = `week1.e2e.personal.${id}@example.com`;
  const password = "Semana1Teste123";
  const orgName = `Org Week1 E2E ${id}`;

  const register = await ensureOk<{
    session?: { access_token?: string };
  }>(
    request,
    "/auth/register",
    {
      method: "POST",
      body: {
        fullName: "Week1 E2E",
        corporateEmail,
        personalEmail,
        documentType: "CPF",
        documentNumber: generateCpf(),
        password,
        startMode: "NEW_ORG",
        organizationName: orgName
      }
    },
    "Register user"
  );

  const token = register.body?.session?.access_token ?? "";
  if (!token) {
    throw new Error("No access token returned by /auth/register");
  }

  const me = await ensureOk<{
    user?: { id?: string };
    organizations?: Array<{ id?: string }>;
  }>(
    request,
    "/me",
    { token },
    "Load /me"
  );

  const organizationId = me.body?.organizations?.[0]?.id ?? "";
  const userId = me.body?.user?.id ?? "";
  if (!organizationId || !userId) {
    throw new Error(`Invalid /me payload: ${JSON.stringify(me.body)}`);
  }

  const project = await ensureOk<{
    project?: { id?: string };
  }>(
    request,
    "/projects",
    {
      method: "POST",
      token,
      organizationId,
      body: {
        name: `Projeto Week1 E2E ${id}`,
        clientName: "Cliente Week1 E2E"
      }
    },
    "Create project"
  );

  const projectId = project.body?.project?.id ?? "";
  if (!projectId) {
    throw new Error(`Project not created: ${JSON.stringify(project.body)}`);
  }

  return { token, organizationId, userId, projectId };
};

export const flattenNodes = (nodes: unknown[]): Array<Record<string, any>> => {
  const out: Array<Record<string, any>> = [];
  const stack = [...nodes];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    const node = current as Record<string, any>;
    out.push(node);
    if (Array.isArray(node.children) && node.children.length) {
      stack.push(...node.children);
    }
  }

  return out;
};

export const randomUuid = () => {
  const p = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${p()}${p()}-${p()}-4${p().slice(1)}-a${p().slice(1)}-${p()}${p()}${p()}`;
};

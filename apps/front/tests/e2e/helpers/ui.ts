import { expect, type Page } from "@playwright/test";
import type { AuthFixture } from "./api";

type AuthBootstrapOptions = {
  organizationId?: string;
  projectId?: string;
};

export const applyAuthBootstrapStorage = async (
  page: Page,
  fixture: AuthFixture,
  options: AuthBootstrapOptions = {}
) => {
  const organizationId = options.organizationId ?? fixture.organizationId;
  const projectId = options.projectId ?? fixture.projectId;

  await page.addInitScript(
    ({ organizationId, projectId }) => {
      window.localStorage.setItem("gp:selectedOrganizationId", organizationId);
      window.localStorage.setItem("gp:selectedProjectId", projectId);
    },
    { organizationId, projectId }
  );
};

export const loginWithFixture = async (
  page: Page,
  fixture: AuthFixture,
  options: AuthBootstrapOptions = {}
) => {
  await applyAuthBootstrapStorage(page, fixture, options);
  await page.goto("/dashboard");

  const setSessionResult = await page.evaluate(
    async ({ accessToken, refreshToken }) => {
      try {
        const module = await import("/src/lib/supabase.ts");
        const { error } = await module.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        return error ? { ok: false, message: error.message } : { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Failed to bootstrap session from test"
        };
      }
    },
    { accessToken: fixture.token, refreshToken: fixture.refreshToken }
  );

  if (!setSessionResult.ok) {
    // Fallback via UI form when direct session bootstrap fails.
    const loginForm = page.locator("form").filter({ has: page.locator("#email") }).first();
    await expect(loginForm.locator("#email")).toBeVisible({ timeout: 20_000 });
    await loginForm.locator("#email").fill(fixture.corporateEmail);
    await loginForm.locator("#password").fill(fixture.password);
    await loginForm.getByRole("button", { name: /Entrar/i }).click();
  } else {
    await page.reload();
  }

  await expect(page).toHaveURL(/\/(dashboard|projects|equipe|checkout|EAP|atividades)/i, { timeout: 25_000 });

  if (page.url().includes("/checkout")) {
    throw new Error("Usuario autenticado redirecionado para checkout. Assinatura ativa nao encontrada para o fluxo UI.");
  }

  if ((await page.locator("#email").count()) > 0) {
    throw new Error("Falha ao autenticar fixture no front (pagina de login ainda visivel).");
  }
};

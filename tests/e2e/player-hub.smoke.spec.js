const { expect, test } = require("@playwright/test");

const BAD_PAGE_TEXT = [
  "Failed to fetch",
  "Unknown action",
  "no-undef",
  "Uncaught runtime errors",
  "Compiled with problems",
];

const BAD_RUNTIME_TEXT = [
  "Failed to fetch",
  "Unknown action",
  "no-undef",
  "ReferenceError",
  "Uncaught runtime errors",
  "Compiled with problems",
];

const LOGIN_TIMEOUT_MS = 60_000;

const playerCredentials = {
  username: process.env.E2E_PLAYER_USERNAME || "",
  password: process.env.E2E_PLAYER_PASSWORD || "",
};

const captainCredentials = {
  username: process.env.E2E_CAPTAIN_USERNAME || "",
  password: process.env.E2E_CAPTAIN_PASSWORD || "",
};

const adminCredentials = {
  username: process.env.E2E_ADMIN_USERNAME || "",
  password: process.env.E2E_ADMIN_PASSWORD || "",
};

const authSkipReason =
  process.env.E2E_ENV_FILE_LOADED === "true"
    ? "Skipping auth flows because .env.e2e credentials are incomplete."
    : "Skipping auth flows because .env.e2e is missing.";

const shouldApproveRosterDraft =
  String(process.env.E2E_APPROVE_ROSTER_DRAFT || "").toLowerCase() === "true";

function addNote(testInfo, description) {
  testInfo.annotations.push({
    type: "note",
    description,
  });
}

function hasCredentials(credentials) {
  return Boolean(credentials.username && credentials.password);
}

function buildLoginDiagnostic(bodyText) {
  const lines = String(bodyText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine = lines.find((line) =>
    /login failed|sign in failed|failed to fetch|invalid|incorrect|wrong|denied|unknown action|could not|error/i.test(
      line
    )
  );

  return errorLine || lines.slice(0, 18).join(" | ") || "No visible page text.";
}

async function getLoginDiagnostic(page) {
  const bodyText = await page
    .locator("body")
    .innerText({ timeout: 2_000 })
    .catch(() => "");
  return buildLoginDiagnostic(bodyText);
}

function collectRuntimeErrors(page) {
  const messages = [];
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  return messages;
}

async function expectHealthyPage(page, runtimeErrors = []) {
  const bodyText = await page.locator("body").innerText();
  for (const text of BAD_PAGE_TEXT) {
    expect(bodyText).not.toContain(text);
  }
  expect(bodyText).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

  const relevantRuntimeErrors = runtimeErrors.filter((message) =>
    BAD_RUNTIME_TEXT.some((text) => String(message).includes(text))
  );
  expect(relevantRuntimeErrors).toEqual([]);
}

async function resetApp(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function login(page, credentials, options = {}) {
  const { expectPlayerHub = true } = options;
  await resetApp(page);
  await expect(page.getByText("Make Teams Pro").first()).toBeVisible();

  await page.locator('input[autocomplete="username"]').fill(credentials.username);
  await page
    .locator('input[autocomplete="current-password"]')
    .fill(credentials.password);

  const loginForm = page.locator("form").filter({
    has: page.locator('input[autocomplete="current-password"]'),
  });
  await loginForm.locator('button[type="submit"]').click();

  const loggingInButton = page.getByRole("button", {
    name: "Logging in...",
    exact: true,
  });
  await loggingInButton
    .waitFor({ state: "hidden", timeout: LOGIN_TIMEOUT_MS })
    .catch(async () => {
      const diagnostic = await getLoginDiagnostic(page);
      throw new Error(
        `Login did not finish within ${
          LOGIN_TIMEOUT_MS / 1000
        }s; still waiting on "Logging in...". ${diagnostic}`
      );
    });

  const moduleNavigation = page.locator('[data-testid^="module-tab-"]');
  await expect(moduleNavigation.first())
    .toBeVisible({ timeout: 15_000 })
    .catch(async () => {
      const diagnostic = await getLoginDiagnostic(page);
      throw new Error(
        `Login finished but module navigation did not appear. ${diagnostic}`
      );
    });

  if (expectPlayerHub) {
    await expect(page.getByTestId("module-tab-player-hub"))
      .toBeVisible({ timeout: 15_000 })
      .catch(async () => {
        const diagnostic = await getLoginDiagnostic(page);
        throw new Error(
          `Login finished but Player Hub module tab was not visible. ${diagnostic}`
        );
      });
  }
}

async function openPlayerHub(page) {
  const tab = page.getByTestId("module-tab-player-hub");
  if (await tab.isVisible()) await tab.click();
  await expect(page.getByTestId("player-hub-root")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("player-hub-tab-home")).toBeVisible();
}

async function openAdminConsole(page) {
  const tab = page.getByTestId("module-tab-admin-console");
  await expect(tab).toBeVisible({ timeout: 15_000 });
  await tab.click();
  await expect(page.getByTestId("player-hub-root")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Admin Console").first()).toBeVisible();
}

async function visibleLocator(locator) {
  return (await locator.count()) > 0 && (await locator.first().isVisible().catch(() => false));
}

async function expectActionDrawer(page, openName, closeName, expectedText, scope = page) {
  await scope.getByRole("button", { name: openName, exact: true }).click();
  await expect(page.getByText(expectedText).first()).toBeVisible({
    timeout: 10_000,
  });
  await scope.getByRole("button", { name: closeName, exact: true }).click();
  await expect(page.getByText(expectedText).first()).not.toBeVisible();
}

async function expectTeamsLookingForPlayersIsPublicOnly(page, testInfo) {
  const section = page.locator("section").filter({
    has: page.getByText(/^(Player ads|Teams looking for players)$/),
  });

  if (!(await visibleLocator(section))) {
    addNote(
      testInfo,
      "Player ads section was hidden because there were no published player ads."
    );
    return;
  }

  const sectionText = await section.first().innerText();
  expect(sectionText).not.toMatch(/\bInternal\b/i);
  expect(sectionText).not.toContain("Internal only");
}

async function openRosterReviewIfPresent(page, testInfo) {
  const adminDashboard = page.locator("section").filter({
    has: page.getByText("Admin dashboard", { exact: true }),
  });
  await expect(adminDashboard.first()).toBeVisible({ timeout: 20_000 });

  const rosterTile = adminDashboard
    .first()
    .locator("article")
    .filter({ hasText: "Rosters" })
    .first();

  if (!(await visibleLocator(rosterTile))) {
    addNote(testInfo, "Roster review tile was not available for this admin user.");
    return null;
  }

  await rosterTile.getByRole("button", { name: /Open|Close/ }).click();
  const rosterReview = page.locator("details").filter({
    has: page.locator("summary").filter({ hasText: "Roster review" }),
  });
  await expect(rosterReview.first()).toBeVisible({ timeout: 20_000 });
  await rosterReview
    .first()
    .getByRole("button", { name: "Loading..." })
    .waitFor({ state: "hidden", timeout: 20_000 })
    .catch(() => {});
  return rosterReview.first();
}

test("app loads without React overlay", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByText("Make Teams Pro").first()).toBeVisible();
  await expectHealthyPage(page, runtimeErrors);
});

test("normal player can open Player Hub dashboard safely", async ({
  page,
}, testInfo) => {
  test.skip(!hasCredentials(playerCredentials), authSkipReason);

  const runtimeErrors = collectRuntimeErrors(page);
  await login(page, playerCredentials);
  await openPlayerHub(page);

  await expect(
    page.getByRole("button", { name: /^(Edit profile|Save profile)$/ }).first()
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Account & access", { exact: true }).first()).toBeVisible();

  const hasEventSurface = await visibleLocator(
    page.getByText(/Can you play\?|Team events|Going|Maybe|Pending|Official roster/)
  );
  if (!hasEventSurface) {
    addNote(
      testInfo,
      "No active team event or roster card was visible for this player account."
    );
  }

  await expectTeamsLookingForPlayersIsPublicOnly(page, testInfo);
  await expectHealthyPage(page, runtimeErrors);
});

test("captain can open Team Control action drawers", async ({
  page,
}, testInfo) => {
  test.skip(!hasCredentials(captainCredentials), authSkipReason);

  const runtimeErrors = collectRuntimeErrors(page);
  await login(page, captainCredentials);
  await openPlayerHub(page);
  const teamTab = page.getByTestId("player-hub-tab-team");
  await expect(teamTab).toBeVisible({ timeout: 20_000 });
  await teamTab.click();

  const teamControl = page.getByTestId("team-control");
  const hasTeamControl = await teamControl
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasTeamControl) {
    addNote(
      testInfo,
      "Team tab opened, but the configured captain user does not currently have Team Control access."
    );
    await expectHealthyPage(page, runtimeErrors);
    return;
  }

  await expect(teamControl).toBeVisible();
  await expect(page.getByText(/Team control/i).first()).toBeVisible();
  await expect(page.getByTestId("team-open-needs")).toBeVisible();
  await expect(page.getByTestId("tournament-plans")).toBeVisible();

  await expectActionDrawer(
    page,
    "Add internal need",
    "Close need",
    "Internal only",
    teamControl
  );
  await expectActionDrawer(
    page,
    "Publish player ad",
    "Close ad",
    "Select tournament",
    teamControl
  );
  await expectActionDrawer(
    page,
    "Ask availability",
    "Close plan",
    "Ask confirmed members",
    teamControl
  );

  const hasPlanAction = await visibleLocator(
    page.getByRole("button", { name: /Plan teams|Refresh teams/ })
  );
  if (!hasPlanAction) {
    addNote(
      testInfo,
      "No existing tournament event was available for optional Plan teams checks."
    );
  } else {
    await expect(page.getByRole("button", { name: /Responses|Plan teams|Refresh teams/ }).first()).toBeVisible();
  }

  await expectHealthyPage(page, runtimeErrors);
});

test("admin can review submitted roster drafts", async ({ page }, testInfo) => {
  test.skip(!hasCredentials(adminCredentials), authSkipReason);

  const runtimeErrors = collectRuntimeErrors(page);
  await login(page, adminCredentials, { expectPlayerHub: false });
  await openAdminConsole(page);

  await expect(page.getByText("Admin dashboard").first()).toBeVisible({
    timeout: 20_000,
  });

  const rosterReviewPanel = await openRosterReviewIfPresent(page, testInfo);
  if (!rosterReviewPanel) {
    await expectHealthyPage(page, runtimeErrors);
    return;
  }
  const submittedDraft = rosterReviewPanel.getByText("Submitted").first();
  if (!(await submittedDraft.isVisible().catch(() => false))) {
    addNote(
      testInfo,
      "Roster review opened, but no submitted draft was visible to review."
    );
    await expectHealthyPage(page, runtimeErrors);
    return;
  }

  await expect(submittedDraft).toBeVisible();

  if (shouldApproveRosterDraft) {
    const approveButton = rosterReviewPanel
      .getByRole("button", { name: "Approve" })
      .first();
    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
      await expect(rosterReviewPanel).toContainText(/Approved|Roster draft approved/i, {
        timeout: 20_000,
      });
    } else {
      addNote(
        testInfo,
        "E2E_APPROVE_ROSTER_DRAFT=true, but no Approve button was visible."
      );
    }
  }

  await expectHealthyPage(page, runtimeErrors);
});

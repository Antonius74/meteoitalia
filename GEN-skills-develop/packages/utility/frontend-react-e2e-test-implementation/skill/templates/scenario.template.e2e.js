const { test, expect } = require('@playwright/test');
const { e2eInputData } = require('../config/e2e.input.data');
const { normalizeBankKey, resolveBankRuntime } = require('../config/runtime/banks');
const {
  assertNoRuntimeErrorBoundary,
  dismissCookieBannerIfPresent,
  expectUrlPath,
  waitForOptionalFlowLoader,
} = require('../helpers/pageRuntime');

const bankKey = normalizeBankKey(process.env.E2E_BANK || 'mps');
const runtimeProfile = resolveBankRuntime(process.env.E2E_BANK || 'mps', {
  origin: process.env.E2E_ORIGIN || 'http://localhost:3000',
});
const flowData = e2eInputData.flows?.replaceWithFlowKey?.[bankKey] || e2eInputData.flows?.replaceWithFlowKey?.mps || {};
const enforceBrowserErrorAssertions = process.env.E2E_ASSERT_BROWSER_ERRORS === 'true';

const ignoredBrowserErrorPatterns = [
  /CORS policy/i,
  /Failed to load resource/i,
  /Missing data/i,
  /Errore nel caricamento delle lingue/i,
  /Direction null is not valid/i,
  /MissingTranslationError/i,
  /\b401\b/i,
];

// Runtime paths/selectors must stay in scenario code (not in input files).
const scenarioRuntime = Object.freeze({
  // Use basename-aware navigation paths for page.goto(...).
  // Never pass root-relative paths such as '/login' to page.goto when basename can be present.
  navigationLoginPath: `${runtimeProfile.basename || ''}/login` || '/login',
  // Keep assertion paths basename-agnostic.
  loginPath: '/login',
  // Add flow-specific runtime paths here (relative suffix only, no forced basename).
  targetPath: '/REPLACE_ME',
});

function getDatasets() {
  return flowData?.datasets || {};
}

function isPlaceholder(value) {
  return !value || /^SET_/i.test(String(value).trim());
}

function getMissingDatasetFields(dataset, requiredFields = []) {
  if (!dataset || typeof dataset !== 'object') {
    return requiredFields;
  }

  return requiredFields.filter((fieldName) => isPlaceholder(dataset[fieldName]));
}

function datasetSkipMessage(datasetKey, missingFields) {
  return [
    `Missing dataset "${datasetKey}".`,
    `Configure tests/e2e/config/e2e.input.local.json -> flows.replaceWithFlowKey.${bankKey}.datasets.${datasetKey}.`,
    `Missing fields: ${missingFields.join(', ')}`,
  ].join(' ');
}

function currentPathForError(page) {
  try {
    return new URL(String(page.url() || '')).pathname || String(page.url() || '');
  } catch (error) {
    return String(page.url() || '');
  }
}

function installBrowserErrorCollector(page) {
  const errors = [];

  if (!enforceBrowserErrorAssertions) {
    return errors;
  }

  const shouldIgnoreError = (rawMessage) =>
    ignoredBrowserErrorPatterns.some((pattern) => pattern.test(String(rawMessage || '')));

  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }

    const text = message.text();
    if (!shouldIgnoreError(text)) {
      errors.push(`[console] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    const text = error?.message || String(error);
    if (!shouldIgnoreError(text)) {
      errors.push(`[pageerror] ${text}`);
    }
  });

  return errors;
}

async function expectNoBrowserErrors(errors) {
  if (!enforceBrowserErrorAssertions) {
    return;
  }

  const normalizedErrors = Array.isArray(errors) ? errors : [];
  if (normalizedErrors.length > 0) {
    throw new Error(
      ['Unexpected browser errors (strict mode E2E_ASSERT_BROWSER_ERRORS=true):', ...normalizedErrors].join('\n')
    );
  }

  await expect(normalizedErrors).toEqual([]);
}

async function gotoPathWithRetries(page, relativePath, maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await page.goto(relativePath, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await waitForOptionalFlowLoader(page);
      await dismissCookieBannerIfPresent(page);
      await assertNoRuntimeErrorBoundary(page);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.waitForTimeout(700);
      }
    }
  }

  throw lastError;
}

// Resolve only the intended control; never click generic button fallbacks.
async function resolveStrictControl(locators, controlLabel, timeout = 15000, page = null) {
  await expect
    .poll(
      async () => {
        for (const locator of locators) {
          const count = await locator.count().catch(() => 0);
          if (!count) {
            continue;
          }
          if (await locator.first().isVisible().catch(() => false)) {
            return true;
          }
        }
        return false;
      },
      {
        timeout,
        message: `Unable to resolve visible control "${controlLabel}" within ${timeout}ms${page ? ` at path "${currentPathForError(page)}"` : ''}.`,
      }
    )
    .toBeTruthy();

  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    if (!count) {
      continue;
    }
    const first = locator.first();
    if (await first.isVisible().catch(() => false)) {
      await expect(first).toBeEnabled({ timeout });
      return first;
    }
  }

  throw new Error(
    `Control "${controlLabel}" is missing or not actionable${page ? ` at path "${currentPathForError(page)}"` : ''}.`
  );
}

// Resolve a critical container (header/modal/stepper shell) with multi-candidate visibility checks.
async function resolveVisibleContainer(locators, containerLabel, timeout = 15000, page = null) {
  await expect
    .poll(
      async () => {
        for (const locator of locators) {
          const count = await locator.count().catch(() => 0);
          if (!count) {
            continue;
          }
          if (await locator.first().isVisible().catch(() => false)) {
            return true;
          }
        }
        return false;
      },
      {
        timeout,
        message: `Unable to resolve visible container "${containerLabel}" within ${timeout}ms${page ? ` at path "${currentPathForError(page)}"` : ''}.`,
      }
    )
    .toBeTruthy();

  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    if (!count) {
      continue;
    }
    const first = locator.first();
    if (await first.isVisible().catch(() => false)) {
      return first;
    }
  }

  throw new Error(
    `Container "${containerLabel}" is not visible${page ? ` at path "${currentPathForError(page)}"` : ''}.`
  );
}

// Visibility-safe variant assertion:
// use this when the same expected feedback can be rendered with different UI components.
async function expectAnyVisible(locators, timeout = 15000) {
  await expect
    .poll(
      async () => {
        for (const locator of locators) {
          if (await locator.isVisible().catch(() => false)) {
            return true;
          }
        }
        return false;
      },
      {
        timeout,
        message: `None of the expected variant locators became visible within ${timeout}ms.`,
      }
    )
    .toBeTruthy();
}

test.describe('@e2e REPLACE_WITH_FLOW_TAG', () => {
  const runtime = scenarioRuntime;
  const datasets = getDatasets();
  const browserErrorsByTestId = new Map();

  test.beforeEach(async ({ page }, testInfo) => {
    browserErrorsByTestId.set(testInfo.testId, installBrowserErrorCollector(page));
  });

  test.afterEach(async ({}, testInfo) => {
    const errors = browserErrorsByTestId.get(testInfo.testId) || [];
    browserErrorsByTestId.delete(testInfo.testId);
    await expectNoBrowserErrors(errors);
  });

  test('[TC-E2E-XXX] Replace with concrete case', async ({ page }) => {
    const datasetKey = 'validCase';
    const dataset = datasets[datasetKey];
    const missingFields = getMissingDatasetFields(dataset, ['exampleField']);
    test.skip(missingFields.length > 0, datasetSkipMessage(datasetKey, missingFields));

    await gotoPathWithRetries(page, runtime.navigationLoginPath);
    // For critical containers, resolve by multi-candidate strategy, for example:
    // const header = await resolveVisibleContainer(
    //   [page.locator('header.flowHeader'), page.locator('#flowHeader'), page.getByRole('banner')],
    //   'flow header',
    //   15000,
    //   page
    // );
    // Add real interaction flow based on code-level selectors.
    // Strict pattern:
    // 1) assert intended control exists
    // 2) click only intended control
    // 3) assert expected outcome
    // 4) assert anti-outcome when relevant
    // Never use generic fallbacks like locator('button').first()/last().
    // Never use mixed locator unions with `.first()` for visibility checks.
    // Add explicit diagnostics for critical assertions (contract + current path + intent).
    // For variant feedback (toast/alert/modal), use expectAnyVisible([...]).
    // Use data from dataset when needed, for example: dataset.exampleField
    await expectUrlPath(page, runtime.targetPath, { timeout: 30000 });
  });

  test('[TC-E2E-YYY] Replace with blocked_by_data conditional case', async ({ page }) => {
    const datasetKey = 'blockedByDataCase';
    const dataset = datasets[datasetKey];
    const missingFields = getMissingDatasetFields(dataset, ['pan', 'cv2']);

    // blocked_by_data MUST stay conditional:
    // run when data is available, skip only when required fields are unresolved.
    test.skip(missingFields.length > 0, datasetSkipMessage(datasetKey, missingFields));

    await gotoPathWithRetries(page, runtime.navigationLoginPath);
    await expectUrlPath(page, runtime.targetPath, { timeout: 30000 });
  });

  test.skip('[TC-E2E-ZZZ] blocked_by_others_info example', async () => {
    // Use unconditional skip only for blocked_by_others_info (not blocked_by_data):
    // example reason: missing external analytics schema/contract required to assert this case.
  });
});
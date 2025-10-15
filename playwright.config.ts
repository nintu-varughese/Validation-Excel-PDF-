import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

/* Reporter configuration */
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  [
    'allure-playwright',
    {
      outputFolder: 'allure-results',
      detail: false,
      suiteTitle: false,
      useCucumberStepReporter: false,
      useStepsForHooks: false,
      screenshots: 'on',
      videos: 'on',
    },
  ],
],

  /* Shared settings for all projects */
  use: {
    //headless: false,             // run in headless mode
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    contextOptions: { acceptDownloads: true },
    headless:false,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

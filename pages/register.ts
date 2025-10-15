import { Page, Locator } from '@playwright/test';
import BasePage from './basepage';

/**
 * Page Object for Screener registration and YOPmail email verification.
 */
export default class RegisterPage extends BasePage {
  private readonly yopmailPage: Page;
  private readonly getFreeAccountBtn: Locator;
  private readonly emailInput: Locator;
  private readonly confirmEmailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitBtn: Locator;
  private readonly postRegisterText: Locator;
  private readonly yopmailLoginInput: Locator;

  /**
   * @param {Page} page - Playwright Page object for Screener site.
   * @param {Page} yopmailPage - Playwright Page object for YOPmail inbox.
   */
  constructor(page: Page, yopmailPage: Page) {
    super(page); // inherit BasePage functionality
    this.yopmailPage = yopmailPage;
    this.getFreeAccountBtn = page.locator('//a[text()="Get free account"]');
    this.emailInput = page.locator('//input[@name="email"]');
    this.confirmEmailInput = page.locator('//input[@name="email2"]');
    this.passwordInput = page.locator('//input[@name="password"]');
    this.submitBtn = page.locator('//button[@type="submit"]');
    this.postRegisterText = page.locator('//p[text()="Add companies to watchlist"]');
    this.yopmailLoginInput = yopmailPage.locator('#login');
  }

  /**
   * Registers a new user on Screener, then checks for the confirmation email in YOPmail.
   * @returns {Promise<{ found: boolean; content?: string }>} Returns an object with `found` indicating whether the email was received and `content` containing the email body text if found.
   */
  async registerAndCheckEmail(): Promise<{ found: boolean; content?: string }> {
    const randomEmail = `testuser_${Date.now()}@yopmail.com`;
    const password = 'StrongPass123!';
    const inboxName = randomEmail.split('@')[0];

    // Navigate to Screener registration
    await this.page.goto('https://www.screener.in/home/');
    await this.getFreeAccountBtn.click();
    await this.emailInput.fill(randomEmail);
    await this.confirmEmailInput.fill(randomEmail);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
    await this.postRegisterText.waitFor({ timeout: 15000 });

    // Go to YOPmail and check inbox
    await this.yopmailPage.goto('https://yopmail.com/en/');
    await this.yopmailLoginInput.fill(inboxName);
    await this.yopmailPage.keyboard.press('Enter');
    await this.yopmailPage.waitForLoadState('domcontentloaded');

    let foundEmail = false;
    let emailContent = '';

    // Poll inbox for email
    for (let attempt = 0; attempt < 8; attempt++) {
      const inboxFrame = this.yopmailPage.frameLocator('#ifinbox');
      const mailItem = inboxFrame.locator('div.m:has-text("Screener")');

      if (await mailItem.count() > 0) {
        foundEmail = true;
        await mailItem.first().click();
        await this.yopmailPage.waitForTimeout(2000);

        const mailBodyFrame = this.yopmailPage.frameLocator('#ifmail');
        emailContent = await mailBodyFrame.locator('body').innerText();
        console.log('Screener verification email received.');
        break;
      }

      // Refresh inbox
      const refreshSelectors = ['button.refresh', '#refresh', 'i.fa.fa-refresh'];
      let refreshed = false;

      for (const sel of refreshSelectors) {
        const element = this.yopmailPage.locator(sel);
        if (await element.count() > 0) {
          await element.first().click({ timeout: 2000 });
          refreshed = true;
          break;
        }
      }

      if (!refreshed) {
        await this.yopmailPage.goto(`https://yopmail.com/en/?${inboxName}`);
      }

      await this.yopmailPage.waitForTimeout(4000);
    }

    return { found: foundEmail, content: emailContent };
  }
}

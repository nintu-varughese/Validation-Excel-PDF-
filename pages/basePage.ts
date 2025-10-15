import { Page } from '@playwright/test';

export default class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a URL and wait for DOM content loaded.
   * @param url URL to navigate
   */
  async goTo(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for a selector to be visible
   * @param selector CSS or XPath selector
   * @param timeout optional timeout in ms
   */
  async waitForVisible(selector: string, timeout = 5000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /**
   * Get text content from a selector
   * @param selector CSS or XPath selector
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).innerText();
  }

  /**
   * Generic click helper
   * @param selector CSS or XPath selector
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field
   * @param selector CSS or XPath selector
   * @param value text to fill
   */
  async fill(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }
}

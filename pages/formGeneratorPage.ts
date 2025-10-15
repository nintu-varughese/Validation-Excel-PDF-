import { Page, Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PDFParse } from "pdf-parse";
import * as XLSX from 'xlsx';

export default class FormGeneratorPage {
  readonly page: Page;
  readonly formLink: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly fourthTextInput: Locator;
  readonly femaleRadio: Locator;
  readonly experienceSelect: Locator;
  readonly readingCheckbox: Locator;
  readonly jsCheckbox: Locator;
  readonly termsCheckbox: Locator;
  readonly commentsTextarea: Locator;
  readonly itemNameInput: Locator;
  readonly priceInput: Locator;
  readonly addItemButton: Locator;
  readonly downloadButton: Locator;
  readonly excelButton: Locator;
  readonly projectDir: string;

  constructor(page: Page) {
    this.page = page;
    this.projectDir = path.resolve(__dirname, '..');

    this.formLink = page.locator('//a[@href="/components/form-generator"]');
    this.nameInput = page.locator('//label[text()="Name"]/following-sibling::input');
    this.emailInput = page.locator('//input[@type="email"]');
    this.phoneInput = page.locator('//input[@type="tel"]');
    this.fourthTextInput = page.locator('(//input[@type="text"])[4]');
    this.femaleRadio = page.locator('//input[@value="Female"]');
    this.experienceSelect = page.locator('select.w-full');
    this.readingCheckbox = page.locator('//label[text()="Reading"]');
    this.jsCheckbox = page.locator('//label[text()="JavaScript"]');
    this.termsCheckbox = page.locator('//label[text()="I agree to the terms and conditions"]');
    this.commentsTextarea = page.locator('//textarea[@placeholder="Any additional comments..."]');
    this.itemNameInput = page.locator('//input[@placeholder="Item name"]');
    this.priceInput = page.locator('//input[@placeholder="Price"]');
    this.addItemButton = page.locator('//button[text()="Add Item"]');
    this.downloadButton = page.locator('//a[@download="generated_form.pdf"]');
    this.excelButton = page.locator('//button[text()="📊 Export to Excel"]'); // <-- Excel locator inside constructor
  }

  /**
   * Navigate to the Form Generator page.
   */
  async navigateToForm(): Promise<void> {
    await this.page.goto('https://www.playground.testingmavens.tools/components');
    await this.formLink.click();
  }

  /**
   * Fill basic user information fields.
   * @param name - Name of the user
   * @param email - Email of the user
   * @param phone - Phone number of the user
   * @param text - Any additional text input
   */
  async fillBasicInfo(name: string, email: string, phone: string, text: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.phoneInput.click();
    await this.fourthTextInput.fill(text);
  }

  /**
   * Select the "Female" gender radio button.
   */
  async selectGender(): Promise<void> {
    await this.femaleRadio.click();
  }

  /**
   * Select hobbies checkboxes: Reading and JavaScript.
   */
  async selectHobbies(): Promise<void> {
    await this.readingCheckbox.click();
    await this.jsCheckbox.click();
  }

  /**
   * Agree to terms and conditions by clicking the checkbox.
   */
  async agreeTerms(): Promise<void> {
    await this.termsCheckbox.click();
  }

  /**
   * Fill the comments textarea.
   * @param comment - Comment text to add
   */
  async addComments(comment: string): Promise<void> {
    await this.commentsTextarea.fill(comment);
  }

  /**
   * Add an item with its price.
   * @param itemName - Name of the item
   * @param price - Price of the item
   */
  async addItem(itemName: string, price: string): Promise<void> {
    await this.itemNameInput.fill(itemName);
    await this.priceInput.fill(price);
    await this.addItemButton.click();
  }

  /**
   * Download the filled form as a PDF.
   * @returns Full path to the downloaded PDF file
   */
  async downloadPDF(): Promise<string> {
    const downloadFolder = path.join(this.projectDir, 'DownloadedFiles');
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    const pdfPath = path.join(downloadFolder, 'generated_form.pdf');

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadButton.click(),
    ]);

    await download.saveAs(pdfPath);
    return pdfPath;
  }

  /**
   * Read PDF content as text using PDFParse class.
   * @param pdfPath - Full path to the PDF file
   * @returns Normalized text content from the PDF
   */
  async readPDF(pdfPath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Use the class-style constructor
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    await parser.destroy();

    return result.text.replace(/\s+/g, ' ').trim(); // normalize spaces
  }

  /**
   * Fill the entire form, add an item, and download the PDF.
   * @param formData - Object containing user input fields
   * @param itemData - Object containing item name and price
   * @returns Full path to the downloaded PDF file
   */
  async fillFormAndDownloadPDF(
    formData: { name: string; email: string; phone: string; text: string; comment: string },
    itemData: { itemName: string; price: string }
  ): Promise<string> {
    await this.navigateToForm();
    await this.fillBasicInfo(formData.name, formData.email, formData.phone, formData.text);
    await this.selectGender();
    await this.selectHobbies();
    await this.agreeTerms();
    await this.addComments(formData.comment);
    await this.addItem(itemData.itemName, itemData.price);

    return await this.downloadPDF();
  }
   async downloadExcel(downloadFolder: string): Promise<string> {
    const excelPath = path.join(downloadFolder, 'generated_form.xlsx');

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.excelButton.click(), // use locator from constructor
    ]);

    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });
    await download.saveAs(excelPath);
    return excelPath;
  }

  async readExcel(excelPath: string): Promise<any[][]> {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }
}



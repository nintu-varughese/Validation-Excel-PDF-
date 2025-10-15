import { Page, Locator } from '@playwright/test';
import BasePage from './basepage';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';

export default class DynamicTableExportPage extends BasePage {
  private readonly nameInput: Locator;
  private readonly categoryInput: Locator;
  private readonly priceInput: Locator;
  private readonly stockInput: Locator;
  private readonly addRowButton: Locator;
  private readonly exportToExcelButton: Locator;
  private readonly dynamicTableLink: Locator;
  private readonly tableRows: Locator;
  private readonly tableHeaders: Locator;

  constructor(page: Page) {
    super(page);
    this.dynamicTableLink = page.locator('//a[@href="/components/dynamic-table-export"]');
    this.nameInput = page.locator('//input[@placeholder="Name"]');
    this.categoryInput = page.locator('//input[@placeholder="Category"]');
    this.priceInput = page.locator('//input[@placeholder="Price"]');
    this.stockInput = page.locator('//input[@placeholder="Stock"]');
    this.addRowButton = page.locator('//button[text()="➕ Add Row"]');
    this.exportToExcelButton = page.locator('//button[text()="📊 Export to Excel"]');
    this.tableHeaders = page.locator('//table//thead/tr/th');
    this.tableRows = page.locator('//table//tbody/tr');
  }

  /**
   * Navigate to the Dynamic Table Export page.
   */
  async navigate(): Promise<void> {
    await this.goTo('https://www.playground.testingmavens.tools/components');
    await this.dynamicTableLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Add a new row to the dynamic table.
   * @param name - Name of the item
   * @param category - Category of the item
   * @param price - Price of the item
   * @param stock - Stock quantity of the item
   */
  async addRow(name: string, category: string, price: string, stock: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.categoryInput.fill(category);
    await this.priceInput.fill(price);
    await this.stockInput.fill(stock);
    await this.addRowButton.click();
  }

  /**
   * Export the dynamic table to an Excel file.
   * @param saveDir - Directory path where the Excel file should be saved
   * @returns Full path to the downloaded Excel file
   */
  async exportToExcel(saveDir: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportToExcelButton.click(),
    ]);

    const downloadFolder = path.join(saveDir, 'DownloadedFiles');
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    const filePath = path.join(downloadFolder, 'exported_table.xlsx');
    await download.saveAs(filePath);
    return filePath;
  }

  /**
   * Download the dynamic table as a PDF file.
   * @returns Full path to the downloaded PDF file
   */
  async downloadPDF(): Promise<string> {
    const pdfLink = this.page.locator('//a[@download="dynamic_table_data.pdf"]');

    const downloadFolder = path.join(path.resolve(__dirname, '..'), 'DownloadedFiles');
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    const pdfPath = path.join(downloadFolder, 'dynamic_table_data.pdf');

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      pdfLink.click(),
    ]);

    await download.saveAs(pdfPath);
    return pdfPath;
  }

  /**
   * Save the current table data (headers and rows) to a JSON file.
   * @returns Full path to the JSON file
   */
  async saveTableDataToJSON(): Promise<string> {
    const headers = await this.tableHeaders.allTextContents();
    const rows = await this.tableRows.evaluateAll((trs) =>
      trs.map((tr) =>
        Array.from(tr.querySelectorAll('td'))
          .map((td, idx) => {
            let val = td.textContent?.trim() || '';
            if (idx === 3 && val.startsWith('$')) val = val.replace('$', '');
            return val;
          })
          .slice(0, 5)
      )
    );

    const tableData = { headers: headers.slice(0, 5), rows };

    const extractFolder = path.join(path.resolve(__dirname, '..'), 'ExtractedJson');
    if (!fs.existsSync(extractFolder)) fs.mkdirSync(extractFolder, { recursive: true });

    const jsonFilePath = path.join(extractFolder, 'dynamicTableData.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(tableData, null, 2), 'utf-8');
    return jsonFilePath;
  }

  /**
   * Read an Excel file and return its content as a 2D array.
   * @param excelPath - Full path to the Excel file
   * @returns Array of rows, each row is an array of cell values
   */
  async readExcel(excelPath: string): Promise<any[][]> {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }

  /**
   * Read PDF content as plain text.
   * @param pdfPath - Full path to the PDF file
   * @returns Normalized text content of the PDF
   */
  async readPDF(pdfPath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.replace(/\s+/g, ' ').trim();
  }
}

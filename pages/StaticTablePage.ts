import { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { PDFParse } from "pdf-parse";
import BasePage from "./basepage";

/**
 * Page Object for interacting with the Static Table Export component.
 * Supports Excel and PDF export, reading, and saving table data.
 */
export default class StaticTablePage extends BasePage {
  private readonly componentsLink: string;
  private readonly excelExportBtn: string;
  private readonly pdfExportLink: string;
  private readonly tableRows: string;
  private readonly tableHeaders: string;
  private readonly projectDir: string;

  constructor(page: Page) {
    super(page);
    this.projectDir = path.resolve(__dirname, "..");

    this.componentsLink = '//a[@href="/components/static-table-export"]';
    this.excelExportBtn = '//button[text()="📊 Export to Excel"]';
    this.pdfExportLink = '//a[text()="📋 Export to PDF"]';
    this.tableRows = '//div[@class="overflow-x-auto"]//tbody/tr';
    this.tableHeaders = '//div[@class="overflow-x-auto"]//thead/tr/th';
  }

  /**
   * Navigate to the Static Table Export page.
   */
  async goToStaticTablePage(): Promise<void> {
    await this.page.goto("https://www.playground.testingmavens.tools/components/static-table-export");
  }

  /**
   * Extracts table headers and rows from the page.
   * @returns {Promise<{ headers: string[]; rows: string[][] }>} Table headers and rows as strings
   */
  async getTableData(): Promise<{ headers: string[]; rows: string[][] }> {
    const headers = await this.page.$$eval(this.tableHeaders, th =>
      th.map(el => el.textContent?.trim() || "")
    );
    const rows = await this.page.$$eval(this.tableRows, trs =>
      trs.map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent?.trim() || ""))
    );
    return { headers, rows };
  }

  /**
   * Saves table data as a JSON file in ExtractedJson folder.
   * @param tableData Object containing table headers and rows
   * @returns {Promise<string>} Full path to the saved JSON file
   */
  async saveTableDataToJSON(tableData: { headers: string[]; rows: string[][] }): Promise<string> {
    const extractFolder = path.join(this.projectDir, "ExtractedJson");
    if (!fs.existsSync(extractFolder)) fs.mkdirSync(extractFolder, { recursive: true });

    const jsonFilePath = path.join(extractFolder, "statictableData.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify(tableData, null, 2), "utf-8");
    return jsonFilePath;
  }

  /**
   * Clicks the Excel export button and saves the file.
   * @returns {Promise<string>} Full path to downloaded Excel file
   */
  async downloadExcel(): Promise<string> {
    const downloadFolder = path.join(this.projectDir, "DownloadedFiles");
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    const downloadFileName = "static_employee_data.xlsx";
    const downloadPath = path.join(downloadFolder, downloadFileName);

    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.click(this.excelExportBtn),
    ]);
    await download.saveAs(downloadPath);
    return downloadPath;
  }

  /**
   * Clicks the PDF export link and saves the file.
   * @returns {Promise<string>} Full path to downloaded PDF file
   */
  async downloadPDF(): Promise<string> {
    const downloadFolder = path.join(this.projectDir, "DownloadedFiles");
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    const pdfFileName = "employee_data_report.pdf";
    const pdfPath = path.join(downloadFolder, pdfFileName);

    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.click(this.pdfExportLink),
    ]);
    await download.saveAs(pdfPath);
    return pdfPath;
  }

  /**
   * Reads an Excel file and converts it to a 2D array of values.
   * @param excelPath Full path to Excel file
   * @returns {Promise<any[][]>} Array of rows, each row is an array of cell values
   */
  async readExcel(excelPath: string): Promise<any[][]> {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }

  /**
   * Reads PDF content as text using PDFParse.
   * @param pdfPath Full path to PDF file
   * @returns {Promise<string>} PDF content as a normalized string
   */
  async readPDF(pdfPath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.replace(/\s+/g, " ").trim();
  }
}

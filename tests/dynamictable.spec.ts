import { test, expect } from '@playwright/test';
import DynamicTableExportPage from '../pages/dynamicTable';
import * as path from 'path';
import * as fs from 'fs';

const dataPath = path.resolve(__dirname, '../testData/dynamicTableData.json');
const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const rowData = jsonData.rowData;

test('Add row and verify in exported Excel', async ({ page }) => {
  const dynamicPage = new DynamicTableExportPage(page);
  await dynamicPage.navigate();
  await dynamicPage.addRow(rowData.name, rowData.category, rowData.price, rowData.stock);
  const jsonPath = await dynamicPage.saveTableDataToJSON();
  const tableData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const excelPath = await dynamicPage.exportToExcel(path.resolve(__dirname, '..'));
  const excelData = await dynamicPage.readExcel(excelPath);
  const excelHeaders = (excelData[0] as string[]).map(h => h.toLowerCase().trim());
  const pageHeaders = tableData.headers.map((h: string) => h.toLowerCase().trim());
  expect(excelHeaders, 'Excel headers do not match table headers').toEqual(pageHeaders);
  const excelRows = excelData.slice(1).map((row: any[]) => row.map(cell => String(cell)));
  expect(excelRows, 'Excel rows do not match table rows').toEqual(tableData.rows);
});

test('Add row and verify in exported PDF', async ({ page }) => {
  const dynamicPage = new DynamicTableExportPage(page);
  await dynamicPage.navigate();
  await dynamicPage.addRow(rowData.name, rowData.category, rowData.price, rowData.stock);
  const jsonPath = await dynamicPage.saveTableDataToJSON();
  const tableData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const pdfPath = await dynamicPage.downloadPDF();
  const pdfText = await dynamicPage.readPDF(pdfPath);
  for (const header of tableData.headers) {
    expect(pdfText.includes(header), `PDF is missing header: "${header}"`).toBeTruthy();
  }
  for (const row of tableData.rows) {
    const rowText = row
      .map((cell: string, idx: number) => (idx === 3 ? `$${cell}` : cell)) // Add $ for 4th column if needed
      .join(' ');
    expect(pdfText.includes(rowText), `PDF is missing row: "${rowText}"`).toBeTruthy();
  }
});

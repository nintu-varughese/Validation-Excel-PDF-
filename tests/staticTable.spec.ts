import { test, expect } from '@playwright/test';
import StaticTablePage from '../pages/staticTablePage';

test('Validate table data in Excel', async ({ page }) => {
  const staticTablePage = new StaticTablePage(page);
  await staticTablePage.goToStaticTablePage();
  const tableData = await staticTablePage.getTableData();
  await staticTablePage.saveTableDataToJSON(tableData);

  const excelPath = await staticTablePage.downloadExcel();
  const excelJson = await staticTablePage.readExcel(excelPath);

  const excelHeaders = (excelJson[0] as string[]).map(h => h.toLowerCase().trim());
  const pageHeaders = tableData.headers.map(h => h.toLowerCase().trim());
  expect(excelHeaders, 'Excel headers do not match page table headers').toEqual(pageHeaders);

  const excelRows = excelJson.slice(1).map((row: any[]) =>
    row.map((cell, idx) => (idx === 0 ? String(cell) : idx === 5 ? `$${Number(cell).toLocaleString()}` : String(cell)))
  );
  expect(excelRows, 'Excel rows do not match page table rows').toEqual(tableData.rows);
});

test('Validate table data in PDF', async ({ page }) => {
  const staticTablePage = new StaticTablePage(page);
  await staticTablePage.goToStaticTablePage();
  const tableData = await staticTablePage.getTableData();
  await staticTablePage.saveTableDataToJSON(tableData);

  const pdfPath = await staticTablePage.downloadPDF();
  const pdfText = await staticTablePage.readPDF(pdfPath);

  for (const header of tableData.headers) {
    expect(pdfText.includes(header), `PDF is missing header: "${header}"`).toBeTruthy();
  }

  for (const row of tableData.rows) {
    const rowText = row.join(' ');
    expect(pdfText.includes(rowText), `PDF is missing row: "${rowText}"`).toBeTruthy();
  }
});

import { test, expect } from '@playwright/test';
import FormGeneratorPage from '../pages/formGeneratorPage';
import fs from 'fs';
import path from 'path';

test('Verify name and email are present in PDF', async ({ page }) => {
  const formPage = new FormGeneratorPage(page);
  const dataPath = path.resolve(__dirname, '../testData/userdata.json');
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const formData = jsonData.formData;
  const itemData = jsonData.itemData;
  const pdfPath = await formPage.fillFormAndDownloadPDF(formData, itemData);
  const pdfText = await formPage.readPDF(pdfPath);
  expect(pdfText.includes(formData.name), `PDF is missing name: "${formData.name}"`).toBeTruthy();
  expect(pdfText.includes(formData.email), `PDF is missing email: "${formData.email}"`).toBeTruthy();
});

test('Verify name and email are present in Excel', async ({ page }) => {
  const formPage = new FormGeneratorPage(page);
  const dataPath = path.resolve(__dirname, '../testData/userdata.json');
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const formData = jsonData.formData;
  const itemData = jsonData.itemData;
  const downloadFolder = path.join(path.resolve(__dirname, '..'), 'DownloadedFiles');
  await formPage.fillFormAndDownloadPDF(formData, itemData);
  const excelPath = await formPage.downloadExcel(downloadFolder);
  const excelData = await formPage.readExcel(excelPath);
  const flattened = excelData.flat().join(' ');
  expect(flattened.includes(formData.name), `Excel is missing name: "${formData.name}"`).toBeTruthy();
  expect(flattened.includes(formData.email), `Excel is missing email: "${formData.email}"`).toBeTruthy();
});

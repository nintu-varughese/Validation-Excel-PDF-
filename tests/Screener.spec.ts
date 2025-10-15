import { test, expect } from '@playwright/test';
import RegisterPage from '../pages/register';

test('Register on Screener.in and verify email content', async ({ page, context }) => {
  const yopmailPage = await context.newPage();
  const registerPage = new RegisterPage(page, yopmailPage);

  const { found, content } = await registerPage.registerAndCheckEmail();

  expect(found, 'Activation email was not found in Yopmail inbox').toBeTruthy();
  expect(content, 'Email content missing "Welcome to Screener" text').toContain('Welcome to Screener');
  expect(content, 'Email content missing activation link text').toContain('Click to activate your account');
  expect(content, 'Email content missing activation URL').toContain('https://www.screener.in/activate/');
});

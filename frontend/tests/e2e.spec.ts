import { test, expect } from '@playwright/test';

test.describe('Sanitize Button Functionality', () => {
  test('should sanitize document and display tokenized text', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // 1. Upload a dummy text file
    const fileContent = 'This is a test document with some PII like John Doe and 123-456-7890.';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });

    // Click the "Proceed to Sanitization" button
    await page.getByRole('button', { name: 'Proceed to Sanitization' }).click();

    // 2. Verify that the "Sanitize" button is now clickable and click it
    const sanitizeButton = page.getByRole('button', { name: 'Sanitize' });
    await expect(sanitizeButton).toBeEnabled();
    await sanitizeButton.click();

    // 3. Wait for the sanitization process to complete and the sanitized text to appear
    // We'll look for the "Sanitized Document" header and then for some content within its area
    await expect(page.getByText('Sanitized Document')).toBeVisible();

    // Wait for the sanitized text to appear in the content area
    const sanitizedTextArea = page.locator('div.glass-panel.p-4.rounded-lg.flex-1.overflow-auto.text-gray-700.whitespace-pre-wrap').nth(1); // Assuming it's the second glass-panel
    await expect(sanitizedTextArea).not.toBeEmpty();
    await expect(sanitizedTextArea).toContainText('[PERSON_'); // Expecting tokenized PII
    await expect(sanitizedTextArea).toContainText('[PHONE_NUMBER_'); // Expecting tokenized PII

    // Optional: Add more specific assertions about the content if needed
    // For example, check for the absence of original PII
    await expect(sanitizedTextArea).not.toContainText('John Doe');
    await expect(sanitizedTextArea).not.toContainText('123-456-7890');
  });
});

test.describe('Download Screen and Navigation Functionality', () => {
  test('should handle download screen and navigation correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // 1. Initial Setup: Upload, Sanitize, and navigate to Detokenize & Download step
    const fileContent = 'This is a test document with some PII like John Doe and 123-456-7890.';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });
    await page.getByRole('button', { name: 'Proceed to Sanitization' }).click();
    await page.getByRole('button', { name: 'Sanitize' }).click();
    await expect(page.getByText('Sanitized Document')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeEnabled();
    await page.getByRole('button', { name: 'Next Step' }).click(); // Go to Detokenize & Download

    // 2. Verify Forward Navigation Button Disabled on Step 3
    const nextStepButton = page.getByRole('button', { name: 'Next Step' });
    await expect(nextStepButton).toBeDisabled();

    // 3. Upload LLM Output and Detokenize
    const llmOutputFileContent = 'This is a test document with some PII like [PERSON_0] and [PHONE_NUMBER_0].';
    const llmFileInput = page.locator('div').filter({ hasText: /^Upload LLM output \(.txt\)$/ }).locator('input[type="file"]');
    await llmFileInput.setInputFiles({
      name: 'llm_output.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(llmOutputFileContent),
    });
    await page.getByRole('button', { name: 'Detokenize' }).click();

    // 4. Verify Automatic Navigation to Download Screen and Download Detokenized File
    await expect(page.getByText('Process Complete!')).toBeVisible();

    // 5. Verify Download Screen Content
    await expect(page.locator('div.glass-panel.p-4.rounded-lg.h-64')).not.toBeVisible(); // Detokenized content text box
    await expect(page.getByRole('button', { name: 'Download Final File' })).not.toBeVisible();
    const startOverButton = page.getByRole('button', { name: 'Start Over' });
    await expect(startOverButton).toBeVisible();
    // Verify centering (this is a basic check, visual inspection might be needed for perfect centering)
    const startOverButtonBoundingBox = await startOverButton.boundingBox();
    const cardBoundingBox = await page.locator('.glass-card').boundingBox(); // Assuming Card is the parent
    if (startOverButtonBoundingBox && cardBoundingBox) {
      const buttonCenterX = startOverButtonBoundingBox.x + startOverButtonBoundingBox.width / 2;
      const cardCenterX = cardBoundingBox.x + cardBoundingBox.width / 2;
      expect(Math.abs(buttonCenterX - cardCenterX)).toBeLessThan(10); // Allow for a small margin of error
    }

    // 6. Verify "Start Over" Functionality
    await startOverButton.click();
    await expect(page.getByRole('button', { name: 'Proceed to Sanitization' })).toBeEnabled();
    await expect(page.getByText('Upload Document')).toBeVisible(); // Back to step 1
  });
});
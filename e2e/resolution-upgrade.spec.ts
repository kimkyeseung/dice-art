import { test, expect, Page } from '@playwright/test';

// 해상도 업그레이드 테스트 (Desktop Chrome에서 실행)
test.describe('Resolution Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // 헬퍼: 프리셋 이미지로 작업 시작
  async function startWorkWithPreset(page: Page) {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//, { timeout: 15000 });

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });
  }

  // 헬퍼: Ctrl+Shift+D로 그리드 완성 (디버그 기능)
  async function fillGridWithDebug(page: Page) {
    await page.keyboard.press('Control+Shift+D');
    await page.waitForTimeout(500);
  }

  test('should show 2x resolution button after completing base resolution', async ({ page }) => {
    await startWorkWithPreset(page);

    // 디버그로 그리드 완성
    await fillGridWithDebug(page);

    // 완성 메시지 확인
    await expect(page.getByText('완성!')).toBeVisible({ timeout: 5000 });

    // 2배 해상도 도전 버튼 확인
    const upgradeButton = page.getByRole('button', { name: /2배 해상도로 도전/ });
    await expect(upgradeButton).toBeVisible();

    // 버튼에 예상 크기가 표시되는지 확인 (50 * 2 = 100)
    await expect(upgradeButton).toContainText(/100/);
  });

  test('should upgrade to 2x resolution when clicking upgrade button', async ({ page }) => {
    await startWorkWithPreset(page);
    await fillGridWithDebug(page);

    // 2배 해상도 도전 버튼 클릭
    const upgradeButton = page.getByRole('button', { name: /2배 해상도로 도전/ });
    await upgradeButton.click();

    // 로딩 완료 대기
    await page.waitForTimeout(2000);

    // 그리드 크기 확인 (헤더에 표시됨)
    const gridSizeText = page.locator('text=/100 × \\d+/');
    await expect(gridSizeText).toBeVisible({ timeout: 10000 });
  });

  test('should show 4x resolution button after completing 2x resolution', async ({ page }) => {
    await startWorkWithPreset(page);
    await fillGridWithDebug(page);

    // 2배 해상도로 업그레이드
    const upgrade2xButton = page.getByRole('button', { name: /2배 해상도로 도전/ });
    await upgrade2xButton.click();
    await page.waitForTimeout(2000);

    // 2배 해상도 그리드 완성
    await fillGridWithDebug(page);

    // 완성 메시지 확인
    await expect(page.getByText('완성!')).toBeVisible({ timeout: 5000 });

    // 4배 해상도 도전 버튼 확인
    const upgrade4xButton = page.getByRole('button', { name: /4배 해상도로 도전/ });
    await expect(upgrade4xButton).toBeVisible();

    // 버튼에 예상 크기가 표시되는지 확인 (100 * 2 = 200)
    await expect(upgrade4xButton).toContainText(/200/);
  });

  test('should hide upgrade button after completing 4x resolution (max level)', async ({ page }) => {
    await startWorkWithPreset(page);

    // 1배 → 2배
    await fillGridWithDebug(page);
    const upgrade2xButton = page.getByRole('button', { name: /2배 해상도로 도전/ });
    await upgrade2xButton.click();
    await page.waitForTimeout(2000);

    // 2배 → 4배
    await fillGridWithDebug(page);
    const upgrade4xButton = page.getByRole('button', { name: /4배 해상도로 도전/ });
    await upgrade4xButton.click();
    await page.waitForTimeout(3000);

    // 4배 완성
    await fillGridWithDebug(page);

    // 완성 메시지 확인
    await expect(page.getByText('완성!')).toBeVisible({ timeout: 5000 });

    // 해상도 업그레이드 버튼이 없어야 함
    const upgradeButton = page.getByRole('button', { name: /배 해상도로 도전/ });
    await expect(upgradeButton).not.toBeVisible();

    // 다운로드와 갤러리 공유 버튼은 여전히 표시되어야 함
    await expect(page.getByRole('button', { name: '다운로드' })).toBeVisible();
    await expect(page.getByRole('button', { name: '갤러리에 공유' })).toBeVisible();
  });

  test('should persist resolution after page reload', async ({ page }) => {
    await startWorkWithPreset(page);
    await fillGridWithDebug(page);

    // 2배 해상도로 업그레이드
    const upgradeButton = page.getByRole('button', { name: /2배 해상도로 도전/ });
    await upgradeButton.click();
    await page.waitForTimeout(2000);

    // 페이지 새로고침
    await page.reload();
    await page.waitForTimeout(1000);

    // 그리드 크기가 유지되는지 확인 (100x...)
    const gridSizeText = page.locator('text=/100 × \\d+/');
    await expect(gridSizeText).toBeVisible({ timeout: 10000 });
  });
});

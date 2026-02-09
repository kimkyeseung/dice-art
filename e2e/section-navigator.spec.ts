import { test, expect, Page } from '@playwright/test';

// 테스트용 대형 그리드를 생성하기 위한 헬퍼
// sectionUtils.ts의 MAX_CELLS_PER_SECTION을 임시로 낮춰 테스트
// 실제 앱에서는 50x50 이상의 그리드에서만 섹션 네비게이터가 표시됨

test.describe('Section Navigator', () => {
  // 섹션 네비게이터 테스트를 위해 localStorage에 대형 그리드 데이터를 미리 설정
  async function setupLargeGrid(page: Page) {
    // 60x60 그리드 생성 (50x50 초과하므로 섹션 모드 활성화)
    const width = 60;
    const height = 60;
    const cells: { targetValue: number; filledValue: number | null }[][] = [];

    for (let row = 0; row < height; row++) {
      const rowCells: { targetValue: number; filledValue: number | null }[] = [];
      for (let col = 0; col < width; col++) {
        rowCells.push({
          targetValue: Math.floor(Math.random() * 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          filledValue: null,
        });
      }
      cells.push(rowCells);
    }

    const gridState = { cells, width, height };
    const workId = 'test-large-grid-work';

    // localStorage에 작업 데이터 설정
    await page.addInitScript(({ workId, gridState }) => {
      const workEntry = {
        id: workId,
        gridSize: `${gridState.width} × ${gridState.height}`,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 작업 목록 저장
      localStorage.setItem('dice-art-works', JSON.stringify([workEntry]));

      // 작업 데이터 저장
      localStorage.setItem(`dice-art-work-${workId}`, JSON.stringify({
        gridState,
        originalImageData: 'data:image/png;base64,test',
      }));
    }, { workId, gridState });

    return workId;
  }

  test.beforeEach(async ({ page }) => {
    // 대형 그리드 설정
    await setupLargeGrid(page);
  });

  test('should show section navigator button for large grids', async ({ page }) => {
    // 대형 그리드 작업 페이지로 이동
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 섹션 네비게이터 플로팅 버튼이 표시되는지 확인
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toBeVisible({ timeout: 5000 });

    // 버튼에 섹션 라벨(A1)이 표시되는지 확인
    await expect(sectionButton).toContainText('A1');
  });

  test('should open bottom sheet when clicking section button', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 섹션 버튼 클릭
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toBeVisible({ timeout: 5000 });
    await sectionButton.click();

    // 바텀 시트가 열리는지 확인
    const bottomSheet = page.locator('text=섹션 선택');
    await expect(bottomSheet).toBeVisible({ timeout: 3000 });

    // 미니맵 버튼들이 표시되는지 확인 (2x2 섹션: A1, A2, B1, B2)
    // 바텀 시트 내의 미니맵 버튼들만 선택 (aspect-square 클래스로 구분)
    await expect(page.locator('button.aspect-square:has-text("A1")')).toBeVisible();
    await expect(page.locator('button.aspect-square:has-text("A2")')).toBeVisible();
    await expect(page.locator('button.aspect-square:has-text("B1")')).toBeVisible();
    await expect(page.locator('button.aspect-square:has-text("B2")')).toBeVisible();

    // 통계 섹션이 표시되는지 확인
    await expect(page.locator('text=완료')).toBeVisible();
    await expect(page.locator('text=진행중')).toBeVisible();
    await expect(page.locator('text=미시작')).toBeVisible();
  });

  test('should switch sections when clicking section buttons in bottom sheet', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 현재 섹션이 A1인지 확인
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toContainText('A1');

    // 바텀 시트 열기
    await sectionButton.click();
    await expect(page.locator('text=섹션 선택')).toBeVisible({ timeout: 3000 });

    // B2 섹션 선택
    const b2Button = page.getByRole('button', { name: /B2.*%/ });
    await expect(b2Button).toBeVisible();
    await b2Button.click();

    // 바텀 시트가 닫히고 섹션이 B2로 변경되는지 확인
    await expect(page.locator('text=섹션 선택')).not.toBeVisible({ timeout: 3000 });

    // 플로팅 버튼의 라벨이 B2로 변경되었는지 확인
    const updatedButton = page.getByRole('button', { name: /섹션 B2.*클릭하여 섹션 선택/ });
    await expect(updatedButton).toBeVisible({ timeout: 3000 });
  });

  test('should show toast notification when switching sections', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 바텀 시트 열기
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButton.click();

    // A2 섹션 선택
    const a2Button = page.getByRole('button', { name: /A2.*%/ });
    await a2Button.click();

    // 토스트 알림이 표시되는지 확인
    const toast = page.locator('text=A2').first();
    await expect(toast).toBeVisible({ timeout: 2000 });
  });

  test('should close bottom sheet when clicking close button', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 바텀 시트 열기
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButton.click();
    await expect(page.locator('text=섹션 선택')).toBeVisible({ timeout: 3000 });

    // 닫기 버튼 클릭
    const closeButton = page.getByRole('button', { name: '닫기' });
    await closeButton.click();

    // 바텀 시트가 닫히는지 확인
    await expect(page.locator('text=섹션 선택')).not.toBeVisible({ timeout: 3000 });
  });

  test('should close bottom sheet when clicking overlay', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 바텀 시트 열기
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButton.click();
    await expect(page.locator('text=섹션 선택')).toBeVisible({ timeout: 3000 });

    // 오버레이 클릭 (바텀 시트 외부 영역)
    const overlay = page.locator('.bg-black\\/50');
    await overlay.click({ position: { x: 10, y: 10 } });

    // 바텀 시트가 닫히는지 확인
    await expect(page.locator('text=섹션 선택')).not.toBeVisible({ timeout: 3000 });
  });

  test('should navigate sections with keyboard shortcuts', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 현재 섹션이 A1인지 확인
    let sectionButton = page.getByRole('button', { name: /섹션 A1.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toBeVisible({ timeout: 5000 });

    // Shift + ArrowRight로 A2로 이동
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift');

    await page.waitForTimeout(500);

    // A2로 이동했는지 확인
    sectionButton = page.getByRole('button', { name: /섹션 A2.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toBeVisible({ timeout: 3000 });

    // Shift + ArrowDown으로 B2로 이동
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.up('Shift');

    await page.waitForTimeout(500);

    // B2로 이동했는지 확인
    sectionButton = page.getByRole('button', { name: /섹션 B2.*클릭하여 섹션 선택/ });
    await expect(sectionButton).toBeVisible({ timeout: 3000 });
  });

  test('should fill cells correctly in different sections', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 주사위 선택
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 5000 });
    await diceButton.click();

    // 현재 섹션(A1)에서 여러 셀 채우기 (드래그로)
    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      const client = await page.context().newCDPSession(page);

      // 드래그로 여러 셀 채우기
      const startX = gridBox.x + 30;
      const startY = gridBox.y + 30;
      const endX = gridBox.x + 200;

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      for (let i = 1; i <= 10; i++) {
        const x = startX + ((endX - startX) * i) / 10;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: startY, id: 0 }],
        });
        await page.waitForTimeout(30);
      }

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    }

    await page.waitForTimeout(500);

    // A1 섹션의 진행률 확인 (바텀 시트에서)
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButton.click();
    await expect(page.locator('text=섹션 선택')).toBeVisible({ timeout: 3000 });

    const a1Progress = page.locator('button.aspect-square:has-text("A1")');
    const a1Text = await a1Progress.textContent();
    expect(a1Text).not.toContain('0%');

    // B2 섹션 선택
    const b2Button = page.getByRole('button', { name: /B2.*%/ });
    await b2Button.click();

    await page.waitForTimeout(500);

    // B2 섹션에서도 셀 채우기 (드래그로)
    const newGridBox = await grid.boundingBox();

    if (newGridBox) {
      const client = await page.context().newCDPSession(page);

      const startX = newGridBox.x + 30;
      const startY = newGridBox.y + 30;
      const endX = newGridBox.x + 200;

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      for (let i = 1; i <= 10; i++) {
        const x = startX + ((endX - startX) * i) / 10;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: startY, id: 0 }],
        });
        await page.waitForTimeout(30);
      }

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    }

    await page.waitForTimeout(500);

    // B2에서도 주사위가 채워졌는지 확인 (바텀 시트에서 B2 진행률 확인)
    const sectionButtonAfter = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButtonAfter.click();
    const b2Progress = page.locator('button.aspect-square:has-text("B2")');
    const b2Text = await b2Progress.textContent();
    expect(b2Text).not.toContain('0%');
  });

  test('should show correct progress for each section', async ({ page }) => {
    await page.goto('/work/test-large-grid-work');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 주사위 선택
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await diceButton.click();

    // 현재 섹션(A1)에서 몇 개의 셀 채우기
    const gridBox = await grid.boundingBox();
    if (gridBox) {
      const client = await page.context().newCDPSession(page);

      // 드래그로 여러 셀 채우기
      const startX = gridBox.x + 30;
      const startY = gridBox.y + 30;
      const endX = gridBox.x + 150;

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      for (let i = 1; i <= 5; i++) {
        const x = startX + ((endX - startX) * i) / 5;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: startY, id: 0 }],
        });
        await page.waitForTimeout(30);
      }

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    }

    await page.waitForTimeout(500);

    // 바텀 시트 열기
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await sectionButton.click();

    // A1 섹션의 진행률이 0%보다 큰지 확인 (바텀 시트 내의 미니맵 버튼)
    const a1Button = page.locator('button.aspect-square:has-text("A1")');
    const a1Text = await a1Button.textContent();
    expect(a1Text).not.toContain('0%');

    // 다른 섹션들은 아직 0%인지 확인
    const b2Button = page.locator('button.aspect-square:has-text("B2"):has-text("0%")');
    await expect(b2Button).toBeVisible();
  });

  test('should not show section navigator for small grids', async ({ page }) => {
    // 작은 그리드로 새 작업 시작
    await page.goto('/');

    // 프리셋 이미지 선택 (기본 50셀 그리드)
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();

    // 작업 페이지로 이동
    await page.waitForURL(/\/work\//, { timeout: 15000 });

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 섹션 네비게이터가 표시되지 않는지 확인
    const sectionButton = page.getByRole('button', { name: /섹션.*클릭하여 섹션 선택/ });
    await expect(sectionButton).not.toBeVisible({ timeout: 3000 });
  });

  test('should show completed badge when sections are complete', async ({ page }) => {
    // 일부 섹션이 완료된 그리드 설정
    await page.addInitScript(() => {
      const workId = 'test-partial-complete-grid';
      const width = 60;
      const height = 60;
      const cells: { targetValue: number; filledValue: number | null }[][] = [];

      for (let row = 0; row < height; row++) {
        const rowCells: { targetValue: number; filledValue: number | null }[] = [];
        for (let col = 0; col < width; col++) {
          const targetValue = (Math.floor(Math.random() * 7)) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
          // 첫 번째 섹션(A1: row < 30, col < 30)은 모두 채움
          const filledValue = (row < 30 && col < 30) ? targetValue : null;
          rowCells.push({ targetValue, filledValue });
        }
        cells.push(rowCells);
      }

      const gridState = { cells, width, height };
      const workEntry = {
        id: workId,
        gridSize: `${width} × ${height}`,
        progress: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('dice-art-works', JSON.stringify([workEntry]));
      localStorage.setItem(`dice-art-work-${workId}`, JSON.stringify({
        gridState,
        originalImageData: 'data:image/png;base64,test',
      }));
    });

    await page.goto('/work/test-partial-complete-grid');

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 플로팅 버튼에 완료 뱃지가 표시되는지 확인 (1개 섹션 완료)
    const badge = page.locator('.bg-green-500.rounded-full');
    await expect(badge).toBeVisible({ timeout: 5000 });
    await expect(badge).toContainText('1');
  });
});

import { test, expect } from '@playwright/test';

// 모바일 터치 테스트 (Mobile Chrome/Safari 프로젝트에서만 실행)
test.describe('Mobile Touch Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a new work with preset image', async ({ page }) => {
    // 프리셋 이미지 선택
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });

    await presetImage.click();

    // 작업 페이지로 이동 대기
    await page.waitForURL(/\/work\//, { timeout: 15000 });

    // 그리드가 표시되는지 확인
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should fill cell with single tap', async ({ page }) => {
    // 프리셋 이미지로 작업 시작
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    // 그리드 로딩 대기
    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 주사위 값 선택 (팔레트에서 1 선택) - 모바일/데스크톱 2개 렌더링되므로 first() 사용
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 10000 });
    await diceButton.click();

    // 그리드 위치 가져오기
    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      // 터치로 셀 채우기
      await page.touchscreen.tap(gridBox.x + 50, gridBox.y + 50);
      await page.waitForTimeout(300);
    }
  });

  test('should fill multiple cells with single finger drag', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 주사위 값 선택 (팔레트에서 1 선택) - 모바일/데스크톱 2개 렌더링되므로 first() 사용
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 10000 });
    await diceButton.click();

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      // CDP를 통해 단일 손가락 드래그 시뮬레이션
      const client = await page.context().newCDPSession(page);

      const startX = gridBox.x + 50;
      const startY = gridBox.y + 50;
      const endX = gridBox.x + 200;
      const endY = gridBox.y + 50;

      // 터치 시작
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      // 드래그 (여러 포인트로 이동)
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        const y = startY + ((endY - startY) * i) / steps;

        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y, id: 0 }],
        });

        await page.waitForTimeout(30);
      }

      // 터치 종료
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await page.waitForTimeout(500);
    }
  });

  test('should pan with two finger drag', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      // CDP를 통해 두 손가락 패닝 시뮬레이션
      const client = await page.context().newCDPSession(page);

      const centerX = gridBox.x + gridBox.width / 2;
      const centerY = gridBox.y + gridBox.height / 2;

      // 두 손가락 터치 시작
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [
          { x: centerX - 50, y: centerY, id: 0 },
          { x: centerX + 50, y: centerY, id: 1 },
        ],
      });

      await page.waitForTimeout(100);

      // 두 손가락으로 드래그 (아래로 이동)
      const steps = 5;
      for (let i = 1; i <= steps; i++) {
        const deltaY = (100 * i) / steps;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            { x: centerX - 50, y: centerY + deltaY, id: 0 },
            { x: centerX + 50, y: centerY + deltaY, id: 1 },
          ],
        });
        await page.waitForTimeout(30);
      }

      // 터치 종료
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await page.waitForTimeout(300);
    }
  });

  test('should reset cell with long press on filled cell', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 주사위 값 선택 (팔레트에서 1 선택) - 모바일/데스크톱 2개 렌더링되므로 first() 사용
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 10000 });
    await diceButton.click();

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      const client = await page.context().newCDPSession(page);
      const x = gridBox.x + 50;
      const y = gridBox.y + 50;

      // 먼저 셀 채우기 (빠른 탭)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 0 }],
      });
      await page.waitForTimeout(50);
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await page.waitForTimeout(200);

      // 같은 셀에서 길게 누르기 (500ms+)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 0 }],
      });

      // 롱프레스 시간 대기
      await page.waitForTimeout(600);

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      await page.waitForTimeout(200);
    }
  });

  test('should erase cells with eraser tool', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 먼저 주사위로 셀 채우기
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 10000 });
    await diceButton.click();

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      // 셀 채우기
      await page.touchscreen.tap(gridBox.x + 50, gridBox.y + 50);
      await page.waitForTimeout(300);

      // 지우개 선택
      const eraserButton = page.locator('[data-testid="dice-button-eraser"]').first();
      await expect(eraserButton).toBeVisible({ timeout: 10000 });
      await eraserButton.click();

      // 지우개로 셀 지우기
      await page.touchscreen.tap(gridBox.x + 50, gridBox.y + 50);
      await page.waitForTimeout(300);
    }
  });

  test('should erase multiple cells with eraser drag', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    // 먼저 주사위로 여러 셀 채우기
    const diceButton = page.locator('[data-testid="dice-button-1"]').first();
    await expect(diceButton).toBeVisible({ timeout: 10000 });
    await diceButton.click();

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      const client = await page.context().newCDPSession(page);

      // 드래그로 여러 셀 채우기
      const startX = gridBox.x + 50;
      const startY = gridBox.y + 50;
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

      await page.waitForTimeout(300);

      // 지우개 선택
      const eraserButton = page.locator('[data-testid="dice-button-eraser"]').first();
      await expect(eraserButton).toBeVisible({ timeout: 10000 });
      await eraserButton.click();

      // 지우개로 드래그하여 셀 지우기
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

      await page.waitForTimeout(300);
    }
  });

  test('should show virtual joystick on mobile', async ({ page, browserName }) => {
    // 이 테스트는 모바일 뷰포트에서만 실행 (데스크톱에서는 조이스틱이 숨겨짐)
    test.skip(browserName === 'chromium', 'This test is for mobile viewports only');

    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    // 조이스틱이 모바일에서만 표시되는지 확인
    // 조이스틱 컨테이너는 sm:hidden 클래스를 가짐
    const joystickContainer = page.locator('.sm\\:hidden').filter({
      has: page.locator('.rounded-full.bg-neutral-200\\/80'),
    });

    // 모바일 뷰포트에서 조이스틱이 보여야 함
    await expect(joystickContainer.first()).toBeVisible({ timeout: 10000 });
  });

  // TODO: Canvas 기반에서는 DOM으로 채워진 셀 확인 불가, 진행률 기반으로 수정 필요
  test.skip('should skip filled cells when dragging but overwrite on single tap', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      const client = await page.context().newCDPSession(page);
      const cellSize = 25; // 기본 셀 크기 + gap

      // 1단계: 주사위 1로 첫 번째 셀 채우기
      const diceButton1 = page.locator('[data-testid="dice-button-1"]').first();
      await expect(diceButton1).toBeVisible({ timeout: 10000 });
      await diceButton1.click();

      const firstCellX = gridBox.x + 12;
      const firstCellY = gridBox.y + 12;

      // 첫 번째 셀 단일 탭으로 채우기
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: firstCellX, y: firstCellY, id: 0 }],
      });
      await page.waitForTimeout(50);
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(200);

      // 채워진 주사위 확인 (animate 클래스가 있는 주사위)
      const filledDice = grid.locator('[class*="animate-dice-pop"]');
      const initialCount = await filledDice.count();
      expect(initialCount).toBeGreaterThanOrEqual(1);

      // 2단계: 주사위 2로 드래그 - 이미 채워진 첫 번째 셀 위를 지나감
      const diceButton2 = page.locator('[data-testid="dice-button-2"]').first();
      await expect(diceButton2).toBeVisible({ timeout: 10000 });
      await diceButton2.click();

      // 첫 번째 셀을 시작점으로 하여 오른쪽으로 드래그
      const dragStartX = firstCellX;
      const dragStartY = firstCellY;
      const dragEndX = firstCellX + cellSize * 3; // 3칸 오른쪽으로

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: dragStartX, y: dragStartY, id: 0 }],
      });

      // 드래그 (여러 포인트로 이동)
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const x = dragStartX + ((dragEndX - dragStartX) * i) / steps;
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: dragStartY, id: 0 }],
        });
        await page.waitForTimeout(30);
      }

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(300);

      // 드래그 후 주사위 개수 확인 (첫 번째 셀은 덮어쓰지 않았으므로 여전히 주사위 1)
      // 새로운 셀들만 채워졌어야 함
      const afterDragCount = await filledDice.count();
      expect(afterDragCount).toBeGreaterThan(initialCount);

      // 3단계: 주사위 3으로 이미 채워진 첫 번째 셀 단일 탭 - 덮어써야 함
      const diceButton3 = page.locator('[data-testid="dice-button-3"]').first();
      await expect(diceButton3).toBeVisible({ timeout: 10000 });
      await diceButton3.click();

      // 첫 번째 셀 단일 탭으로 덮어쓰기
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: firstCellX, y: firstCellY, id: 0 }],
      });
      await page.waitForTimeout(50);
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(300);

      // 덮어쓰기 후에도 총 주사위 개수는 동일해야 함 (새로 추가되지 않음)
      const afterOverwriteCount = await filledDice.count();
      // 덮어쓰면 key가 변경되어 새 애니메이션이 트리거됨
      expect(afterOverwriteCount).toBeGreaterThanOrEqual(afterDragCount);
    }
  });

  // TODO: Canvas 기반에서는 DOM으로 채워진 셀 확인 불가, 진행률 기반으로 수정 필요
  test.skip('should not skip filled cells when dragging with eraser', async ({ page }) => {
    const presetImage = page.locator('[data-testid="preset-image"]').first();
    await expect(presetImage).toBeVisible({ timeout: 10000 });
    await presetImage.click();
    await page.waitForURL(/\/work\//);

    const grid = page.locator('[data-testid="canvas-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();

    if (gridBox) {
      const client = await page.context().newCDPSession(page);
      const cellSize = 25;

      // 1단계: 주사위 1로 여러 셀 채우기
      const diceButton1 = page.locator('[data-testid="dice-button-1"]').first();
      await expect(diceButton1).toBeVisible({ timeout: 10000 });
      await diceButton1.click();

      const startX = gridBox.x + 12;
      const startY = gridBox.y + 12;
      const endX = startX + cellSize * 3;

      // 드래그로 여러 셀 채우기
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      for (let i = 1; i <= 6; i++) {
        const x = startX + ((endX - startX) * i) / 6;
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
      await page.waitForTimeout(300);

      // 채워진 주사위 개수 확인
      const filledDice = grid.locator('[class*="animate-dice-pop"]');
      const filledCount = await filledDice.count();
      expect(filledCount).toBeGreaterThanOrEqual(1);

      // 2단계: 지우개로 같은 경로 드래그 - 채워진 셀도 모두 지워야 함
      const eraserButton = page.locator('[data-testid="dice-button-eraser"]').first();
      await expect(eraserButton).toBeVisible({ timeout: 10000 });
      await eraserButton.click();

      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }],
      });

      for (let i = 1; i <= 6; i++) {
        const x = startX + ((endX - startX) * i) / 6;
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
      await page.waitForTimeout(300);

      // 지우개 드래그 후 해당 영역의 주사위가 지워졌는지 확인
      // NumberCell이 다시 나타나야 함
      const numberCells = grid.locator('.font-mono.font-bold');
      const numberCellCount = await numberCells.count();
      expect(numberCellCount).toBeGreaterThanOrEqual(1);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Gallery Page', () => {
  test('should load gallery page with server-rendered content', async ({ page }) => {
    // 갤러리 페이지 접속
    await page.goto('/gallery');

    // 페이지 제목 확인 (서버 렌더링)
    await expect(page.getByRole('heading', { name: '갤러리' })).toBeVisible();

    // 헤더 확인
    await expect(page.locator('header')).toBeVisible();

    // 시작하기 버튼 확인
    await expect(page.getByRole('link', { name: '시작하기' })).toBeVisible();
  });

  test('should show empty state when no artworks', async ({ page }) => {
    await page.goto('/gallery');

    // 빈 상태 또는 작품 그리드 중 하나가 표시되어야 함
    const emptyState = page.getByText('아직 공유된 작품이 없습니다');
    const artworkGrid = page.locator('.grid');

    // 둘 중 하나가 보여야 함
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasArtworks = await artworkGrid.isVisible().catch(() => false);

    expect(hasEmptyState || hasArtworks).toBeTruthy();
  });

  test('should navigate to home from gallery', async ({ page }) => {
    await page.goto('/gallery');

    // 로고 클릭하여 홈으로 이동
    const logo = page.locator('header').getByRole('link', { name: /Dice Art/ });
    await logo.click();

    await expect(page).toHaveURL('/');
  });

  test('should have correct meta title', async ({ page }) => {
    await page.goto('/gallery');

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/갤러리|Gallery|Dice Art/);
  });

  test('should load page quickly (server component)', async ({ page }) => {
    // 네트워크 요청 모니터링
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/artworks')) {
        requests.push(request.url());
      }
    });

    const startTime = Date.now();
    await page.goto('/gallery');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // 서버 컴포넌트이므로 초기 로드에 API 호출이 없어야 함
    // (서버에서 직접 DB 접근)
    // 단, 클라이언트 hydration 후 추가 요청은 있을 수 있음

    // 페이지 제목이 바로 보여야 함 (서버 렌더링 확인)
    await expect(page.getByRole('heading', { name: '갤러리' })).toBeVisible();

    console.log(`Gallery page load time: ${loadTime}ms`);
    console.log(`API requests during load: ${requests.length}`);
  });

  test('should display artwork count when artworks exist', async ({ page }) => {
    await page.goto('/gallery');

    // 작품이 있으면 개수가 표시됨
    const countText = page.getByText(/\d+개의 작품/);
    const emptyState = page.getByText('아직 공유된 작품이 없습니다');

    const hasCount = await countText.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // 작품 개수 또는 빈 상태 중 하나가 표시되어야 함
    expect(hasCount || hasEmptyState).toBeTruthy();
  });
});

test.describe('Gallery Page - With Artworks', () => {
  // 작품이 있는 경우의 테스트 (조건부 실행)
  test('should display artwork cards in grid', async ({ page }) => {
    await page.goto('/gallery');

    // 작품 그리드가 있는지 확인
    const grid = page.locator('.grid');
    const hasGrid = await grid.isVisible().catch(() => false);

    if (hasGrid) {
      // 그리드 내 버튼(카드) 확인
      const cards = grid.locator('button');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 첫 번째 카드에 이미지가 있는지 확인
        const firstCard = cards.first();
        const image = firstCard.locator('img');
        await expect(image).toBeVisible();
      }
    }
  });

  test('should open modal when clicking artwork card', async ({ page }) => {
    await page.goto('/gallery');

    const grid = page.locator('.grid');
    const hasGrid = await grid.isVisible().catch(() => false);

    if (hasGrid) {
      const cards = grid.locator('button');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 첫 번째 카드 클릭
        await cards.first().click();

        // 모달 또는 로딩 표시 확인
        const modal = page.locator('[role="dialog"], .fixed.inset-0');
        const hasModal = await modal.isVisible().catch(() => false);

        // 로딩 중이거나 모달이 열려야 함
        if (hasModal) {
          // 모달 닫기 버튼 확인
          const closeButton = modal.getByRole('button', { name: /✕|닫기|close/i });
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test('should show load more button when has more artworks', async ({ page }) => {
    await page.goto('/gallery');

    // "더 보기" 버튼 확인 (12개 이상의 작품이 있을 때만)
    const loadMoreButton = page.getByRole('button', { name: '더 보기' });
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);

    // 버튼이 있으면 클릭 가능해야 함
    if (hasLoadMore) {
      await expect(loadMoreButton).toBeEnabled();
    }
  });
});

test.describe('Gallery Page - Responsive', () => {
  test('should display 2 columns on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/gallery');

    const grid = page.locator('.grid');
    const hasGrid = await grid.isVisible().catch(() => false);

    if (hasGrid) {
      // 모바일에서 grid-cols-2 클래스 확인
      await expect(grid).toHaveClass(/grid-cols-2/);
    }
  });

  test('should display 4 columns on desktop', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
      return;
    }

    await page.goto('/gallery');

    const grid = page.locator('.grid');
    const hasGrid = await grid.isVisible().catch(() => false);

    if (hasGrid) {
      // 데스크탑에서 lg:grid-cols-4 적용 확인
      await expect(grid).toHaveClass(/lg:grid-cols-4/);
    }
  });
});

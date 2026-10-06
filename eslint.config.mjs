import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 마운트 시 localStorage/window 값을 읽어 상태에 반영하는 패턴은
      // SSR hydration mismatch를 피하기 위해 의도적으로 사용 중이므로 경고로 완화
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // CommonJS 설정 파일
    files: ['*.config.js', 'jest.setup.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
    'src/generated/**',
  ]),
]);

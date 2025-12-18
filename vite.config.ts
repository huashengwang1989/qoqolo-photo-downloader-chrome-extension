import { copyFileSync } from 'fs';
import { resolve } from 'path';

import type { Plugin } from 'vite';
import { build, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// eslint-disable-next-line no-console
console.log('Vite publicDir:', process.cwd() + '/public');

// Plugin to copy LICENSE file to dist
function copyLicense(): Plugin {
  return {
    name: 'copy-license',
    async closeBundle() {
      const licensePath = resolve(__dirname, 'LICENSE');
      const distLicensePath = resolve(__dirname, 'dist/LICENSE');
      try {
        copyFileSync(licensePath, distLicensePath);
        // eslint-disable-next-line no-console
        console.log('[vite] Copied LICENSE to dist');
      } catch (error) {
        console.warn('[vite] Failed to copy LICENSE:', error);
      }
    },
  };
}

// Plugin to rebuild content script as IIFE after main build
function contentScriptIIFE(): Plugin {
  return {
    name: 'content-script-iife',
    async closeBundle() {
      // Rebuild content script as IIFE using Vite's build API
      await build({
        configFile: false,
        root: resolve(__dirname, 'src'),
        build: {
          outDir: resolve(__dirname, 'dist'),
          emptyOutDir: false, // Don't clear dist
          rollupOptions: {
            input: resolve(__dirname, 'src/content/index.ts'),
            output: {
              dir: resolve(__dirname, 'dist'),
              entryFileNames: 'content.js',
              format: 'iife',
              name: 'ContentScript',
            },
          },
        },
        resolve: {
          alias: {
            '@': resolve(__dirname, 'src'),
          },
        },
        plugins: [react()],
      });
    },
  };
}

export default defineConfig({
  root: 'src',
  plugins: [react(), copyLicense(), contentScriptIIFE()],
  publicDir: resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es', // ES modules for background and popup
        // Content script will be rebuilt as IIFE by plugin
      },
    },
  },
});

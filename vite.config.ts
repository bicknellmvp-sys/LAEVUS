import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // loadEnv reads .env files
    const env = loadEnv(mode, '.', '');
    
    // Vercel injects env vars into process.env during build, not just .env files
    // So we check BOTH sources, with multiple possible names
    const geminiKey = 
      env.GEMINI_API_KEY || 
      env.API_KEY || 
      env.VITE_GEMINI_API_KEY || 
      env.VITE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.VITE_API_KEY ||
      '';

    if (!geminiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found during build! Make sure to set VITE_GEMINI_API_KEY or GEMINI_API_KEY in Vercel dashboard and REDEPLOY.');
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // This makes process.env.API_KEY work in the browser bundle
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

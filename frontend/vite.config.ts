import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'nh_energy';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/'
});

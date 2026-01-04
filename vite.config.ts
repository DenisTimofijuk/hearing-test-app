import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Set base path for GitHub Pages deployment
  // Update 'hearing-test-app' to match your repository name
  base: '/hearing-test-app/',
  plugins: [
    tailwindcss(),
  ],
})
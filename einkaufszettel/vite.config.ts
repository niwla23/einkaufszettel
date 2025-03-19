import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { allowedHosts: ["wildly-guiding-koala.ngrok-free.app"] }
});

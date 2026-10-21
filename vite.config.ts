import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: permite empacotar depois com Capacitor/Cordova ou hospedar em subpasta.
  base: './',
  server: {
    // Expõe na rede local para testar no celular (acesse o IP mostrado no terminal).
    host: true,
  },
  build: {
    // O Phaser sozinho tem ~1MB; separamos em um chunk próprio para cache melhor.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});

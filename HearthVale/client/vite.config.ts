import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'local-file-compatible-bundle',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml(html) {
        return html.replace('<script type="module" crossorigin', '<script defer');
      },
      generateBundle(_options, bundle) {
        const index = bundle['index.html'];
        if (!index || index.type !== 'asset') return;

        let html = String(index.source);
        for (const [fileName, output] of Object.entries(bundle)) {
          if (output.type !== 'asset' || !fileName.endsWith('.css')) continue;
          html = html.replace(
            new RegExp(`<link rel="stylesheet"[^>]+href="\\./${fileName}"[^>]*>`),
            `<style>${String(output.source)}</style>`,
          );
          delete bundle[fileName];
        }
        index.source = html;
      },
    },
  ],
  publicDir: '../data',
  server: {
    // Bind all interfaces so phones / other PCs on the LAN can open the game.
    host: true,
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

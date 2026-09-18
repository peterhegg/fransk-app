import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/fransk-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        // Latin-subset fonts only; other unicode-range subsets load on demand.
        globPatterns: ["**/*.{js,css,html}", "**/*-latin-{300,400,500,600}-*.woff2", "**/*latin-wght-normal*.woff2"],
      },
      manifest: {
        name: "L'Atelier",
        short_name: "L'Atelier",
        description: "Lær fransk på din måte",
        lang: "no",
        theme_color: "#2e6be6",
        background_color: "#091526",
        display: "standalone",
        orientation: "portrait",
        start_url: "/fransk-app/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});

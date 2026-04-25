import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/fransk-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        navigateFallback: "/fransk-app/index.html",
      },
      manifest: {
        name: "L'Atelier",
        short_name: "L'Atelier",
        description: "Lær fransk på din måte",
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

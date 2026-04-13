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
        name: "Mon Français",
        short_name: "Fransk",
        description: "Lær fransk på din måte",
        theme_color: "#7a3e18",
        background_color: "#f5f0e6",
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

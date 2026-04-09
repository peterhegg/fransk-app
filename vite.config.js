import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/fransk-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Mon Français",
        short_name: "Fransk",
        description: "Lær fransk på din måte",
        theme_color: "#0F0E0B",
        background_color: "#0F0E0B",
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

import { defineConfig } from "vitest/config";

// DST-sensitive date tests need a zone with DST, regardless of the CI machine.
process.env.TZ = "Europe/Oslo";

export default defineConfig({
  test: { environment: "jsdom", include: ["src/**/*.test.{js,jsx}"], setupFiles: ["src/test-setup.js"] },
});

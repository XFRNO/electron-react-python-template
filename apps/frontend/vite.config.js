import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
// https://vitejs.dev/config/
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
export default defineConfig({
    plugins: [react(), tanstackRouter(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        // Optimize for production performance
        minify: "esbuild",
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor chunks for better caching
                    vendor: ["react", "react-dom"],
                    router: ["@tanstack/react-router"],
                    ui: [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-dropdown-menu",
                        "@radix-ui/react-tooltip",
                        "@radix-ui/react-tabs",
                        "@radix-ui/react-alert-dialog",
                    ],
                },
            },
        },
        // Enable chunking optimizations
        chunkSizeWarningLimit: 1000,
        // Optimize assets
        assetsInlineLimit: 4096,
    },
    base: "./", // 👈 CRUCIAL for Electron (use relative paths)
    // Optimize dependencies
    optimizeDeps: {
        include: ["react", "react-dom", "@tanstack/react-router"],
    },
    // Server optimizations
    server: {
        // Improve dev server performance
        watch: {
            ignored: ["**/dist/**", "**/node_modules/**"],
        },
    },
});

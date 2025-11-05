// vite.config.js
import { defineConfig } from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.pnpm/vite@5.4.21_@types+node@24.10.0_lightningcss@1.30.2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@24.10.0_lightningcss@1.30.2_/node_modules/@vitejs/plugin-react/dist/index.js";
import { tanstackRouter } from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.pnpm/@tanstack+router-vite-plugin@1.134.12_@tanstack+react-router@1.134.12_react-dom@18.3.1__f251c43f86423564aba88aab4e784883/node_modules/@tanstack/router-vite-plugin/dist/esm/index.js";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.pnpm/@tailwindcss+vite@4.1.16_vite@5.4.21_@types+node@24.10.0_lightningcss@1.30.2_/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/apps/frontend/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), tanstackRouter(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
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
            "@radix-ui/react-alert-dialog"
          ]
        }
      }
    },
    // Enable chunking optimizations
    chunkSizeWarningLimit: 1e3,
    // Optimize assets
    assetsInlineLimit: 4096
  },
  base: "./",
  // 👈 CRUCIAL for Electron (use relative paths)
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-router"]
  },
  // Server optimizations
  server: {
    // Improve dev server performance
    watch: {
      ignored: ["**/dist/**", "**/node_modules/**"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMveGZybm8vQ29kZS9wZXJzb25hbF9wcm9qZWN0cy9lbGVjdHJvbi1yZWFjdC1weXRob24tdGVtcGxhdGUvYXBwcy9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3hmcm5vL0NvZGUvcGVyc29uYWxfcHJvamVjdHMvZWxlY3Ryb24tcmVhY3QtcHl0aG9uLXRlbXBsYXRlL2FwcHMvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3hmcm5vL0NvZGUvcGVyc29uYWxfcHJvamVjdHMvZWxlY3Ryb24tcmVhY3QtcHl0aG9uLXRlbXBsYXRlL2FwcHMvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgdGFuc3RhY2tSb3V0ZXIgfSBmcm9tIFwiQHRhbnN0YWNrL3JvdXRlci12aXRlLXBsdWdpblwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xudmFyIF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG52YXIgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFuc3RhY2tSb3V0ZXIoKSwgdGFpbHdpbmRjc3MoKV0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgICAgLy8gT3B0aW1pemUgZm9yIHByb2R1Y3Rpb24gcGVyZm9ybWFuY2VcbiAgICAgICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICAgICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU3BsaXQgdmVuZG9yIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcbiAgICAgICAgICAgICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgICAgICAgICAgICAgICAgcm91dGVyOiBbXCJAdGFuc3RhY2svcmVhY3Qtcm91dGVyXCJdLFxuICAgICAgICAgICAgICAgICAgICB1aTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10YWJzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2dcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gRW5hYmxlIGNodW5raW5nIG9wdGltaXphdGlvbnNcbiAgICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgICAvLyBPcHRpbWl6ZSBhc3NldHNcbiAgICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgfSxcbiAgICBiYXNlOiBcIi4vXCIsIC8vIFx1RDgzRFx1REM0OCBDUlVDSUFMIGZvciBFbGVjdHJvbiAodXNlIHJlbGF0aXZlIHBhdGhzKVxuICAgIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBpbmNsdWRlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcIkB0YW5zdGFjay9yZWFjdC1yb3V0ZXJcIl0sXG4gICAgfSxcbiAgICAvLyBTZXJ2ZXIgb3B0aW1pemF0aW9uc1xuICAgIHNlcnZlcjoge1xuICAgICAgICAvLyBJbXByb3ZlIGRldiBzZXJ2ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgIGlnbm9yZWQ6IFtcIioqL2Rpc3QvKipcIiwgXCIqKi9ub2RlX21vZHVsZXMvKipcIl0sXG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrYSxTQUFTLG9CQUFvQjtBQUMvYixPQUFPLFdBQVc7QUFDbEIsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8saUJBQWlCO0FBTGdQLElBQU0sMkNBQTJDO0FBT3pULElBQUksYUFBYSxjQUFjLHdDQUFlO0FBQzlDLElBQUksWUFBWSxLQUFLLFFBQVEsVUFBVTtBQUN2QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxHQUFHLGVBQWUsR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNsRCxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQTtBQUFBLElBRWIsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ0osY0FBYztBQUFBO0FBQUEsVUFFVixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsUUFBUSxDQUFDLHdCQUF3QjtBQUFBLFVBQ2pDLElBQUk7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0o7QUFBQSxRQUNKO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixtQkFBbUI7QUFBQSxFQUN2QjtBQUFBLEVBQ0EsTUFBTTtBQUFBO0FBQUE7QUFBQSxFQUVOLGNBQWM7QUFBQSxJQUNWLFNBQVMsQ0FBQyxTQUFTLGFBQWEsd0JBQXdCO0FBQUEsRUFDNUQ7QUFBQTtBQUFBLEVBRUEsUUFBUTtBQUFBO0FBQUEsSUFFSixPQUFPO0FBQUEsTUFDSCxTQUFTLENBQUMsY0FBYyxvQkFBb0I7QUFBQSxJQUNoRDtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

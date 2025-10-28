// vite.config.ts
import { defineConfig } from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.bun/vite@5.4.21/node_modules/vite/dist/node/index.js";
import react from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.bun/@vitejs+plugin-react@4.7.0+6aed63b68d34ec2d/node_modules/@vitejs/plugin-react/dist/index.js";
import { tanstackRouter } from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.bun/@tanstack+router-vite-plugin@1.133.32/node_modules/@tanstack/router-vite-plugin/dist/esm/index.js";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/node_modules/.bun/@tailwindcss+vite@4.1.16+6aed63b68d34ec2d/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/xfrno/Code/personal_projects/electron-react-python-template/apps/frontend/vite.config.ts";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMveGZybm8vQ29kZS9wZXJzb25hbF9wcm9qZWN0cy9lbGVjdHJvbi1yZWFjdC1weXRob24tdGVtcGxhdGUvYXBwcy9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3hmcm5vL0NvZGUvcGVyc29uYWxfcHJvamVjdHMvZWxlY3Ryb24tcmVhY3QtcHl0aG9uLXRlbXBsYXRlL2FwcHMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3hmcm5vL0NvZGUvcGVyc29uYWxfcHJvamVjdHMvZWxlY3Ryb24tcmVhY3QtcHl0aG9uLXRlbXBsYXRlL2FwcHMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgdGFuc3RhY2tSb3V0ZXIgfSBmcm9tIFwiQHRhbnN0YWNrL3JvdXRlci12aXRlLXBsdWdpblwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFuc3RhY2tSb3V0ZXIoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIC8vIE9wdGltaXplIGZvciBwcm9kdWN0aW9uIHBlcmZvcm1hbmNlXG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFNwbGl0IHZlbmRvciBjaHVua3MgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgICAgICByb3V0ZXI6IFtcIkB0YW5zdGFjay9yZWFjdC1yb3V0ZXJcIl0sXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBFbmFibGUgY2h1bmtpbmcgb3B0aW1pemF0aW9uc1xuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAvLyBPcHRpbWl6ZSBhc3NldHNcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NixcbiAgfSxcbiAgYmFzZTogXCIuL1wiLCAvLyBcdUQ4M0RcdURDNDggQ1JVQ0lBTCBmb3IgRWxlY3Ryb24gKHVzZSByZWxhdGl2ZSBwYXRocylcbiAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwiQHRhbnN0YWNrL3JlYWN0LXJvdXRlclwiXSxcbiAgfSxcbiAgLy8gU2VydmVyIG9wdGltaXphdGlvbnNcbiAgc2VydmVyOiB7XG4gICAgLy8gSW1wcm92ZSBkZXYgc2VydmVyIHBlcmZvcm1hbmNlXG4gICAgd2F0Y2g6IHtcbiAgICAgIGlnbm9yZWQ6IFtcIioqL2Rpc3QvKipcIiwgXCIqKi9ub2RlX21vZHVsZXMvKipcIl0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrYSxTQUFTLG9CQUFvQjtBQUMvYixPQUFPLFdBQVc7QUFDbEIsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8saUJBQWlCO0FBTGdQLElBQU0sMkNBQTJDO0FBUXpULElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBWSxLQUFLLFFBQVEsVUFBVTtBQUV6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGVBQWUsR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNsRCxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQTtBQUFBLElBRWIsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsUUFBUSxDQUFDLHdCQUF3QjtBQUFBLFVBQ2pDLElBQUk7QUFBQSxZQUNGO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixtQkFBbUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsTUFBTTtBQUFBO0FBQUE7QUFBQSxFQUVOLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsd0JBQXdCO0FBQUEsRUFDMUQ7QUFBQTtBQUFBLEVBRUEsUUFBUTtBQUFBO0FBQUEsSUFFTixPQUFPO0FBQUEsTUFDTCxTQUFTLENBQUMsY0FBYyxvQkFBb0I7QUFBQSxJQUM5QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

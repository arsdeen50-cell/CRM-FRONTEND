import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The web app manifest (home-screen install): name and icon follow a client's VITE_BRAND_* settings
const webManifest = (mode) => ({
    name: "web-manifest",
    generateBundle() {
        const env = loadEnv(mode, process.cwd(), "VITE_");
        const name = process.env.VITE_BRAND_NAME || env.VITE_BRAND_NAME || "ARSDEEN";
        const mark = process.env.VITE_BRAND_MARK || env.VITE_BRAND_MARK;
        const icons = mark
            ? [{ src: mark, sizes: "192x192", type: "image/png", purpose: "any" }]
            : [
                  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
                  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
              ];
        this.emitFile({
            type: "asset",
            fileName: "manifest.webmanifest",
            source: JSON.stringify({ name: `${name} CRM`, short_name: name, start_url: "/", scope: "/", display: "standalone", background_color: "#ffffff", theme_color: "#18181b", icons }, null, 2),
        });
    },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react(), webManifest(mode)],
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                // React and friends in their own file, so the browser keeps it cached across deploys
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom", "react-redux", "@reduxjs/toolkit", "redux-persist"],
                },
            },
        },
    },
}));

import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.tsx",
            refresh: true,
            publicDirectory: "public",
        }),
        react(),
    ],
    publicDir: "public",
    resolve: {
        alias: {
            "@": "/resources/js",
        },
    },
});

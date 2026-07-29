import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose on your local network (open the printed Network URL on a phone)
    port: 3000,
  },
  preview: {
    host: true,
    port: 3000,
  },
});

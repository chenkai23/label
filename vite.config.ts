import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173
//   }
// })
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "process.env": env,
    },
    root: path.join(__dirname, "./"), // 显式指定根目录
    base: "/labelProject/", // 确保使用相对路径
    build: {
      outDir: "dist", // 输出目录
      assetsDir: "assets", // 静态资源目录
      emptyOutDir: true, // 清空输出目录
    },
    server: {
      port: 5173,
    },
  };
});

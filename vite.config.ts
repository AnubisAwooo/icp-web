import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";

export default defineConfig(({ command, mode }) => {
  // 初始化 canisterId 进入环境
  function initCanisterIds() {
    let localCanisters: any, prodCanisters: any, canisters: any;

    try {
      localCanisters = require(path.resolve(".dfx", "local", "canister_ids.json"));
    } catch (error) {
      console.log("No local canister_ids.json found. Continuing production");
    }
    try {
      prodCanisters = require(path.resolve("canister_ids.json"));
    } catch (error) {
      console.log("No production canister_ids.json found. Continuing with local");
    }

    const network =
      process.env.DFX_NETWORK ||
      (mode === "production" ? "ic" : "local");

    canisters = network === "local" ? localCanisters : prodCanisters;

    for (const canister in canisters) {
      process.env[canister.toUpperCase() + "_CANISTER_ID"] =
        canisters[canister][network];
    }
  }
  initCanisterIds();

  let common: UserConfig = {
    root: './src/icp_web_assets/src', // vite 执行的根目录
    publicDir: '../assets',
    mode,
    define: {
      'process.env': { // 恢复环境变量
        ...process.env,
        'MODE': mode,
        isDevelopment: mode !== 'production', // 判断是否是开发模式
        NODE_ENV: mode, // 自动生成的 index.js 貌似要用这个变量
      } 
    },
    plugins: [vue()],
    resolve: {
      alias: { // 别名解析路径 @ 什么的
        "@": path.resolve(__dirname, "src/icp_web_assets/src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx"], // import 可以省略的拓展名
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path, // 调用后端不用移除 /api 标识，icp 的调用路径需要
        },
      },
      cors: true,
      watch: {
        ignored: ['!**/node_modules/your-package-name/**']
      }
    },
    build: {
      outDir: '../../../dist/icp_web_assets', // 构建输出目录
      minify: mode !== 'production' ? false : 'terser',
    },
  };
  if (command === 'serve') {
    return {
      // serve 独有配置 开发模式
      ...common,
      
      logLevel: 'error', // 不知道体现在哪里
      clearScreen: false, 
      optimizeDeps: {
        exclude: ['icp_web_assets'] // 不知道有没有用
      }
    }
  } else {
    return {
      // build 独有配置 生产模式
      ...common,
      logLevel: 'info',  // 不知道体现在哪里
    }
  }
})

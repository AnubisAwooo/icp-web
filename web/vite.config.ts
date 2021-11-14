import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";

// 区分环境配置，关键点在于开发环境需要哪些东西，这些东西怎么来？
// 主要获取的信息有 需要用到的一些 canister id 和 这些 id 对应的接口，把这类文件找对
// 对于 id 的读取，我希望配置到一个确定的路径数组中，全部加入
// 对于 接口 的读取，同样是路径数组，全部加入



function initCanisterIdsAndAlias(isDevelopment: boolean) {
  let localCanisters: any, prodCanisters: any, canisters: any;

  try {
    // 读取本地开发环境的 canister id 路径是 ./.dfx/local/canister_ids.json
    localCanisters = require(path.resolve(".dfx", "local", "canister_ids.json"));
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    // 读取生产环境的 canister id 路径是 ./canister_ids.json
    prodCanisters = require(path.resolve("canister_ids.json"));
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const network = process.env.DFX_NETWORK || (isDevelopment ? "local" : "ic");

  canisters = network === "local" ? localCanisters : prodCanisters;

  for (const canister in canisters) {
    process.env[canister.toUpperCase() + "_CANISTER_ID"] =
      canisters[canister][network];
  }
  let canistersAlias = {};
  for (const canister in canisters) {
    canistersAlias['dfx-generated/' + canister] = path.join(__dirname, ".dfx", network, "canisters", canister);
  }

  return {
    network,
    canistersAlias,
  }
}

export default defineConfig(({ command, mode }) => {
  let isDevelopment = mode !== 'production';

  // 初始化 canisterId 进入环境
  let {network, canistersAlias} = initCanisterIdsAndAlias(isDevelopment);

  let common: UserConfig = {
    root: './src/icp_web_assets/src', // vite 执行的根目录
    publicDir: '../assets',
    mode,
    define: {
      'process.env': { // 恢复环境变量
        ...process.env,
        'MODE': mode,
        isDevelopment, // 判断是否是开发模式
        NODE_ENV: mode, // 自动生成的 index.js 貌似要用这个变量
      } 
    },
    plugins: [vue()],
    resolve: {
      alias: { // 别名解析路径 @ 什么的
        ...canistersAlias,
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
        ignored: ['!**/node_modules/icp_web_assets/**']
      }
    },
    build: {
      outDir: '../../../dist/icp_web_assets', // 构建输出目录
      minify: mode !== 'production' ? false : 'terser',
    },
    envDir: './.env' // 加载环境变量
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

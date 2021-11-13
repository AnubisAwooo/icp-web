import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";

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
    (process.env.NODE_ENV === "production" ? "ic" : "local");

  canisters = network === "local" ? localCanisters : prodCanisters;

  for (const canister in canisters) {
    process.env[canister.toUpperCase() + "_CANISTER_ID"] =
      canisters[canister][network];
  }
}
initCanisterIds();

export default defineConfig(({ command, mode }) => {
  let common = {
    plugins: [vue()],
    root: './src/icp_web_assets/src', // vite 执行的根目录
    publicDir: '../assets',
    build: {
      outDir: '../../../dist/icp_web_assets', // 构建输出目录
    },
    define: {
      'process.env': { // 恢复环境变量
        ...process.env,
        'MODE': mode,
        isDevelopment: mode !== 'production', // 判断是否是开发模式
      } 
    }
  };
  if (command === 'serve') {
    return {
      // serve 独有配置
      ...common
    }
  } else {
    return {
      // build 独有配置
      ...common
    }
  }
})

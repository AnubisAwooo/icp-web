import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv, UserConfig } from 'vite'
import path from "path"
import dfxJson from "./dfx.json"
import fs from "fs"

// 区分环境配置，关键点在于开发环境需要哪些东西，这些东西怎么来？
// 主要获取的信息有 需要用到的一些 canister id 和 这些 id 对应的接口，把这类文件找对
// 对于 id 的读取，我希望配置到一个确定的路径数组中，全部加入
// 对于 接口 的读取，同样是路径数组，全部加入
const isDev = process.env["DFX_NETWORK"] !== "ic"

let canisterIds
try {
  canisterIds = JSON.parse(fs.readFileSync(isDev ? ".dfx/local/canister_ids.json" : "./canister_ids.json"))
} catch (e) {

}

function initCanisterIdsAndAlias(isDevelopment: boolean, viteEnv: Record<string, string>) {
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

  let network = process.env.DFX_NETWORK || (isDevelopment ? "local" : "ic");
  if (viteEnv.VITE_LOCAL_NETWORK === 'local') network = 'local';

  canisters = network === "local" ? localCanisters : prodCanisters;

  for (const canister in canisters) {
    process.env[canister.toUpperCase() + "_CANISTER_ID"] = canisters[canister][network];
  }
  let canistersAlias = {};
  for (const canister in canisters) {
    // canistersAlias['dfx-generated/' + canister] = path.join(__dirname, ".dfx", network, "canisters", canister);
    // canistersAlias['dfx-generated/' + canister] = path.join(__dirname, ".dfx", network, "canisters", canister, canister + '.did.js');
    canistersAlias['dfx-generated/' + canister] = path.join(__dirname, ".dfx", network, "canisters", canister, 'index.js');
  }

  console.log('process.env', process.env);
  console.log('canistersAlias', canistersAlias);

  return {
    network,
    canistersAlias,
  }
}

// List of all aliases for canisters
const aliases = Object.entries(dfxJson.canisters).reduce(
  (acc, [name, _value]) => {
    // Get the network name, or `local` by default.
    const networkName = process.env["DFX_NETWORK"] || "local";
    const outputRoot = path.join(
      __dirname,
      ".dfx",
      networkName,
      "canisters",
      name
    );

    return {
      ...acc,
      ["dfx-generated/" + name]: path.join(outputRoot, name + ".did.js"),
    };
  },
  {}
);

console.log('aliases', aliases)


export default defineConfig(({ command, mode }) => {
  // let viteEnv = {}; // 导入设置的环境变量，会根据选择的 mode 选择文件
  let viteEnv = loadEnv(mode, './env'); // 导入设置的环境变量，会根据选择的 mode 选择文件
  console.log('viteEnv', viteEnv);

  let isDevelopment = mode !== 'production';

  // 初始化 canisterId 进入环境
  let {network, canistersAlias} = initCanisterIdsAndAlias(isDevelopment, viteEnv);

console.log(canistersAlias);

  let common: UserConfig = {
    root: './src/icp_web_assets/src', // vite 执行的根目录
    publicDir: '../assets',
    mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      'process.env': { // 恢复环境变量
        ...process.env,// 判断是否是开发模式
        // 'NODE_ENV': JSON.stringify(mode), // 自动生成的 index.js 貌似要用这个变量
      },
    },
    plugins: [vue()],
    resolve: {
      alias: { // 别名解析路径 @ 什么的
        ...canistersAlias,
        "@": path.resolve(__dirname, "src/icp_web_assets/src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx"], // import 可以省略的拓展名
    },
    build: {
      outDir: '../../../dist/icp_web_assets', // 构建输出目录
      // minify: mode !== 'production' ? false : 'terser',
      minify: false, // 暂时不压缩 debug 啊
    },
  };
  if (command === 'serve') {
    return {
      // serve 独有配置 开发模式
      ...common,

      logLevel: 'error', // 不知道体现在哪里
      clearScreen: false,
      server: {
        port: 8080,
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

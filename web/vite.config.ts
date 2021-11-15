import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv, UserConfig } from 'vite'
import path from "path"
import dfxJson from "./dfx.json"
import fs from "fs"

// 区分环境配置，关键点在于开发环境需要哪些东西，这些东西怎么来？
// 主要获取的信息有 需要用到的一些 canister id 和 这些 id 对应的接口，把这类文件找对
// 对于 id 的读取，我希望配置到一个确定的路径数组中，全部加入
// 对于 接口 的读取，同样是路径数组，全部加入

function getCanisterIds(isDev: boolean, viteEnv: Record<string, string>) {
  let developmentCanisterIdsPositions = viteEnv.VITE_DEVELOPMENT_CANISTER_IDS?.split(',') || [".dfx/local/canister_ids.json"];
  let productionCanisterIdsPositions = viteEnv.VITE_PRODUCTION_CANISTER_IDS?.split(',') || ["./canister_ids.json"];

  let positions = isDev ? developmentCanisterIdsPositions : productionCanisterIdsPositions;

  let canisterIds = {}
  try {
    for (let position of positions) {
      // console.log(i, position, JSON.parse(fs.readFileSync(position).toString()))
      Object.assign(canisterIds, JSON.parse(fs.readFileSync(position).toString()))
    }
  } catch (e) {
    console.error("read canister ids failed. the path is ", positions);
    for (let position of developmentCanisterIdsPositions) {
      Object.assign(canisterIds, JSON.parse(fs.readFileSync(position).toString()))
    }
  }

  return canisterIds;
}

function getCanisterApis(isDev: boolean, viteEnv: Record<string, string>) {
  let developmentCanisterApisPositions = viteEnv.VITE_DEVELOPMENT_CANISTER_APIS?.split(',') || [".dfx/local/canisters"];
  let productionCanisterApisPositions = viteEnv.VITE_PRODUCTION_CANISTER_APIS?.split(',') || [".dfx/local/canisters"];

  let positions = isDev ? developmentCanisterApisPositions : productionCanisterApisPositions;

  let canisterApis = {}
  try {
    for (let position of positions) {
      let dirs = fs.readdirSync(position)
      console.log('dirs', dirs);
      for (let dir of dirs) {
        if (fs.lstatSync(position + '/' + dir).isDirectory()) {
          canisterApis[dir] = position + '/' + dir
        }
      }
    }
  } catch (e) {
    console.error("read canister api failed. the path is ", positions);
  }

  return canisterApis;
}

function getNetwork(isDev: boolean, viteEnv: Record<string, string>) {
  let network = process.env.DFX_NETWORK || (isDev ? "local" : "ic");
  return network;
}

function initAlias(canisters: {}, network: string, apiPositions: {}) {
  let canistersAlias = {};
  for (const canister in canisters) {
    process.env[canister.toUpperCase() + "_CANISTER_ID"] = canisters[canister][network];
    console.log(canister.toUpperCase() + "_CANISTER_ID ->", canisters[canister][network])

    if (apiPositions[canister]) {
      canistersAlias['canisters/' + canister] = path.join(__dirname, apiPositions[canister] + '/index.js');
      console.log('canisters/' + canister + ' ->', path.join(__dirname, apiPositions[canister] + '/index.js'))
    }
  }
  return canistersAlias
}

export default defineConfig(({ command, mode }) => {
  let viteEnv = loadEnv(mode, './env'); // 导入设置的环境变量，会根据选择的 mode 选择文件
  console.log('viteEnv', viteEnv);

  // 要判断是不是生产模式 command=build mode=ic
  console.log('viteEnv', command);
  console.log('viteEnv', mode);
  let isDev = command !== 'build' || viteEnv.VITE_NETWORK !== 'ic'

  let canisterIds = getCanisterIds(isDev, viteEnv);
  let canisterApis = getCanisterApis(isDev, viteEnv);
  let network = getNetwork(isDev, viteEnv);
  console.log('network -> ', network);
  let canistersAlias = initAlias(canisterIds, network, canisterApis);

  const DFX_PORT = dfxJson.networks.local.bind.split(":")[1]
  console.log('proxy port -> ', DFX_PORT)

  // process.env.mode = mode; // 代码里面也可以判断是否是本地网络
  // process.env.network = network; // 网络 local 或 ic

  let common: UserConfig = {
    root: 'src', // vite 执行的根目录
    publicDir: '../public',
    mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      'process.env': process.env,
    },
    plugins: [vue()],
    resolve: {
      alias: { // 别名解析路径 @ 什么的
        ...canistersAlias,
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx"], // import 可以省略的拓展名
    },
    build: {
      outDir: '../dist/web', // 构建输出目录
      minify: isDev ? false : 'terser',
      // minify: false, // 暂时不压缩 debug 啊
    },
    envDir: 'env',
  };

  console.log('process.env.NODE_ENV ->', common.define['process.env.NODE_ENV']);

  if (isDev) {
    return {
      // serve 独有配置 开发模式
      ...common,

      logLevel: 'error', // 不知道体现在哪里
      clearScreen: false,
      server: {
        port: 8080,
        proxy: {
          "/api": {
            target: "http://localhost:" + DFX_PORT,
            changeOrigin: true,
            rewrite: (path) => path, // 调用后端不用移除 /api 标识，icp 的调用路径需要
          },
        },
        cors: true,
      },
      optimizeDeps: {
        exclude: ['web'] // 不知道有没有用
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

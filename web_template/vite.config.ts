import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv, UserConfig } from "vite"
import path from "path"
import dfxJson from "./dfx.json"
import fs from "fs"

function getCanisterIds(isDev: boolean, viteEnv: Record<string, string>) {
  const developmentCanisterIdsPositions = [".dfx/local/canister_ids.json"];
  const productionCanisterIdsPositions = ["./canister_ids.json"];

  let positions = viteEnv.VITE_CANISTER_IDS?.split(',') || isDev ? developmentCanisterIdsPositions : productionCanisterIdsPositions;

  let canisterIds = {}
  let flag = true;
  try {
    for (let position of positions) {
      if (fs.existsSync(position)) {
        Object.assign(canisterIds, JSON.parse(fs.readFileSync(position).toString()))
      } else {
        console.log('canister ids file is not exist: ', position);
        flag = false;
      }
    }
  } catch (e) {
    console.error("read canister ids failed. the path is ", positions);
  }

  if (!flag) {
    for (let position of developmentCanisterIdsPositions) {
      console.log('load local canister ids: ', position);
      Object.assign(canisterIds, JSON.parse(fs.readFileSync(position).toString()))
    }
  }

  return canisterIds;
}

function getCanisterApis(isDev: boolean, viteEnv: Record<string, string>) {
  let developmentCanisterApisPositions = viteEnv.VITE_CANISTER_APIS?.split(',') || [".dfx/local/canisters"];
  let productionCanisterApisPositions = viteEnv.VITE_CANISTER_APIS?.split(',') || [".dfx/local/canisters"];

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
    console.log(canister.toUpperCase() + "_CANISTER_ID", canisters[canister][network])

    if (apiPositions[canister]) {
      canistersAlias['canisters/' + canister] = path.join(__dirname, apiPositions[canister] + '/index.js');
      console.log('canisters/' + canister, path.join(__dirname, apiPositions[canister] + '/index.js'))
    }
  }
  return canistersAlias
}
export default defineConfig(({ command, mode }) => {
  let viteEnv = loadEnv(mode, './env'); // 导入设置的环境变量，会根据选择的 mode 选择文件
  console.log('viteEnv', viteEnv);

  console.log('command', command);
  console.log('mode', mode);
  console.log('VITE_NETWORK', viteEnv.VITE_NETWORK);
  let isDev = command !== 'build' || viteEnv.VITE_NETWORK !== 'ic'
  console.log('isDev', isDev);

  let canisterIds = getCanisterIds(isDev, viteEnv);
  let canisterApis = getCanisterApis(isDev, viteEnv);
  let network = getNetwork(isDev, viteEnv);
  console.log('network', network);
  let canistersAlias = initAlias(canisterIds, network, canisterApis);

  const DFX_PORT = dfxJson.networks.local.bind.split(":")[1]
  console.log('proxy port', DFX_PORT)

  let common: UserConfig = {
    mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      'process.env': process.env,
    },
    plugins: [vue()],
    resolve: {
      alias: {
        ...canistersAlias,
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx"], // import 可以省略的拓展名
    },
    build: {
      minify: isDev ? false : 'terser',
    },
    envDir: 'env',
  };

  console.log('process.env.NODE_ENV', common.define['process.env.NODE_ENV']);

  if (isDev) {
    const devPort = 3000;
    // console.log('http://localhost:3000')
    return {
      // serve 独有配置 开发模式
      ...common,
      clearScreen: false,
      server: {
        port: devPort,
        proxy: {
          "/api": {
            target: "http://localhost:" + DFX_PORT,
            changeOrigin: true,
            rewrite: (path) => path,
          },
        },
        cors: true,
      },
    }
  } else {
    return {
      // build 独有配置 生产模式
      ...common,
    }
  }
})

import { createApp } from 'vue'
import App from './App.vue'

if (process.env.isDevelopment) console.log('env1', process.env); // 开发模式才输出日志
console.log('env2', process.env);

import { icp_web } from "dfx-generated/icp_web"; // 应当从配置文件中读取位置，然后引入调用
// import { icp_web } from "/Users/gleam/Downloads/projects/icpleague/icp_web/web/.dfx/local/canisters/icp_web"; // 应当从配置文件中读取位置，然后引入调用
// let icp_web = require("@/declarations/icp_web"); // 应当从配置文件中读取位置，然后引入调用
console.error('greeting', icp_web);
try {
  console.error('greeting', icp_web);
  icp_web.greet('123123').then(g => console.error(g));
} catch (e) {
  console.error(e)
}


(window as any).global = window; // fix: ReferenceError: global is not defined

createApp(App).mount('#app')

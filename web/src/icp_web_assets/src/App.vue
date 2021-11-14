<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from '@/components/HelloWorld.vue'
if (process.env.isDevelopment) console.log('env1', process.env); // 开发模式才输出日志

import { icp_web } from "dfx-generated/icp_web"; // 应当从配置文件中读取位置，然后引入调用
// let icp_web = require("@/declarations/icp_web"); // 应当从配置文件中读取位置，然后引入调用
console.error('greeting');
icp_web.greet('123123').then(g => console.error(g));

</script>

<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

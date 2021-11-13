import { icp_web } from "../../declarations/icp_web";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with icp_web actor, calling the greet method
  const greeting = await icp_web.greet(name);

  document.getElementById("greeting").innerText = greeting;
});

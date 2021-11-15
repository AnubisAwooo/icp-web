import { backend2 } from "../../declarations/backend2";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with backend actor, calling the greet method
  const greeting = await backend2.greet(name);

  document.getElementById("greeting").innerText = greeting;
});

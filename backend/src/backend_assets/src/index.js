import { backend } from "../../declarations/backend";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with backend actor, calling the greet method
  const greeting = await backend.greet(name);

  document.getElementById("greeting").innerText = greeting;
});


document.addEventListener("DOMContentLoaded", () => {
  const cabinet = document.querySelector(".cabinet");
  document.querySelectorAll("[data-open-cabinet]").forEach(btn=> btn.addEventListener("click", ()=> cabinet?.classList.toggle("open")));
  document.querySelector("[data-to-creative]")?.addEventListener("click", ()=> location.href="creative.html");
  document.querySelector("[data-to-pro]")?.addEventListener("click", ()=> location.href="index.html");
});

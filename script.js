document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("case-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Case saved locally (demo mode).");
  });

  document.getElementById("view-all-cases").addEventListener("click", () => {
    alert("Viewing all cases (demo mode).");
  });
});

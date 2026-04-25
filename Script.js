function loadNews() {

  const data = JSON.parse(localStorage.getItem("news"));

  if (!data) return;

  document.getElementById("hero-title").textContent = data.main.title || "";

  document.getElementById("breaking-text").textContent = data.breaking;

  document.getElementById("main-news").innerHTML = `
    <h2>${data.main.title}</h2>
    <img src="${data.main.image}">
    <p>${data.main.description}</p>
  `;

  const sidebar = document.getElementById("sidebar-news");
  sidebar.innerHTML = "";

  data.topStories.forEach(story => {
    sidebar.innerHTML += <article><h4>${story.title}</h4></article>;
  });
}

loadNews();

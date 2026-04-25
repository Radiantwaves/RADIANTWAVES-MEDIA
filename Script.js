async function loadNews() {
  const res = await fetch("news.json");
  const data = await res.json();

  // HERO
  document.getElementById("hero-title").textContent = data.main.title;

  // BREAKING
  document.getElementById("breaking-text").textContent = data.breaking;

  // MAIN ARTICLE
  document.getElementById("main-news").innerHTML = `
    <h2>${data.main.title}</h2>
    <img src="${data.main.image}">
    <p>${data.main.description}</p>
  `;

  // SIDEBAR
  const sidebar = document.getElementById("sidebar-news");
  sidebar.innerHTML = "";

  data.topStories.forEach(story => {
    sidebar.innerHTML += `<article><h4>${story.title}</h4></article>`;
  });

  // VIDEO
  const videoSection = document.getElementById("video-section");
  data.videos.forEach(video => {
    videoSection.innerHTML += `
      <h3>${video.title}</h3>
      <iframe src="${video.url}" frameborder="0" allowfullscreen></iframe>
    `;
  });
}

loadNews();

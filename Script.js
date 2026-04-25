const API_KEY = "YOUR_API_KEY_HERE";

const mainNews = document.getElementById("main-news");
const sidebar = document.getElementById("sidebar-news");
const breaking = document.getElementById("breaking-text");

async function loadNews() {
  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=6&apiKey=${API_KEY}`);
    const data = await res.json();

    if (!data.articles) throw new Error("No data");

    // MAIN ARTICLE
    const first = data.articles[0];
    mainNews.innerHTML = `
      <h2>${first.title}</h2>
      <img src="${first.urlToImage || 'assets/placeholder.jpg'}">
      <p>${first.description || ''}</p>
    `;

    // BREAKING TEXT
    breaking.textContent = first.title;

    // SIDEBAR
    sidebar.innerHTML = "";
    data.articles.slice(1).forEach(article => {
      const el = document.createElement("article");
      el.innerHTML = `
        <h4>${article.title}</h4>
      `;
      sidebar.appendChild(el);
    });

  } catch (err) {
    console.error(err);
    breaking.textContent = "Error loading news";
  }
}

loadNews();
setInterval(loadNews, 300000); // refresh every 5 min

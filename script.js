// ===============================
// RADIANT WAVES MEDIA
// COMPLETE SCRIPT.JS
// ===============================

// LOAD JSON NEWS FILE

fetch('news.json?v=' + new Date().getTime())

.then(response => response.json())

.then(newsData => {

  // ===============================
  // HERO SECTION
  // ===============================

  document.getElementById('hero-title').innerText =
  newsData.hero.title;

  document.getElementById('hero-desc').innerText =
  newsData.hero.description;

  // ===============================
  // BREAKING NEWS TICKER
  // ===============================

  const ticker =
  document.getElementById('breaking-ticker');

  ticker.innerHTML =
  newsData.breaking.map(item =>
  ` 🔴 ${item} `
  ).join(" • ");

  // ===============================
  // HERO MARQUEE
  // ===============================

  const heroMarquee =
  document.getElementById('hero-marquee');

  heroMarquee.innerHTML =
  newsData.breaking.map(item =>
  ` 🔴 ${item} `
  ).join(" • ");

  // ===============================
  // FEATURED NEWS
  // ===============================

  const featuredContainer =
  document.getElementById('featured-news');

  if(newsData.featured){

    featuredContainer.innerHTML = `

    <div class="featured-card">

      <img src="${newsData.featured.image}"
      alt="${newsData.featured.title}">

      <div>

        <h2>
          ${newsData.featured.title}
        </h2>

        <p>
          ${newsData.featured.content}
        </p>

      </div>

    </div>

    `;

  }

  // ===============================
  // GENERATE NEWS CARDS
  // ===============================

  function generateNews(sectionId, category){

    const container =
    document.getElementById(sectionId);

    if(!container) return;

    const articles =
    newsData.articles.filter(article =>
    article.category === category
    );

    container.innerHTML =
    articles.map(article => `

    <div class="card">

      <img src="${article.image}"
      alt="${article.title}">

      <div class="card-content">

        <h3>
          ${article.title}
        </h3>

        <p>
          ${article.description}
        </p>

      </div>

    </div>

    `).join("");

  }

  generateNews("world-news", "world");
  generateNews("usa-news", "usa");
  generateNews("europe-news", "europe");
  generateNews("africa-news", "africa");
  generateNews("business-news", "business");
  generateNews("tech-news", "technology");

  // ===============================
  // SPONSORED ADVERTS
  // ===============================

  const advertSection =
  document.getElementById("sponsored-adverts");

  if(newsData.sponsoredAdverts){

    advertSection.innerHTML =
    newsData.sponsoredAdverts.map(ad => `

    <div class="sponsored-ad">

      <div class="sponsored-label">
        SPONSORED ADVERT
      </div>

      <div class="sponsored-content">

        <img src="${ad.image}"
        alt="${ad.title}">

        <div class="sponsored-text">

          <h2>
            ${ad.title}
          </h2>

          <h4>
            ${ad.subtitle || ""}
          </h4>

          <p>
            ${ad.description}
          </p>

          ${
          ad.products
          ?
          ad.products.map(product => `

          <div class="product-line">

            <strong>
              ${product.name}
            </strong>

            <br>

            Big: ${product.big}
            |
            Small: ${product.small}

          </div>

          `).join("")
          :
          ""
          }

        </div>

      </div>

    </div>

    `).join("");

  }

  // ===============================
  // BREAKING NEWS HISTORY
  // ===============================

  const historyContainer =
  document.querySelector(".history-line");

  if(historyContainer && newsData.breakingHistory){

    historyContainer.innerHTML =

    newsData.breakingHistory.map(item => `

    <div class="history-item">

      ${item}

    </div>

    `).join("");

  }

})

// ===============================
// VIDEO UNMUTE SYSTEM
// ===============================

const video =
document.getElementById('heroVideo');

const muteButton =
document.getElementById('mute-button');

if(video){

video.muted = true;

muteButton.addEventListener('click', () => {
soundButton.addEventListener(
"click",

async () => {

try{

video.muted = false;

video.volume = 1.0;

await video.play();

/* FORCE MOBILE AUDIO */

if(video.requestFullscreen){

video.requestFullscreen();

}

soundButton.innerHTML =
"🔊 SOUND ON";

}catch(error){

alert(
"Tap video again to enable sound"
);

}

}
);

// ===============================
// AUTO VIDEO ROTATION
// ===============================

const videos = [

  "assets/video1.mp4",
  "assets/video2.mp4",
  "assets/video3.mp4"

];

let currentVideo = 0;

setInterval(() => {

  currentVideo++;

  if(currentVideo >= videos.length){

    currentVideo = 0;

  }

  if(video){

    video.src = videos[currentVideo];

  }

}, 25000);

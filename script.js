// ======================================
// RADIANT WAVES MEDIA
// FINAL STABLE SCRIPT.JS
// ======================================

// ======================================
// LOAD NEWS JSON
// ======================================

fetch('news.json?v=' + new Date().getTime())

.then(response => response.json())

.then(newsData => {

  // ======================================
  // HERO SECTION
  // ======================================

  const heroTitle =
  document.getElementById("hero-title");

  const heroDesc =
  document.getElementById("hero-desc");

  if(heroTitle){

    heroTitle.innerText =
    newsData.hero.title;

  }

  if(heroDesc){

    heroDesc.innerText =
    newsData.hero.description;

  }

  // ======================================
  // BREAKING NEWS TICKER
  // ======================================

  const ticker =
  document.getElementById("breaking-ticker");

  if(ticker){

    ticker.innerHTML =

    newsData.breaking.map(item =>

    ` 🔴 ${item} `

    ).join(" • ");

  }

  // ======================================
  // HERO MARQUEE
  // ======================================

  const heroMarquee =
  document.getElementById("hero-marquee");

  if(heroMarquee){

    heroMarquee.innerHTML =

    newsData.breaking.map(item =>

    ` 🔴 ${item} `

    ).join(" • ");

  }

  // ======================================
  // FEATURED NEWS
  // ======================================

  const featuredContainer =
  document.getElementById("featured-news");

  if(featuredContainer && newsData.featured){

    featuredContainer.innerHTML = `

    <div class="featured-card">

      <img
      src="${newsData.featured.image}"
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

  // ======================================
  // GENERATE NEWS
  // ======================================

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

      <img
      src="${article.image}"
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

  // ======================================
  // SPONSORED ADVERTS
  // ======================================

  const advertSection =
  document.getElementById("sponsored-adverts");

  if(advertSection && newsData.sponsoredAdverts){

    advertSection.innerHTML =

    newsData.sponsoredAdverts.map(ad => `

    <div class="sponsored-ad">

      <div class="sponsored-label">

        SPONSORED ADVERT

      </div>

      <div class="sponsored-content">

        <img
        src="${ad.image}"
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

  // ======================================
  // BREAKING HISTORY
  // ======================================

  const historyContainer =
  document.getElementById("history-container");

  if(historyContainer && newsData.breakingHistory){

    historyContainer.innerHTML =

    newsData.breakingHistory.map(item => `

    <div class="history-item">

      ${item}

    </div>

    `).join("");

  }

})

.catch(error => {

  console.log(

    "News Loading Error:",

    error

  );

});

// ======================================
// VIDEO SYSTEM
// ======================================

const video =
document.getElementById("heroVideo");

const soundButton =
document.getElementById("sound-button");

const source =
document.getElementById("video-source");

// ======================================
// START VIDEO
// ======================================

if(video){

  video.muted = true;

  video.volume = 1.0;

  video.play().catch(() => {});

}

// ======================================
// ENABLE SOUND
// ======================================

if(soundButton){

  soundButton.addEventListener(

    "click",

    async () => {

      try{

        video.muted = false;

        video.volume = 1.0;

        await video.play();

        soundButton.innerHTML =

        "🔊 SOUND ON";

        soundButton.style.background =

        "green";

      }

      catch(error){

        alert(

        "Browser blocked autoplay sound. Use video controls directly."

        );

      }

    }

  );

}

// ======================================
// VIDEO SWITCH BUTTONS
// ======================================

function changeVideo(videoFile){

  if(video && source){

    /* SAVE SOUND STATE */

    const wasMuted =
    video.muted;

    const currentVolume =
    video.volume;

    /* CHANGE VIDEO */

    source.src = videoFile;

    video.load();

    /* RESTORE SOUND */

    video.muted = wasMuted;

    video.volume = currentVolume;

    video.play()

    .then(() => {

      console.log(
      "Video changed successfully"
      );

    })

    .catch(error => {

      console.log(
      "Video play blocked",
      error
      );

    });

  }

}

let currentVideo = 0;

setInterval(() => {

  currentVideo++;

  if(currentVideo >= videos.length){

    currentVideo = 0;

  }

  changeVideo(videos[currentVideo]);

}, 30000);

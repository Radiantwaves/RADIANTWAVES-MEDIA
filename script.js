// ===============================
// RADIANT WAVES MEDIA
// PROFESSIONAL SCRIPT.JS
// ===============================

// ===============================
// LOAD NEWS JSON
// ===============================

fetch('news.json?v=' + new Date().getTime())

.then(response => response.json())

.then(newsData => {

  // ===============================
  // HERO SECTION
  // ===============================

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

  // ===============================
  // BREAKING TICKER
  // ===============================

  const ticker =
  document.getElementById("breaking-ticker");

  if(ticker){

    ticker.innerHTML =

    newsData.breaking.map(item =>

    ` 🔴 ${item} `

    ).join(" • ");

  }

  // ===============================
  // HERO MARQUEE
  // ===============================

  const heroMarquee =
  document.getElementById("hero-marquee");

  if(heroMarquee){

    heroMarquee.innerHTML =

    newsData.breaking.map(item =>

    ` 🔴 ${item} `

    ).join(" • ");

  }

  // ===============================
  // FEATURED NEWS
  // ===============================

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

  // ===============================
  // GENERATE NEWS
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

  // ===============================
  // SPONSORED ADVERTS
  // ===============================

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

  // ===============================
  // BREAKING HISTORY
  // ===============================

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

// ===============================
// VIDEO SYSTEM
// ===============================

const video =
document.getElementById("heroVideo");

const soundButton =
document.getElementById("sound-button");

const videoSource =
document.getElementById("video-source");

// ===============================
// START VIDEO MUTED
// ===============================

if(video){

  video.muted = true;

  video.volume = 1.0;

  video.play().catch(() => {

    console.log("Autoplay blocked");

  });

}

// ===============================
// ENABLE SOUND
// ===============================

if(video && soundButton){

  soundButton.addEventListener(

    "click",

    async function(){

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

        "Tap the native video controls directly to enable sound."

        );

      }

    }

  );

}

// ===============================
// VIDEO SWITCHER
// ===============================

function changeVideo(videoFile){

  if(video && videoSource){

    video.pause();

    videoSource.src = videoFile;

    video.load();

    video.play().catch(() => {

      console.log("Video switch blocked");

    });

  }

}
/* AUTO VIDEO ROTATION */

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

    /* CHANGE VIDEO */

    video.src = videos[currentVideo];

    /* KEEP SOUND ACTIVE */

    video.muted = false;

    video.volume = 1.0;

    /* RELOAD VIDEO */

    video.load();

    /* PLAY VIDEO */

    video.play()

    .then(() => {

      muteButton.innerHTML =
      "🔊 SOUND ON";

      muteButton.style.background =
      "green";

    })

    .catch(() => {

      /* FALLBACK */

      video.muted = true;

      video.play();

      muteButton.innerHTML =
      "🔇 TAP FOR SOUND";

      muteButton.style.background =
      "red";

    });

  }

}, 25000);

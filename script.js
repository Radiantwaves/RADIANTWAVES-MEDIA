// ============================================================
// RADIANT WAVES MEDIA
// COMPLETE NEWS + AUTOMATIC IMAGE SYSTEM
// ============================================================


// ============================================================
// SETTINGS
// ============================================================

const NEWS_FILE =
  "news.json?v=" + Date.now();

const WIKIMEDIA_API =
  "https://commons.wikimedia.org/w/api.php";


// ============================================================
// IMAGE CACHE
// ============================================================

const IMAGE_CACHE_KEY =
  "radiantwaves_image_cache_v1";

let imageCache = {};

try {

  imageCache =
    JSON.parse(
      localStorage.getItem(IMAGE_CACHE_KEY) || "{}"
    );

} catch(error) {

  imageCache = {};

}


// ============================================================
// SAVE IMAGE CACHE
// ============================================================

function saveImageCache(){

  try{

    localStorage.setItem(
      IMAGE_CACHE_KEY,
      JSON.stringify(imageCache)
    );

  }catch(error){

    console.log(
      "Image cache could not be saved."
    );

  }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value){

  if(value === undefined || value === null){

    return "";

  }

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


// ============================================================
// FALLBACK IMAGE
// ============================================================

function fallbackImage(title = "Radiant Waves Media"){

  const safeTitle =
    String(title)
      .replace(/[<>&"]/g, "")
      .substring(0, 80);

  const svg = `

  <svg
  xmlns="http://www.w3.org/2000/svg"
  width="1200"
  height="700"
  viewBox="0 0 1200 700">

    <defs>

      <linearGradient
      id="bg"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%">

        <stop
        offset="0%"
        stop-color="#07111f"/>

        <stop
        offset="100%"
        stop-color="#123d63"/>

      </linearGradient>

    </defs>

    <rect
    width="1200"
    height="700"
    fill="url(#bg)"/>

    <circle
    cx="1000"
    cy="100"
    r="180"
    fill="rgba(255,255,255,0.08)"/>

    <text
    x="70"
    y="100"
    fill="white"
    font-size="30"
    font-family="Arial"
    font-weight="bold">

      RADIANT WAVES MEDIA

    </text>

    <text
    x="70"
    y="350"
    fill="white"
    font-size="48"
    font-family="Arial"
    font-weight="bold">

      ${safeTitle}

    </text>

    <text
    x="70"
    y="430"
    fill="#d7e8f5"
    font-size="25"
    font-family="Arial">

      Gateway To Your World News

    </text>

  </svg>

  `;

  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg);

}


// ============================================================
// AUTOMATIC WIKIMEDIA IMAGE SEARCH
// ============================================================

async function findAutomaticImage(query, title){

  if(!query){

    return fallbackImage(title);

  }


  const cacheKey =
    query.toLowerCase().trim();


  // USE CACHE FIRST

  if(imageCache[cacheKey]){

    return imageCache[cacheKey];

  }


  try{

    const url =

      WIKIMEDIA_API +

      "?action=query" +

      "&generator=search" +

      "&gsrsearch=" +
      encodeURIComponent(query) +

      "&gsrnamespace=6" +

      "&gsrlimit=8" +

      "&prop=imageinfo" +

      "&iiprop=url" +

      "&iiurlwidth=1000" +

      "&format=json" +

      "&origin=*";


    const response =
      await fetch(url);


    if(!response.ok){

      throw new Error(
        "Wikimedia request failed"
      );

    }


    const data =
      await response.json();


    if(
      !data.query ||
      !data.query.pages
    ){

      return fallbackImage(title);

    }


    const pages =
      Object.values(
        data.query.pages
      );


    for(const page of pages){

      if(
        page.imageinfo &&
        page.imageinfo[0]
      ){

        const info =
          page.imageinfo[0];


        const imageURL =
          info.thumburl ||
          info.url;


        if(imageURL){

          imageCache[cacheKey] =
            imageURL;

          saveImageCache();

          return imageURL;

        }

      }

    }


  }catch(error){

    console.log(
      "Automatic image search failed:",
      error
    );

  }


  return fallbackImage(title);

}


// ============================================================
// GET IMAGE
// ============================================================

async function getImage(imageData, title){

  // OLD FORMAT
  //
  // "image": "assets/nigeria.jpeg"

  if(typeof imageData === "string"){

    return imageData;

  }


  // NEW FORMAT
  //
  // "image": {
  //   "type": "auto",
  //   "query": "...",
  //   "alt": "..."
  // }

  if(
    imageData &&
    imageData.type === "auto"
  ){

    return await findAutomaticImage(
      imageData.query,
      title
    );

  }


  return fallbackImage(title);

}


// ============================================================
// SAFE IMAGE LOADING
// ============================================================

function imageWithFallback(
  imageURL,
  title,
  alt
){

  const fallback =
    fallbackImage(title);


  return `

    <img
      src="${escapeHTML(imageURL)}"
      alt="${escapeHTML(alt || title)}"
      loading="lazy"
      onerror="this.onerror=null;this.src='${fallback}'"
    >

  `;

}


// ============================================================
// LOAD NEWS JSON
// ============================================================

fetch(NEWS_FILE)

.then(response => {

  if(!response.ok){

    throw new Error(
      "Could not load news.json"
    );

  }

  return response.json();

})

.then(async newsData => {


  // ==========================================================
  // HERO
  // ==========================================================

  const heroTitle =
    document.getElementById("hero-title");

  const heroDesc =
    document.getElementById("hero-desc");


  if(heroTitle){

    heroTitle.innerText =
      newsData.hero?.title ||
      "Radiant Waves Media";

  }


  if(heroDesc){

    heroDesc.innerText =
      newsData.hero?.description ||
      "";

  }


  // ==========================================================
  // BREAKING TICKER
  // ==========================================================

  const ticker =
    document.getElementById(
      "breaking-ticker"
    );


  if(
    ticker &&
    Array.isArray(newsData.breaking)
  ){

    ticker.innerHTML =

      newsData.breaking

      .map(item =>
        ` 🔴 ${escapeHTML(item)} `
      )

      .join(" • ");

  }


  // ==========================================================
  // HERO MARQUEE
  // ==========================================================

  const heroMarquee =
    document.getElementById(
      "hero-marquee"
    );


  if(
    heroMarquee &&
    Array.isArray(newsData.breaking)
  ){

    heroMarquee.innerHTML =

      newsData.breaking

      .map(item =>
        ` 🔴 ${escapeHTML(item)} `
      )

      .join(" • ");

  }


  // ==========================================================
  // FEATURED NEWS
  // ==========================================================

  const featuredContainer =
    document.getElementById(
      "featured-news"
    );


  if(
    featuredContainer &&
    newsData.featured
  ){

    const featuredImage =
      await getImage(
        newsData.featured.image,
        newsData.featured.title
      );


    featuredContainer.innerHTML = `

      <div class="featured-card">

        ${imageWithFallback(
          featuredImage,
          newsData.featured.title,
          newsData.featured.image?.alt
        )}

        <div>

          <h2>
            ${escapeHTML(
              newsData.featured.title
            )}
          </h2>

          <p>
            ${escapeHTML(
              newsData.featured.content
            )}
          </p>

        </div>

      </div>

    `;

  }


  // ==========================================================
  // GENERATE NEWS
  // ==========================================================

  async function generateNews(
    sectionId,
    category
  ){

    const container =
      document.getElementById(
        sectionId
      );


    if(!container){

      return;

    }


    const articles =
      Array.isArray(newsData.articles)

      ?

      newsData.articles.filter(
        article =>
          article.category === category
      )

      :

      [];


    if(!articles.length){

      container.innerHTML = "";

      return;

    }


    // BUILD IMAGES

    const cards =
      await Promise.all(

        articles.map(
          async article => {

            const imageURL =
              await getImage(
                article.image,
                article.title
              );


            const alt =
              typeof article.image === "object"

              ?

              article.image.alt

              :

              article.title;


            return `

              <div class="card">

                ${imageWithFallback(
                  imageURL,
                  article.title,
                  alt
                )}

                <div class="card-content">

                  <h3>
                    ${escapeHTML(
                      article.title
                    )}
                  </h3>

                  <p>
                    ${escapeHTML(
                      article.description
                    )}
                  </p>

                </div>

              </div>

            `;

          }

        )

      );


    container.innerHTML =
      cards.join("");

  }


  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

  await generateNews(
    "world-news",
    "world"
  );


  await generateNews(
    "usa-news",
    "usa"
  );


  await generateNews(
    "europe-news",
    "europe"
  );


  await generateNews(
    "africa-news",
    "africa"
  );


  await generateNews(
    "business-news",
    "business"
  );


  await generateNews(
    "tech-news",
    "technology"
  );


  // ==========================================================
  // SPONSORED ADVERTS
  // ==========================================================

  const advertSection =
    document.getElementById(
      "sponsored-adverts"
    );


  if(
    advertSection &&
    Array.isArray(
      newsData.sponsoredAdverts
    )
  ){

    advertSection.innerHTML =

      newsData.sponsoredAdverts

      .map(ad => `

        <div class="sponsored-ad">

          <div class="sponsored-label">
            SPONSORED ADVERT
          </div>

          <div class="sponsored-content">

            <img
              src="${escapeHTML(ad.image)}"
              alt="${escapeHTML(ad.title)}"
              loading="lazy"
            >

            <div class="sponsored-text">

              <h2>
                ${escapeHTML(ad.title)}
              </h2>

              <h4>
                ${escapeHTML(
                  ad.subtitle || ""
                )}
              </h4>

              <p>
                ${escapeHTML(
                  ad.description
                )}
              </p>

              ${
                Array.isArray(ad.products)

                ?

                ad.products.map(
                  product => `

                    <div class="product-line">

                      <strong>
                        ${escapeHTML(
                          product.name
                        )}
                      </strong>

                      <br>

                      Big:
                      ${escapeHTML(
                        product.big
                      )}

                      |

                      Small:
                      ${escapeHTML(
                        product.small
                      )}

                    </div>

                  `
                ).join("")

                :

                ""

              }

            </div>

          </div>

        </div>

      `)

      .join("");

  }


  // ==========================================================
  // BREAKING HISTORY
  // ==========================================================

  const historyContainer =
    document.getElementById(
      "history-container"
    );


  if(
    historyContainer &&
    Array.isArray(
      newsData.breakingHistory
    )
  ){

    historyContainer.innerHTML =

      newsData.breakingHistory

      .map(item => `

        <div class="history-item">

          ${escapeHTML(item)}

        </div>

      `)

      .join("");

  }


  // ==========================================================
  // TOP STORIES
  // ==========================================================

  const topStoriesContainer =
    document.getElementById(
      "top-stories-container"
    );


  if(
    topStoriesContainer &&
    Array.isArray(
      newsData.topStories
    )
  ){

    const stories =
      await Promise.all(

        newsData.topStories.map(
          async story => {

            const imageURL =
              await getImage(
                story.image,
                story.title
              );


            const alt =
              typeof story.image === "object"

              ?

              story.image.alt

              :

              story.title;


            return `

              <div class="card">

                ${imageWithFallback(
                  imageURL,
                  story.title,
                  alt
                )}

                <div class="card-content">

                  <h3>
                    ${escapeHTML(
                      story.title
                    )}
                  </h3>

                  <p>
                    ${escapeHTML(
                      story.description
                    )}
                  </p>

                </div>

              </div>

            `;

          }

        )

      );


    topStoriesContainer.innerHTML =
      stories.join("");

  }

})

.catch(error => {

  console.error(
    "Radiant Waves News Loading Error:",
    error
  );

});


// ============================================================
// VIDEO SYSTEM
// ============================================================

const video =
  document.getElementById(
    "heroVideo"
  );


const videoSource =
  document.getElementById(
    "video-source"
  );


// ============================================================
// VIDEO PLAY
// ============================================================

if(video){

  video.play().catch(() => {

    console.log(
      "Autoplay waiting for user interaction"
    );

  });

}


// ============================================================
// VIDEO SWITCHER
// ============================================================

function changeVideo(videoFile){

  if(
    video &&
    videoSource
  ){

    video.pause();

    videoSource.src =
      videoFile;

    video.load();

    video.play().catch(() => {

      console.log(
        "Video play blocked until user interaction"
      );

    });

  }

}


// ============================================================
// AUTO VIDEO ROTATION
// ============================================================

const videos = [

  "assets/video1.mp4",

  "assets/video2.mp4",

  "assets/video3.mp4"

];


let currentVideo = 0;


setInterval(() => {

  currentVideo++;


  if(
    currentVideo >=
    videos.length
  ){

    currentVideo = 0;

  }


  changeVideo(
    videos[currentVideo]
  );


}, 30000);

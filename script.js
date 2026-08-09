// ============================================================
// RADIANT WAVES MEDIA
// COMPLETE SCRIPT.JS
// AUTOMATIC NEWS IMAGE SYSTEM
// VERSION 3000
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const NEWS_FILE = "news.json?v=" + Date.now();

  const WIKIMEDIA_API =
    "https://commons.wikimedia.org/w/api.php";

  const IMAGE_SEARCH_LIMIT = 6;

  // ==========================================================
  // SAFE HTML FUNCTION
  // ==========================================================

  function escapeHTML(value) {

    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  // ==========================================================
  // CATEGORY LABEL
  // ==========================================================

  function categoryName(category) {

    if (!category) {
      return "World News";
    }

    const names = {

      world: "World News",

      usa: "USA",

      europe: "Europe",

      africa: "Africa",

      business: "Business",

      technology: "Technology",

      asia: "Asia"

    };

    return names[category] || category;

  }

  // ==========================================================
  // FALLBACK IMAGE
  // ==========================================================

  function fallbackImage(category) {

    const text =
      encodeURIComponent(
        "RADIANT WAVES MEDIA • " +
        categoryName(category)
      );

    return (
      "https://dummyimage.com/1200x700/111111/ffffff" +
      "?text=" +
      text
    );

  }

  // ==========================================================
  // WIKIMEDIA IMAGE SEARCH
  // ==========================================================

  async function findWikimediaImage(query) {

    if (!query || !query.trim()) {

      return {
        url: null,
        title: "",
        source: ""
      };

    }

    try {

      const params = new URLSearchParams({

        action: "query",

        generator: "search",

        gsrsearch:
          query +
          " filetype:bitmap",

        gsrnamespace: "6",

        gsrlimit:
          String(IMAGE_SEARCH_LIMIT),

        prop:
          "imageinfo",

        iiprop:
          "url|mime|extmetadata",

        iiurlwidth:
          "1200",

        format:
          "json",

        origin:
          "*"

      });

      const response =
        await fetch(
          WIKIMEDIA_API +
          "?" +
          params.toString()
        );

      if (!response.ok) {

        throw new Error(
          "Wikimedia request failed"
        );

      }

      const data =
        await response.json();

      if (
        !data.query ||
        !data.query.pages
      ) {

        return {
          url: null,
          title: "",
          source: ""
        };

      }

      const pages =
        Object.values(
          data.query.pages
        );

      // ------------------------------------------------------
      // Find the first useful image
      // ------------------------------------------------------

      for (const page of pages) {

        if (
          !page.imageinfo ||
          !page.imageinfo[0]
        ) {
          continue;
        }

        const info =
          page.imageinfo[0];

        const mime =
          info.mime || "";

        if (
          !mime.startsWith("image/")
        ) {
          continue;
        }

        const imageURL =
          info.thumburl ||
          info.url;

        if (!imageURL) {
          continue;
        }

        const metadata =
          info.extmetadata || {};

        const artist =
          metadata.Artist &&
          metadata.Artist.value
            ? metadata.Artist.value
            : "";

        const credit =
          metadata.Credit &&
          metadata.Credit.value
            ? metadata.Credit.value
            : "";

        return {

          url: imageURL,

          title:
            page.title || "",

          source:
            artist ||
            credit ||
            "Wikimedia Commons"

        };

      }

    }

    catch (error) {

      console.log(
        "Automatic image search error:",
        error
      );

    }

    return {

      url: null,

      title: "",

      source: ""

    };

  }

  // ==========================================================
  // CREATE AUTOMATIC IMAGE
  // ==========================================================

  async function getNewsImage(article) {

    // --------------------------------------------------------
    // 1. Use local image if explicitly supplied
    // --------------------------------------------------------

    if (
      article.image &&
      article.image.trim()
    ) {

      return {

        url:
          article.image,

        source:
          "Radiant Waves Media"

      };

    }

    // --------------------------------------------------------
    // 2. Search Wikimedia using imageQuery
    // --------------------------------------------------------

    if (
      article.imageQuery &&
      article.imageQuery.trim()
    ) {

      const result =
        await findWikimediaImage(
          article.imageQuery
        );

      if (result.url) {

        return {

          url:
            result.url,

          source:
            result.source ||
            "Wikimedia Commons"

        };

      }

    }

    // --------------------------------------------------------
    // 3. Use branded fallback
    // --------------------------------------------------------

    return {

      url:
        fallbackImage(
          article.category
        ),

      source:
        "Radiant Waves Media"

    };

  }

  // ==========================================================
  // CREATE NEWS IMAGE HTML
  // ==========================================================

  async function createNewsImage(
    article,
    className = "news-image"
  ) {

    const image =
      await getNewsImage(article);

    const title =
      escapeHTML(
        article.title ||
        "Radiant Waves Media"
      );

    return `

      <div class="automatic-image-wrapper">

        <div class="image-loading">
          Loading image...
        </div>

        <img
          class="${className}"
          src="${escapeHTML(image.url)}"
          alt="${title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${fallbackImage(article.category)}';"
          style="display:block;"
        >

      </div>

    `;

  }

  // ==========================================================
  // LOAD NEWS JSON
  // ==========================================================

  fetch(NEWS_FILE)

    .then(function (response) {

      if (!response.ok) {

        throw new Error(
          "Unable to load news.json"
        );

      }

      return response.json();

    })

    .then(async function (newsData) {

      console.log(
        "Radiant Waves news loaded successfully."
      );

      // ======================================================
      // HERO
      // ======================================================

      const heroTitle =
        document.getElementById(
          "hero-title"
        );

      const heroDesc =
        document.getElementById(
          "hero-desc"
        );

      if (
        heroTitle &&
        newsData.hero
      ) {

        heroTitle.innerText =
          newsData.hero.title ||
          "Radiant Waves Media";

      }

      if (
        heroDesc &&
        newsData.hero
      ) {

        heroDesc.innerText =
          newsData.hero.description ||
          "";

      }

      // ======================================================
      // BREAKING TICKER
      // ======================================================

      const ticker =
        document.getElementById(
          "breaking-ticker"
        );

      if (
        ticker &&
        Array.isArray(
          newsData.breaking
        )
      ) {

        ticker.innerHTML =

          newsData.breaking

            .map(function (item) {

              return `
                🔴 ${escapeHTML(item)}
              `;

            })

            .join(" • ");

      }

      // ======================================================
      // HERO MARQUEE
      // ======================================================

      const heroMarquee =
        document.getElementById(
          "hero-marquee"
        );

      if (
        heroMarquee &&
        Array.isArray(
          newsData.breaking
        )
      ) {

        heroMarquee.innerHTML =

          newsData.breaking

            .map(function (item) {

              return `
                🔴 ${escapeHTML(item)}
              `;

            })

            .join(" • ");

      }

      // ======================================================
      // FEATURED NEWS
      // ======================================================

      const featuredContainer =
        document.getElementById(
          "featured-news"
        );

      if (
        featuredContainer &&
        newsData.featured
      ) {

        const featured =
          newsData.featured;

        let imageURL =
          featured.image;

        // If featured image is missing,
        // search automatically.

        if (
          !imageURL &&
          featured.imageQuery
        ) {

          const result =
            await findWikimediaImage(
              featured.imageQuery
            );

          imageURL =
            result.url;

        }

        if (!imageURL) {

          imageURL =
            fallbackImage(
              "world"
            );

        }

        featuredContainer.innerHTML = `

          <div class="featured-card">

            <div class="automatic-image-wrapper">

              <img
                src="${escapeHTML(imageURL)}"
                alt="${escapeHTML(featured.title)}"
                loading="lazy"
                style="display:block;"
                onerror="this.onerror=null;this.src='${fallbackImage("world")}';"
              >

            </div>

            <div>

              <span class="news-category">
                FEATURED
              </span>

              <h2>
                ${escapeHTML(featured.title)}
              </h2>

              <p>
                ${escapeHTML(featured.content)}
              </p>

            </div>

          </div>

        `;

      }

      // ======================================================
      // GENERATE NEWS
      // ======================================================

      async function generateNews(
        sectionId,
        category
      ) {

        const container =
          document.getElementById(
            sectionId
          );

        if (!container) {
          return;
        }

        const articles =
          Array.isArray(
            newsData.articles
          )

            ? newsData.articles.filter(
                function (article) {

                  return (
                    article.category ===
                    category
                  );

                }
              )

            : [];

        if (
          articles.length === 0
        ) {

          container.innerHTML = `

            <div class="card">

              <div class="card-content">

                <h3>
                  No ${escapeHTML(
                    categoryName(category)
                  )} stories available.
                </h3>

              </div>

            </div>

          `;

          return;

        }

        // ----------------------------------------------------
        // Generate images one article at a time
        // ----------------------------------------------------

        const cards = [];

        for (
          const article of articles
        ) {

          const imageHTML =
            await createNewsImage(
              article
            );

          cards.push(`

            <article class="card">

              ${imageHTML}

              <div class="card-content">

                <span class="news-category">

                  ${escapeHTML(
                    categoryName(
                      article.category
                    )
                  )}

                </span>

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

            </article>

          `);

        }

        container.innerHTML =
          cards.join("");

      }

      // ======================================================
      // LOAD CATEGORIES
      // ======================================================

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

      // ======================================================
      // SPONSORED ADVERTS
      // IMPORTANT:
      // These continue using your fixed local images.
      // ======================================================

      const advertContainer =
        document.getElementById(
          "sponsored-adverts"
        );

      if (
        advertContainer &&
        Array.isArray(
          newsData.sponsoredAdverts
        )
      ) {

        advertContainer.innerHTML =

          newsData.sponsoredAdverts

            .map(function (ad) {

              const products =
                Array.isArray(
                  ad.products
                )

                  ? ad.products

                  : [];

              return `

                <div class="sponsored-ad">

                  <div class="sponsored-label">

                    SPONSORED ADVERT

                  </div>

                  <div class="sponsored-content">

                    <img
                      src="${escapeHTML(
                        ad.image
                      )}"
                      alt="${escapeHTML(
                        ad.title
                      )}"
                      loading="lazy"
                      onerror="this.onerror=null;this.src='${fallbackImage("world")}';"
                    >

                    <div class="sponsored-text">

                      <h2>

                        ${escapeHTML(
                          ad.title
                        )}

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

                        products

                          .map(
                            function (product) {

                              return `

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

                              `;

                            }
                          )

                          .join("")

                      }

                    </div>

                  </div>

                </div>

              `;

            })

            .join("");

      }

      // ======================================================
      // BREAKING NEWS HISTORY
      // ======================================================

      const historyContainer =
        document.getElementById(
          "history-container"
        );

      if (
        historyContainer &&
        Array.isArray(
          newsData.breakingHistory
        )
      ) {

        historyContainer.innerHTML =

          newsData.breakingHistory

            .map(function (item) {

              return `

                <div class="history-item">

                  ${escapeHTML(item)}

                </div>

              `;

            })

            .join("");

      }

      // ======================================================
      // TOP STORIES
      // ======================================================

      const topStoriesContainer =
        document.getElementById(
          "top-stories-container"
        );

      if (
        topStoriesContainer &&
        Array.isArray(
          newsData.topStories
        )
      ) {

        const stories = [];

        for (
          const story
          of newsData.topStories
        ) {

          const image =
            await getNewsImage(
              story
            );

          stories.push(`

            <article class="card">

              <div class="automatic-image-wrapper">

                <img
                  src="${escapeHTML(image.url)}"
                  alt="${escapeHTML(story.title)}"
                  loading="lazy"
                  style="display:block;"
                  onerror="this.onerror=null;this.src='${fallbackImage("world")}';"
                >

              </div>

              <div class="card-content">

                <span class="news-category">

                  TOP STORY

                </span>

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

            </article>

          `);

        }

        topStoriesContainer.innerHTML =
          stories.join("");

      }

    })

    .catch(function (error) {

      console.error(
        "Radiant Waves News Loading Error:",
        error
      );

      // ------------------------------------------------------
      // Show useful message instead of blank website
      // ------------------------------------------------------

      const containers = [

        "world-news",

        "usa-news",

        "europe-news",

        "africa-news",

        "business-news",

        "tech-news"

      ];

      containers.forEach(
        function (id) {

          const container =
            document.getElementById(id);

          if (!container) {
            return;
          }

          container.innerHTML = `

            <div class="card">

              <div class="card-content">

                <h3>
                  News temporarily unavailable
                </h3>

                <p>
                  Please refresh the page.
                  Radiant Waves Media is
                  updating the newsroom.
                </p>

              </div>

            </div>

          `;

        }
      );

    });

  // ==========================================================
  // VIDEO SYSTEM
  // ==========================================================

  const video =
    document.getElementById(
      "heroVideo"
    );

  const videoSource =
    document.getElementById(
      "video-source"
    );

  const soundButton =
    document.getElementById(
      "sound-button"
    );

  // ==========================================================
  // START VIDEO MUTED
  // ==========================================================

  if (video) {

    video.muted = true;

    video.volume = 1.0;

    video.play().catch(
      function () {

        console.log(
          "Autoplay waiting for user interaction."
        );

      }
    );

  }

  // ==========================================================
  // SOUND BUTTON
  // ==========================================================

  if (
    soundButton &&
    video
  ) {

    soundButton.addEventListener(
      "click",
      async function () {

        try {

          video.muted = false;

          video.volume = 1.0;

          await video.play();

          soundButton.innerHTML =
            "🔊 SOUND ON";

          soundButton.style.background =
            "green";

        }

        catch (error) {

          console.log(
            "Unable to enable sound:",
            error
          );

          alert(
            "Please use the video controls to enable sound."
          );

        }

      }
    );

  }

  // ==========================================================
  // CHANGE VIDEO
  // ==========================================================

  window.changeVideo =
    function (videoFile) {

      if (
        !video ||
        !videoSource
      ) {

        return;

      }

      video.pause();

      videoSource.src =
        videoFile;

      video.load();

      video.play().catch(
        function () {

          console.log(
            "Video play requires user interaction."
          );

        }
      );

    };

  // ==========================================================
  // AUTOMATIC VIDEO ROTATION
  // ==========================================================

  const videos = [

    "assets/video1.mp4",

    "assets/video2.mp4",

    "assets/video3.mp4"

  ];

  let currentVideo = 0;

  setInterval(
    function () {

      if (!video) {
        return;
      }

      currentVideo++;

      if (
        currentVideo >=
        videos.length
      ) {

        currentVideo = 0;

      }

      window.changeVideo(
        videos[currentVideo]
      );

    },
    30000
  );

});

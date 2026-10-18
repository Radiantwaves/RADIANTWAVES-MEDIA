
/* ==========================================================
   RADIANTWAVES MEDIA
   Complete newsroom functionality
   File: script.js
   ========================================================== */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json";
  const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";

  const $ = (id) => document.getElementById(id);
  const imageCache = new Map();

  const CATEGORY_NAMES = {
    world: "World News",
    usa: "USA News",
    europe: "Europe News",
    africa: "Africa News",
    asia: "Asia News",
    business: "Business News",
    technology: "Technology News"
  };

  const CATEGORY_SECTIONS = [
    ["world-news", "world"],
    ["usa-news", "usa"],
    ["europe-news", "europe"],
    ["africa-news", "africa"],
    ["asia-news", "asia"],
    ["business-news", "business"],
    ["tech-news", "technology"]
  ];

  /* -------------------- SAFE TEXT -------------------- */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function categoryName(category) {
    return CATEGORY_NAMES[String(category || "world").toLowerCase()]
      || "World News";
  }

  function safeImageURL(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const url = value.trim();

    if (/^https?:\/\//i.test(url)) return url;
    if (/^(?:\.\/|\.\.\/|assets\/)/i.test(url)) return url;

    return "";
  }

  function safeLink(value) {
    const url = String(value || "#").trim();

    if (/^(https?:\/\/|mailto:|tel:|#|\.\/|\.\.\/)/i.test(url)) {
      return url;
    }

    return "#";
  }

  function fallbackImage(category = "world") {
    const label = encodeURIComponent(
      `RADIANTWAVES MEDIA - ${categoryName(category)}`
    );

    return `https://dummyimage.com/1200x700/151515/f4f4f4&text=${label}`;
  }

  function plainText(value) {
    const element = document.createElement("div");
    element.innerHTML = String(value ?? "");
    return (element.textContent || "").trim();
  }

  /* -------------------- IMAGE LOOKUP -------------------- */

  async function findWikimediaImage(query) {
    const searchTerm = String(query || "").trim();

    if (!searchTerm) return null;

    const cacheKey = searchTerm.toLowerCase();

    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }

    const request = (async () => {
      try {
        const params = new URLSearchParams({
          action: "query",
          generator: "search",
          gsrsearch: `${searchTerm} filetype:bitmap`,
          gsrnamespace: "6",
          gsrlimit: "6",
          prop: "imageinfo",
          iiprop: "url|mime",
          iiurlwidth: "1200",
          format: "json",
          origin: "*"
        });

        const response = await fetch(
          `${WIKIMEDIA_API}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Image search request failed.");
        }

        const data = await response.json();
        const pages = Object.values(data?.query?.pages || {});

        for (const page of pages) {
          const info = page?.imageinfo?.[0];

          if (!info || !String(info.mime || "").startsWith("image/")) {
            continue;
          }

          const url = info.thumburl || info.url;

          if (url && /^https?:\/\//i.test(url)) {
            return url;
          }
        }
      } catch (error) {
        console.warn("Image lookup unavailable:", error);
      }

      return null;
    })();

    imageCache.set(cacheKey, request);

    return request;
  }

  async function resolveImage(item, category = "world") {
    const suppliedImage = safeImageURL(item?.image);

    if (suppliedImage) {
      return suppliedImage;
    }

    const searchImage = await findWikimediaImage(item?.imageQuery);

    return searchImage || fallbackImage(category);
  }

  function imageMarkup(url, alt, className, category = "world") {
    const safeURL = safeImageURL(url) || fallbackImage(category);

    return `
      <div class="news-image-wrap">
        <img
          class="${escapeHTML(className || "news-image")}"
          src="${escapeHTML(safeURL)}"
          alt="${escapeHTML(alt || "RadiantWaves Media news image")}"
          loading="lazy"
          decoding="async"
          data-fallback="${escapeHTML(fallbackImage(category))}">
      </div>
    `;
  }

  function wireImageFallbacks(root = document) {
    root.querySelectorAll("img[data-fallback]").forEach((img) => {
      if (img.dataset.fallbackReady === "true") return;

      img.dataset.fallbackReady = "true";

      img.addEventListener("error", () => {
        const fallback = img.dataset.fallback;

        if (fallback && img.src !== fallback) {
          img.src = fallback;
          delete img.dataset.fallback;
        }
      });
    });
  }

  /* -------------------- EMPTY AND ERROR STATES -------------------- */

  function showMessage(container, title, message) {
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <strong>${escapeHTML(title)}</strong>
        ${message ? `<p>${escapeHTML(message)}</p>` : ""}
      </div>
    `;
  }

  /* -------------------- BREAKING NEWS AND TEXT -------------------- */

  function renderTextSections(data) {
    const editionDate = [data.edition, data.date]
      .filter(Boolean)
      .join(" · ");

    if ($("edition-date")) {
      $("edition-date").textContent = editionDate || "GLOBAL NEWSROOM";
    }

    if ($("hero-title")) {
      $("hero-title").textContent =
        data.hero?.title || "Global Breaking News";
    }

    if ($("hero-desc")) {
      $("hero-desc").textContent =
        data.hero?.description ||
        "Reports and perspectives from around the world.";
    }

    if ($("morning-summary")) {
      $("morning-summary").textContent =
        data.morningSummary ||
        "Our newsroom is following important developments around the world.";
    }

    if ($("editorial-note")) {
      $("editorial-note").textContent =
        data.editorialNote ||
        "Developing stories may change as new information becomes available.";
    }

    if ($("big-question")) {
      $("big-question").textContent =
        data.bigQuestion ||
        "What should leaders prioritise, and how should citizens measure progress?";
    }

    if ($("quote-of-the-day")) {
      const quote = String(
        data.quoteOfTheDay ||
        "An informed public is better equipped to ask meaningful questions."
      ).replace(/[“”]/g, "");

      $("quote-of-the-day").textContent = `“${quote}”`;
    }

    const breaking = Array.isArray(data.breaking)
      ? data.breaking.filter(Boolean)
      : [];

    const tickerItems = breaking.length
      ? breaking
      : ["Welcome to RadiantWaves Media — connecting you to the world."];

    const tickerHTML = tickerItems
      .map((item) =>
        `<span class="ticker-item">${escapeHTML(item)}</span>`
      )
      .join("");

    if ($("breaking-ticker")) {
      $("breaking-ticker").innerHTML = tickerHTML + tickerHTML;
    }

    if ($("hero-marquee")) {
      $("hero-marquee").innerHTML = tickerItems
        .map((item) => escapeHTML(item))
        .join(" ◆ ");
    }

    const history = Array.isArray(data.breakingHistory)
      ? data.breakingHistory
      : [];

    if ($("history-container")) {
      if (!history.length) {
        showMessage(
          $("history-container"),
          "No breaking briefs available",
          "Check back for future newsroom updates."
        );
      } else {
        $("history-container").innerHTML = history
          .map((item) => {
            const title = typeof item === "string"
              ? item
              : item?.title || item?.headline || "News update";

            const summary = typeof item === "string"
              ? ""
              : item?.summary || item?.description || item?.content || "";

            const date = typeof item === "object"
              ? item?.date || ""
              : "";

            return `
              <article class="history-item">
                ${date
                  ? `<span class="history-date">${escapeHTML(date)}</span>`
                  : ""}
                <h3>${escapeHTML(title)}</h3>
                ${summary ? `<p>${escapeHTML(summary)}</p>` : ""}
              </article>
            `;
          })
          .join("");
      }
    }
  }

  /* -------------------- FEATURED STORY -------------------- */

  async function renderFeatured(data) {
    const container = $("featured-news");
    const featured = data.featured;

    if (!container) return;

    if (!featured || !featured.title) {
      container.innerHTML = "";
      return;
    }

    const image = await resolveImage(featured, "world");

    container.innerHTML = `
      <article class="featured-story">
        <div class="featured-image-wrap">
          ${imageMarkup(
            image,
            featured.title,
            "featured-image",
            "world"
          )}
        </div>

        <div class="featured-copy">
          <span class="featured-label">Editor's Pick</span>

          <h2>${escapeHTML(featured.title)}</h2>

          <p>${escapeHTML(
            featured.summary ||
            featured.description ||
            featured.content ||
            "More information will be added as this story develops."
          )}</p>

          <span class="news-meta">RadiantWaves Media newsroom</span>
        </div>
      </article>
    `;

    wireImageFallbacks(container);
  }

  /* -------------------- NEWS ARTICLE CARDS -------------------- */

  function makeNewsCard(article, image, category) {
    const title = article?.title || "News update";

    const summary =
      article?.summary ||
      article?.description ||
      article?.content ||
      "More information will be added as the story develops.";

    const source = article?.source
      ? `<span>Source: ${escapeHTML(article.source)}</span>`
      : "";

    const date = article?.date
      ? `<span>${escapeHTML(article.date)}</span>`
      : "";

    const link = safeLink(article?.url || article?.link);

    const readMore = link !== "#"
      ? `<a class="news-link" href="${escapeHTML(link)}"
           target="_blank" rel="noopener noreferrer">
           Read more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
         </a>`
      : "";

    return `
      <article class="news-card">
        ${imageMarkup(image, title, "news-image", category)}

        <div class="news-card-body">
          <div class="news-meta">
            <span class="news-category">${escapeHTML(categoryName(category))}</span>
            ${date}
          </div>

          <h3>${escapeHTML(title)}</h3>

          <p>${escapeHTML(summary)}</p>

          ${source ? `<div class="news-meta">${source}</div>` : ""}

          ${readMore}
        </div>
      </article>
    `;
  }

  async function renderArticleSection(data, sectionId, category) {
    const container = $(sectionId);

    if (!container) return;

    const articles = Array.isArray(data.articles)
      ? data.articles.filter(
          (article) =>
            String(article?.category || "").toLowerCase() === category
        )
      : [];

    if (!articles.length) {
      showMessage(
        container,
        `No ${categoryName(category)} stories yet`,
        "Please check back for the next newsroom update."
      );
      return;
    }

    container.innerHTML = `
      <div class="loading-state">
        Loading ${escapeHTML(categoryName(category).toLowerCase())}…
      </div>
    `;

    const cards = await Promise.all(
      articles.map(async (article) => {
        const image = await resolveImage(article, category);
        return makeNewsCard(article, image, category);
      })
    );

    container.innerHTML = cards.join("");
    wireImageFallbacks(container);
  }

  /* -------------------- TOP STORIES -------------------- */

  async function renderTopStories(data) {
    const container = $("top-stories-container");

    if (!container) return;

    const stories = Array.isArray(data.topStories)
      ? data.topStories
      : [];

    if (!stories.length) {
      showMessage(
        container,
        "Top stories are being updated",
        "Please check back shortly."
      );
      return;
    }

    const cards = await Promise.all(
      stories.map(async (story, index) => {
        const image = await resolveImage(story, "world");

        return `
          <article class="news-card top-story-card">
            ${imageMarkup(
              image,
              story.title || "Top story",
              "news-image",
              "world"
            )}

            <div class="news-card-body">
              <span class="top-story-number">${index + 1}</span>

              <div class="news-meta">
                <span class="news-category">Top Story</span>
                ${story.date ? `<span>${escapeHTML(story.date)}</span>` : ""}
              </div>

              <h3>${escapeHTML(story.title || "Top story")}</h3>

              <p>${escapeHTML(
                story.description ||
                story.summary ||
                story.content ||
                ""
              )}</p>
            </div>
          </article>
        `;
      })
    );

    container.innerHTML = cards.join("");
    wireImageFallbacks(container);
  }

  /* -------------------- SPONSORED ADVERTS -------------------- */

  function renderAdverts(data) {
    const container = $("sponsored-adverts");

    if (!container) return;

    const adverts = Array.isArray(data.sponsoredAdverts)
      ? data.sponsoredAdverts
      : [];

    if (!adverts.length) {
      showMessage(
        container,
        "No sponsored adverts at present",
        "Contact RadiantWaves Media to enquire about advertising."
      );
      return;
    }

    container.innerHTML = adverts.map((ad) => {
      const image = safeImageURL(ad.image) || fallbackImage("business");

      const products = Array.isArray(ad.products)
        ? ad.products
        : [];

      const productHTML = products.map((product) => {
        if (typeof product === "string") {
          return `<li>${escapeHTML(product)}</li>`;
        }

        if (product && typeof product === "object") {
          const name = product.name || product.title || "Product";

          const sizes = [
            product.big ? `Big: ${product.big}` : "",
            product.small ? `Small: ${product.small}` : ""
          ].filter(Boolean).join(" · ");

          return `
            <li>
              <strong>${escapeHTML(name)}</strong>
              ${sizes ? `<span>${escapeHTML(sizes)}</span>` : ""}
            </li>
          `;
        }

        return "";
      }).join("");

      const buttonText = ad.button || "Contact us";
      const link = safeLink(ad.link);

      const action = `
        <a class="advert-btn"
           href="${escapeHTML(link)}"
           ${/^https?:\/\//i.test(link)
             ? 'target="_blank" rel="noopener noreferrer"'
             : ""}>
          ${escapeHTML(buttonText)}
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      `;

      return `
        <article class="sponsored-card">
          <img
            class="sponsored-image"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(ad.title || "Sponsored advert")}"
            loading="lazy"
            decoding="async"
            data-fallback="${escapeHTML(fallbackImage("business"))}">

          <div class="sponsored-copy">
            <span class="sponsored-label">Sponsored Advert</span>

            <h3>${escapeHTML(ad.title || "Our Partner")}</h3>

            ${ad.subtitle
              ? `<p><strong>${escapeHTML(ad.subtitle)}</strong></p>`
              : ""}

            <p>${escapeHTML(ad.description || "")}</p>

            ${productHTML
              ? `<ul class="product-list">${productHTML}</ul>`
              : ""}

            ${action}
          </div>
        </article>
      `;
    }).join("");

    wireImageFallbacks(container);
  }

  /* -------------------- VIDEO CONTROLS -------------------- */

  function setupVideo() {
    const video = $("heroVideo");
    const source = $("video-source");
    const soundButton = $("sound-button");

    if (!video || !source) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    video.play().catch(() => {
      // Some mobile browsers block autoplay.
      // The viewer can still select a video or start playback manually.
    });

    document.querySelectorAll("[data-video]").forEach((button) => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        const file = safeImageURL(button.dataset.video);

        if (!file) return;

        const currentFile = source.getAttribute("src");

        if (currentFile === file) {
          video.play().catch(() => {});
          return;
        }

        source.setAttribute("src", file);
        video.load();

        video.play().catch(() => {});

        document.querySelectorAll("[data-video]").forEach((choice) => {
          const active = choice === button;

          choice.classList.toggle("is-active", active);
          choice.setAttribute("aria-pressed", String(active));
        });
      });
    });

    if (!soundButton) return;

    soundButton.addEventListener("click", async () => {
      if (video.muted) {
        try {
          video.muted = false;
          video.volume = 1;
          await video.play();

          soundButton.innerHTML =
            '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> Sound on';

          soundButton.setAttribute("aria-pressed", "true");
        } catch (error) {
          video.muted = true;

          soundButton.setAttribute("aria-pressed", "false");

          alert(
            "Sound could not be enabled. Please check your device volume and try again."
          );
        }
      } else {
        video.muted = true;

        soundButton.innerHTML =
          '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i> Enable sound';

        soundButton.setAttribute("aria-pressed", "false");
      }
    });
  }

  /* -------------------- NEWSROOM INITIALISATION -------------------- */

  async function loadNewsroom() {
    try {
      const response = await fetch(
        `${NEWS_FILE}?v=${Date.now()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Could not load news.json (${response.status})`);
      }

      const data = await response.json();

      renderTextSections(data);
      renderAdverts(data);

      await Promise.all([
        renderFeatured(data),
        renderTopStories(data),
        ...CATEGORY_SECTIONS.map(([id, category]) =>
          renderArticleSection(data, id, category)
        )
      ]);

      console.info("RadiantWaves Media newsroom loaded successfully.");
    } catch (error) {
      console.error("Newsroom loading error:", error);

      CATEGORY_SECTIONS.forEach(([id]) => {
        showMessage(
          $(id),
          "News temporarily unavailable",
          "Please refresh the page. If the problem continues, check that news.json is valid JSON and uploaded beside index.html."
        );
      });

      if ($("breaking-ticker")) {
        $("breaking-ticker").textContent =
          "Newsroom update in progress — please refresh shortly.";
      }

      if ($("featured-news")) {
        showMessage(
          $("featured-news"),
          "Featured news temporarily unavailable",
          "Please try refreshing the page."
        );
      }

      if ($("top-stories-container")) {
        showMessage(
          $("top-stories-container"),
          "Top stories temporarily unavailable",
          "Please try refreshing the page."
        );
      }
    }
  }

  /* -------------------- START WEBSITE -------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    const year = $("copyright-year");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    setupVideo();
    loadNewsroom();
  });
})();

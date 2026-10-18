
/* ==========================================================
   RADIANTWAVES MEDIA — NEWSROOM SCRIPT
   Corrected product display, news cards and image handling
   ========================================================== */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json";
  const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
  const $ = (id) => document.getElementById(id);
  const imageCache = new Map();

  const CATEGORIES = {
    world: { id: "world-news", name: "World News" },
    usa: { id: "usa-news", name: "USA News" },
    europe: { id: "europe-news", name: "Europe News" },
    africa: { id: "africa-news", name: "Africa News" },
    asia: { id: "asia-news", name: "Asia News" },
    business: { id: "business-news", name: "Business News" },
    technology: { id: "tech-news", name: "Technology News" }
  };

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function validImage(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const url = value.trim();

    if (/^https?:\/\//i.test(url)) return url;
    if (/^(?:\.\/|\.\.\/|assets\/)/i.test(url)) return url;

    return "";
  }

  function validLink(value) {
    const url = String(value || "").trim();

    if (/^(https?:\/\/|mailto:|tel:|#|\.\/|\.\.\/)/i.test(url)) {
      return url;
    }

    return "#";
  }

  function fallbackImage(label = "Global News") {
    return "https://dummyimage.com/1200x700/172233/ffffff&text=" +
      encodeURIComponent("RADIANTWAVES - " + label);
  }

  function showMessage(container, title, message = "") {
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <strong>${esc(title)}</strong>
        ${message ? `<p>${esc(message)}</p>` : ""}
      </div>
    `;
  }

  /* IMAGE LOOKUP
     Uses the supplied image first. If absent, searches Wikimedia
     using imageQuery or the article headline. */

  async function findImage(query) {
    query = String(query || "").trim();
    if (!query) return "";

    const key = query.toLowerCase();

    if (imageCache.has(key)) return imageCache.get(key);

    const task = (async () => {
      try {
        const params = new URLSearchParams({
          action: "query",
          generator: "search",
          gsrsearch: query + " filetype:bitmap",
          gsrnamespace: "6",
          gsrlimit: "5",
          prop: "imageinfo",
          iiprop: "url|mime",
          iiurlwidth: "1200",
          format: "json",
          origin: "*"
        });

        const response = await fetch(
          `${WIKIMEDIA_API}?${params.toString()}`
        );

        if (!response.ok) return "";

        const data = await response.json();
        const pages = Object.values(data?.query?.pages || {});

        for (const page of pages) {
          const info = page?.imageinfo?.[0];

          if (!info || !String(info.mime || "").startsWith("image/")) {
            continue;
          }

          const url = info.thumburl || info.url;

          if (url && /^https?:\/\//i.test(url)) return url;
        }
      } catch (error) {
        console.warn("Image search unavailable:", error);
      }

      return "";
    })();

    imageCache.set(key, task);
    return task;
  }

  async function getImage(item, category) {
    const supplied = validImage(item?.image);
    if (supplied) return supplied;

    const query = item?.imageQuery || item?.title || category;
    const found = await findImage(query);

    return found || fallbackImage(category);
  }

  function imageHTML(url, alt, className = "news-image", category = "World News") {
    return `
      <div class="news-image-wrap">
        <img
          class="${esc(className)}"
          src="${esc(validImage(url) || fallbackImage(category))}"
          alt="${esc(alt || category)}"
          loading="lazy"
          decoding="async"
          data-fallback="${esc(fallbackImage(category))}">
      </div>
    `;
  }

  function wireImageFallbacks(root = document) {
    root.querySelectorAll("img[data-fallback]").forEach((img) => {
      if (img.dataset.fallbackReady) return;
      img.dataset.fallbackReady = "1";

      img.addEventListener("error", () => {
        const fallback = img.dataset.fallback;
        if (fallback && img.src !== fallback) {
          img.src = fallback;
          img.removeAttribute("data-fallback");
        }
      });
    });
  }

  /* GENERAL NEWSROOM TEXT */

  function renderText(data) {
    if ($("edition-date")) {
      $("edition-date").textContent =
        [data.edition, data.date].filter(Boolean).join(" · ") ||
        "GLOBAL NEWSROOM";
    }

    if ($("hero-title")) {
      $("hero-title").textContent =
        data.hero?.title || "Global Breaking News";
    }

    if ($("hero-desc")) {
      $("hero-desc").textContent =
        data.hero?.description || "Reports and perspectives from around the world.";
    }

    if ($("morning-summary")) {
      $("morning-summary").textContent =
        data.morningSummary || "Welcome to the RadiantWaves Media global briefing.";
    }

    if ($("editorial-note")) {
      $("editorial-note").textContent =
        data.editorialNote || "Developing stories may change as more information becomes available.";
    }

    if ($("big-question")) {
      $("big-question").textContent =
        data.bigQuestion || "What should citizens expect from their leaders?";
    }

    if ($("quote-of-the-day")) {
      const quote = String(
        data.quoteOfTheDay ||
        "Leadership is measured by responsibility, not promises."
      ).replace(/[“”]/g, "");

      $("quote-of-the-day").textContent = `“${quote}”`;
    }

    const breaking = Array.isArray(data.breaking)
      ? data.breaking.filter((item) => typeof item === "string" && item.trim())
      : [];

    const tickerItems = breaking.length
      ? breaking
      : ["Welcome to RadiantWaves Media — Connecting You to the World."];

    if ($("breaking-ticker")) {
      const html = tickerItems
        .map((item) => `<span class="ticker-item">${esc(item)}</span>`)
        .join("");

      $("breaking-ticker").innerHTML = html + html;
    }

    if ($("hero-marquee")) {
      $("hero-marquee").textContent = tickerItems.join(" ◆ ");
    }

    renderBreakingHistory(data.breakingHistory);
  }

  function renderBreakingHistory(items) {
    const container = $("history-container");
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      showMessage(container, "No breaking briefs available", "Check back for future updates.");
      return;
    }

    container.innerHTML = items.map((item) => {
      const title = typeof item === "string"
        ? item
        : item?.title || item?.headline || "News update";

      const summary = typeof item === "object"
        ? item?.summary || item?.description || item?.content || ""
        : "";

      const date = typeof item === "object" ? item?.date || "" : "";

      return `
        <article class="history-item">
          ${date ? `<span class="history-date">${esc(date)}</span>` : ""}
          <h3>${esc(title)}</h3>
          ${summary ? `<p>${esc(summary)}</p>` : ""}
        </article>
      `;
    }).join("");
  }

  /* FEATURED STORY */

  async function renderFeatured(data) {
    const container = $("featured-news");
    if (!container) return;

    const story = data.featured;

    if (!story?.title) {
      container.innerHTML = "";
      return;
    }

    const image = await getImage(story, "World News");

    container.innerHTML = `
      <article class="featured-story">
        <div class="featured-image-wrap">
          ${imageHTML(image, story.title, "featured-image", "World News")}
        </div>
        <div class="featured-copy">
          <span class="featured-label">Editor's Pick</span>
          <h2>${esc(story.title)}</h2>
          <p>${esc(story.summary || story.description || story.content || "")}</p>
        </div>
      </article>
    `;

    wireImageFallbacks(container);
  }

  /* NEWS ARTICLES */

  function articleCard(article, image, category) {
    const title = article.title || "News update";
    const summary = article.summary || article.description || article.content ||
      "More information will be added as the story develops.";

    const link = validLink(article.url || article.link);

    return `
      <article class="news-card">
        ${imageHTML(image, title, "news-image", category)}
        <div class="news-card-body">
          <div class="news-meta">
            <span class="news-category">${esc(category)}</span>
            ${article.date ? `<span>${esc(article.date)}</span>` : ""}
          </div>
          <h3>${esc(title)}</h3>
          <p>${esc(summary)}</p>
          ${article.source
            ? `<div class="news-meta">Source: ${esc(article.source)}</div>`
            : ""}
          ${link !== "#" ? `
            <a class="news-link" href="${esc(link)}"
               target="_blank" rel="noopener noreferrer">
              Read more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </a>` : ""}
        </div>
      </article>
    `;
  }

  async function renderCategory(data, key) {
    const config = CATEGORIES[key];
    const container = $(config.id);
    if (!container) return;

    const articles = Array.isArray(data.articles)
      ? data.articles.filter(
          (article) => String(article?.category || "").toLowerCase() === key
        )
      : [];

    if (!articles.length) {
      showMessage(container, `No ${config.name} stories yet`, "Check back for the next newsroom update.");
      return;
    }

    container.innerHTML = `<div class="loading-state">Loading ${esc(config.name)}…</div>`;

    const cards = await Promise.all(
      articles.map(async (article) => {
        const image = await getImage(article, config.name);
        return articleCard(article, image, config.name);
      })
    );

    container.innerHTML = cards.join("");
    wireImageFallbacks(container);
  }

  /* TOP STORIES */

  async function renderTopStories(data) {
    const container = $("top-stories-container");
    if (!container) return;

    const stories = Array.isArray(data.topStories) ? data.topStories : [];

    if (!stories.length) {
      showMessage(container, "Top stories are being updated", "Please check back shortly.");
      return;
    }

    const cards = await Promise.all(stories.map(async (story, index) => {
      const image = await getImage(story, "World News");

      return `
        <article class="news-card top-story-card">
          ${imageHTML(image, story.title, "news-image", "World News")}
          <div class="news-card-body">
            <span class="top-story-number">${index + 1}</span>
            <div class="news-meta">
              <span class="news-category">Top Story</span>
              ${story.date ? `<span>${esc(story.date)}</span>` : ""}
            </div>
            <h3>${esc(story.title || "Top story")}</h3>
            <p>${esc(story.description || story.summary || story.content || "")}</p>
          </div>
        </article>
      `;
    }));

    container.innerHTML = cards.join("");
    wireImageFallbacks(container);
  }

  /* SPONSORED ADVERTS
     Important: only read actual string or numeric product values.
     This prevents inherited JavaScript methods such as big() and
     small() from appearing in the advert. */

  function displayValue(value) {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    return "";
  }

  function renderProduct(product) {
    if (typeof product === "string" || typeof product === "number") {
      return `<li>${esc(product)}</li>`;
    }

    if (!product || typeof product !== "object") return "";

    const name = displayValue(product.name) ||
      displayValue(product.title) || "Product";

    const big = displayValue(
      Object.prototype.hasOwnProperty.call(product, "big")
        ? product.big
        : product.bigSize
    );

    const small = displayValue(
      Object.prototype.hasOwnProperty.call(product, "small")
        ? product.small
        : product.smallSize
    );

    const sizes = [
      big ? `Big: ${big}` : "",
      small ? `Small: ${small}` : ""
    ].filter(Boolean).join(" | ");

    return `
      <li>
        <strong>${esc(name)}</strong>
        ${sizes ? `<span>${esc(sizes)}</span>` : ""}
      </li>
    `;
  }

  function renderAdverts(data) {
    const container = $("sponsored-adverts");
    if (!container) return;

    const adverts = Array.isArray(data.sponsoredAdverts)
      ? data.sponsoredAdverts
      : [];

    if (!adverts.length) {
      showMessage(container, "No sponsored adverts at present", "Contact our newsroom to enquire about advertising.");
      return;
    }

    container.innerHTML = adverts.map((ad) => {
      const image = validImage(ad.image) || fallbackImage("Sponsored Advert");

      const products = Array.isArray(ad.products)
        ? ad.products.map(renderProduct).join("")
        : "";

      const link = validLink(ad.link);
      const button = displayValue(ad.button) || "Contact us";

      return `
        <article class="sponsored-card">
          <img
            class="sponsored-image"
            src="${esc(image)}"
            alt="${esc(ad.title || "Sponsored advert")}"
            loading="lazy"
            decoding="async"
            data-fallback="${esc(fallbackImage("Sponsored Advert"))}">

          <div class="sponsored-copy">
            <span class="sponsored-label">Sponsored Advert</span>
            <h3>${esc(ad.title || "Our Partner")}</h3>
            ${ad.subtitle ? `<p><strong>${esc(ad.subtitle)}</strong></p>` : ""}
            <p>${esc(ad.description || "")}</p>
            ${products ? `<ul class="product-list">${products}</ul>` : ""}
            <a class="advert-btn" href="${esc(link)}"
              ${/^https?:\/\//i.test(link) ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              ${esc(button)}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </article>
      `;
    }).join("");

    wireImageFallbacks(container);
  }

  /* FEATURED VIDEO CONTROLS */

  function setupVideo() {
    const video = $("heroVideo");
    const source = $("video-source");
    const soundButton = $("sound-button");

    if (!video || !source) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    video.play().catch(() => {
      // Autoplay may be blocked by the browser.
    });

    document.querySelectorAll("[data-video]").forEach((button) => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        const file = validImage(button.dataset.video);
        if (!file) return;

        if (source.getAttribute("src") === file) {
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

    if (soundButton) {
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

            alert("Sound could not be enabled. Please check your device volume and try again.");
          }
        } else {
          video.muted = true;

          soundButton.innerHTML =
            '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i> Enable sound';

          soundButton.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  /* LOAD THE NEWS JSON */

  async function loadNewsroom() {
    try {
      const response = await fetch(
        `${NEWS_FILE}?v=${Date.now()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`news.json returned status ${response.status}`);
      }

      const data = await response.json();

      renderText(data);
      renderAdverts(data);

      await Promise.all([
        renderFeatured(data),
        renderTopStories(data),
        ...Object.keys(CATEGORIES).map((key) => renderCategory(data, key))
      ]);

      console.info("RadiantWaves Media newsroom loaded.");
    } catch (error) {
      console.error("RadiantWaves Media loading error:", error);

      if ($("breaking-ticker")) {
        $("breaking-ticker").textContent =
          "Newsroom update in progress. Please refresh shortly.";
      }

      Object.values(CATEGORIES).forEach((category) => {
        showMessage(
          $(category.id),
          "News temporarily unavailable",
          "Check that news.json is valid and uploaded beside index.html."
        );
      });

      showMessage(
        $("top-stories-container"),
        "Top stories temporarily unavailable",
        "Please refresh the website."
      );

      showMessage(
        $("featured-news"),
        "Featured news temporarily unavailable",
        "Please refresh the website."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if ($("copyright-year")) {
      $("copyright-year").textContent = String(new Date().getFullYear());
    }

    setupVideo();
    loadNewsroom();
  });
})();

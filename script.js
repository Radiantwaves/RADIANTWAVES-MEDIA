
/* ==========================================================
   RADIANTWAVES MEDIA — COMPLETE NEWSROOM SCRIPT
   Version 5000

   Main news file:       ./news.json
   Archive index:        ./archives/index.json
   Leaders updates:      news.json -> leadersWatch

   Important:
   This script displays supplied news. It does not independently
   verify news or automatically discover leaders' statements.
   ========================================================== */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json";
  const ARCHIVE_INDEX_FILE = "./archives/index.json";

  const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
  const IMAGE_SEARCH_LIMIT = 6;
  const imageSearchCache = new Map();

  const FALLBACK_BASE =
    "https://dummyimage.com/1200x700/151515/f4f4f4";

  const $ = (id) => document.getElementById(id);


  /* ==================== GENERAL HELPERS ==================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function plainText(value) {
    const node = document.createElement("div");
    node.innerHTML = String(value ?? "");
    return (node.textContent || node.innerText || "").trim();
  }


  function categoryName(category) {
    const names = {
      world: "World News",
      usa: "USA News",
      europe: "Europe News",
      africa: "Africa News",
      asia: "Asia News",
      business: "Business News",
      technology: "Technology News",
      tech: "Technology News"
    };

    return names[String(category || "world").toLowerCase()]
      || "World News";
  }


  function normaliseCategory(category) {
    const value = String(category || "world").toLowerCase().trim();

    if (value === "tech") return "technology";
    if (value === "united states" || value === "us") return "usa";

    return value;
  }


  function fallbackImage(category = "world") {
    const label = encodeURIComponent(
      `RADIANTWAVES MEDIA | ${categoryName(category)}`
    );

    return `${FALLBACK_BASE}?text=${label}`;
  }


  function safeImageURL(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const url = value.trim();

    if (/^https?:\/\//i.test(url)) return url;
    if (/^\.{1,2}\//.test(url)) return url;
    if (/^assets\//i.test(url)) return `./${url}`;

    return "";
  }


  function safeLink(value) {
    const link = String(value || "").trim();

    if (/^https?:\/\//i.test(link)) return link;
    if (/^mailto:/i.test(link)) return link;
    if (/^tel:/i.test(link)) return link;
    if (/^\.{1,2}\//.test(link)) return link;
    if (/^archives\//i.test(link)) return `./${link}`;
    if (link.startsWith("#")) return link;

    return "";
  }


  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }


  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = String(value ?? "");
  }


  function showMessage(container, title, message = "") {
    if (!container) return;

    container.innerHTML = `
      <article class="card status-card">
        <div class="card-content">
          <h3>${escapeHTML(title)}</h3>
          ${message
            ? `<p>${escapeHTML(message)}</p>`
            : ""}
        </div>
      </article>
    `;
  }


  function setPlainEmptyState(container, message) {
    if (!container) return;

    container.innerHTML = `
      <p class="empty-state">${escapeHTML(message)}</p>
    `;
  }


  async function fetchJSON(url) {
    const separator = url.includes("?") ? "&" : "?";

    const response = await fetch(
      `${url}${separator}v=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }

    return response.json();
  }


  /* ==================== IMAGE LOOKUP ==================== */

  async function findWikimediaImage(query) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) return null;

    const cacheKey = cleanQuery.toLowerCase();

    if (imageSearchCache.has(cacheKey)) {
      return imageSearchCache.get(cacheKey);
    }

    const request = (async () => {
      try {
        const params = new URLSearchParams({
          action: "query",
          generator: "search",
          gsrsearch: `${cleanQuery} filetype:bitmap`,
          gsrnamespace: "6",
          gsrlimit: String(IMAGE_SEARCH_LIMIT),
          prop: "imageinfo",
          iiprop: "url|mime|extmetadata",
          iiurlwidth: "1200",
          format: "json",
          origin: "*"
        });

        const response = await fetch(
          `${WIKIMEDIA_API}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Wikimedia returned ${response.status}`);
        }

        const data = await response.json();
        const pages = Object.values(data?.query?.pages || {});

        for (const page of pages) {
          const info = page?.imageinfo?.[0];

          if (!info || !String(info.mime || "").startsWith("image/")) {
            continue;
          }

          const url = info.thumburl || info.url;

          if (!url || !/^https?:\/\//i.test(url)) {
            continue;
          }

          const metadata = info.extmetadata || {};

          const artist = plainText(metadata.Artist?.value || "");
          const credit = plainText(metadata.Credit?.value || "");

          return {
            url,
            title: page.title || "",
            credit: artist || credit || "Wikimedia Commons"
          };
        }
      } catch (error) {
        console.warn("Automatic image lookup failed:", error);
      }

      return null;
    })();

    imageSearchCache.set(cacheKey, request);

    return request;
  }


  async function resolveImage(item, category = "world") {
    const suppliedImage = safeImageURL(item?.image);

    if (suppliedImage) {
      return {
        url: suppliedImage,
        credit: "Image supplied with the story"
      };
    }

    const found = await findWikimediaImage(item?.imageQuery);

    if (found?.url) return found;

    return {
      url: fallbackImage(category),
      credit: "RadiantWaves Media graphic"
    };
  }


  function imageMarkup(url, alt, className = "news-image", category = "world") {
    const safeURL = safeImageURL(url) || fallbackImage(category);
    const fallback = escapeHTML(fallbackImage(category));

    return `
      <div class="automatic-image-wrapper">
        <div class="image-loading" aria-hidden="true">
          Preparing image…
        </div>

        <img
          class="${escapeHTML(className)}"
          src="${escapeHTML(safeURL)}"
          alt="${escapeHTML(alt)}"
          loading="lazy"
          decoding="async"
          data-fallback="${fallback}"
        >
      </div>
    `;
  }


  function wireImageStates(root = document) {
    root.querySelectorAll(
      ".automatic-image-wrapper img"
    ).forEach((img) => {
      const wrapper = img.closest(".automatic-image-wrapper");
      const loading = wrapper?.querySelector(".image-loading");

      const hideLoading = () => {
        if (loading) loading.hidden = true;
      };

      img.addEventListener("load", hideLoading, { once: true });

      img.addEventListener("error", () => {
        if (img.dataset.fallback && img.src !== img.dataset.fallback) {
          img.src = img.dataset.fallback;
          img.removeAttribute("data-fallback");
        } else {
          hideLoading();

          if (loading) {
            loading.textContent = "Image unavailable";
          }
        }
      });

      if (img.complete && img.naturalWidth > 0) {
        hideLoading();
      }
    });
  }


  /* ==================== NEWS ARTICLE CARDS ==================== */

  function makeNewsCard(article, image, category) {
    const title = article?.title || "Untitled story";

    const summary =
      article?.summary
      || article?.description
      || article?.content
      || "More information will be added as the story develops.";

    const source = article?.source
      ? `<p class="story-source">Source: ${escapeHTML(article.source)}</p>`
      : "";

    const date = article?.date
      ? `<p class="story-date">${escapeHTML(formatDate(article.date))}</p>`
      : "";

    const url = safeLink(article?.url || article?.link);

    const titleHTML = url
      ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(title)}</a>`
      : escapeHTML(title);

    return `
      <article class="card news-card">
        ${imageMarkup(image.url, title, "news-image", category)}

        <div class="card-content">
          <span class="news-category">
            ${escapeHTML(categoryName(category))}
          </span>

          <h3>${titleHTML}</h3>

          <p>${escapeHTML(summary)}</p>

          ${source}
          ${date}
        </div>
      </article>
    `;
  }


  async function renderArticleSection(newsData, sectionId, category) {
    const container = $(sectionId);

    if (!container) return;

    const articles = Array.isArray(newsData.articles)
      ? newsData.articles.filter((article) =>
          normaliseCategory(article?.category) === category
        )
      : [];

    if (!articles.length) {
      showMessage(
        container,
        `No ${categoryName(category)} stories yet.`,
        "Please check back for the next newsroom update."
      );
      return;
    }

    container.innerHTML = `
      <div class="loading-card">
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
    wireImageStates(container);
  }


  async function renderFeatured(newsData) {
    const container = $("featured-news");
    const featured = newsData.featured;

    if (!container) return;

    if (!featured || !featured.title) {
      setPlainEmptyState(
        container,
        "The featured story will appear here when supplied in news.json."
      );
      return;
    }

    const image = await resolveImage(featured, "world");
    const url = safeLink(featured.url || featured.link);

    const titleHTML = url
      ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(featured.title)}</a>`
      : escapeHTML(featured.title);

    container.innerHTML = `
      <article class="featured-card">

        ${imageMarkup(
          image.url,
          featured.title || "Featured story",
          "featured-image",
          "world"
        )}

        <div class="featured-copy">

          <p class="eyebrow">EDITOR'S PICK</p>

          <span class="news-category">FEATURED STORY</span>

          <h2>${titleHTML}</h2>

          <p>
            ${escapeHTML(
              featured.content
              || featured.summary
              || featured.description
              || ""
            )}
          </p>

          ${featured.source
            ? `<p class="story-source">Source: ${escapeHTML(featured.source)}</p>`
            : `<p class="story-source">RadiantWaves Media newsroom</p>`}

          ${featured.date
            ? `<p class="story-date">${escapeHTML(formatDate(featured.date))}</p>`
            : ""}

        </div>
      </article>
    `;

    wireImageStates(container);
  }


  async function renderTopStories(newsData) {
    const container = $("top-stories-container");

    if (!container) return;

    const stories = Array.isArray(newsData.topStories)
      ? newsData.topStories
      : [];

    if (!stories.length) {
      showMessage(
        container,
        "Top stories are being updated.",
        "Please check back shortly."
      );
      return;
    }

    const cards = await Promise.all(
      stories.map(async (story) => {
        const image = await resolveImage(story, "world");
        const url = safeLink(story.url || story.link);

        const titleHTML = url
          ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(story.title || "Top story")}</a>`
          : escapeHTML(story.title || "Top story");

        return `
          <article class="card news-card">

            ${imageMarkup(
              image.url,
              story.title || "Top story",
              "news-image",
              "world"
            )}

            <div class="card-content">

              <span class="news-category">TOP STORY</span>

              <h3>${titleHTML}</h3>

              <p>
                ${escapeHTML(
                  story.description
                  || story.summary
                  || story.content
                  || ""
                )}
              </p>

              ${story.source
                ? `<p class="story-source">Source: ${escapeHTML(story.source)}</p>`
                : ""}

              ${story.date
                ? `<p class="story-date">${escapeHTML(formatDate(story.date))}</p>`
                : ""}

            </div>
          </article>
        `;
      })
    );

    container.innerHTML = cards.join("");
    wireImageStates(container);
  }


  /* ==================== SPONSORED ADVERTS ==================== */

  function renderAdverts(newsData) {
    const container = $("sponsored-adverts");

    if (!container) return;

    const adverts = Array.isArray(newsData.sponsoredAdverts)
      ? newsData.sponsoredAdverts
      : [];

    if (!adverts.length) {
      setPlainEmptyState(
        container,
        "There are no sponsored adverts to display at present."
      );
      return;
    }

    container.innerHTML = adverts.map((ad) => {
      const image =
        safeImageURL(ad.image) || fallbackImage("business");

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

      const href = safeLink(ad.link);

      const action = ad.button && href
        ? `
          <a
            class="contact-btn advert-action"
            href="${escapeHTML(href)}"
            ${/^https?:\/\//i.test(href)
              ? 'target="_blank" rel="noopener noreferrer"'
              : ""}
          >
            ${escapeHTML(ad.button)}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        `
        : "";

      return `
        <article class="sponsored-ad">

          <div class="sponsored-label">SPONSORED ADVERT</div>

          <div class="sponsored-content">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(ad.title || "Sponsored advert")}"
              loading="lazy"
              decoding="async"
              data-ad-fallback="${escapeHTML(fallbackImage("business"))}"
            >

            <div class="sponsored-text">

              <p class="eyebrow">PARTNER MESSAGE</p>

              <h3>${escapeHTML(ad.title || "Sponsored advert")}</h3>

              ${ad.subtitle
                ? `<h4>${escapeHTML(ad.subtitle)}</h4>`
                : ""}

              <p>${escapeHTML(ad.description || "")}</p>

              ${productHTML
                ? `<ul class="product-list">${productHTML}</ul>`
                : ""}

              ${action}

            </div>
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("img[data-ad-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        if (
          img.dataset.adFallback
          && img.src !== img.dataset.adFallback
        ) {
          img.src = img.dataset.adFallback;
          img.removeAttribute("data-ad-fallback");
        }
      }, { once: true });
    });
  }


  /* ==================== TEXT, TICKER AND BRIEFS ==================== */

  function renderTextSections(newsData) {
    const edition = [newsData.edition, newsData.date]
      .filter(Boolean)
      .join(" · ");

    setText("edition-date", edition || "GLOBAL NEWSROOM");

    setText(
      "hero-title",
      newsData.hero?.title || "Global Breaking News"
    );

    setText(
      "hero-desc",
      newsData.hero?.description
        || "Reports and perspectives from around the world."
    );

    setText(
      "morning-summary",
      newsData.morningSummary
        || "The newsroom briefing will be updated as stories develop."
    );

    setText(
      "editorial-note",
      newsData.editorialNote
        || "Developing stories may change as new information becomes available."
    );

    setText(
      "big-question",
      newsData.bigQuestion
        || "What issue should leaders prioritise, and how should progress be measured?"
    );

    const quote = String(
      newsData.quoteOfTheDay
      || "A thoughtful world begins with informed questions."
    ).replace(/[“”"]/g, "");

    setText("quote-of-the-day", `“${quote}”`);


    /* Breaking ticker */

    const breaking = Array.isArray(newsData.breaking)
      ? newsData.breaking.filter(Boolean)
      : [];

    const tickerItems = breaking.length
      ? breaking
      : ["Welcome to RadiantWaves Media — global news and perspectives."];

    const tickerHTML = tickerItems
      .map((item) =>
        `<span class="ticker-item">${escapeHTML(item)}</span>`
      )
      .join("");

    const ticker = $("breaking-ticker");

    if (ticker) {
      ticker.innerHTML = tickerHTML + tickerHTML;
    }


    /* Hero scrolling headlines */

    const heroMarquee = $("hero-marquee");

    if (heroMarquee) {
      heroMarquee.innerHTML = tickerItems
        .map((item) => `<span>${escapeHTML(item)}</span>`)
        .join('<span class="marquee-separator"> ◆ </span>');
    }


    /* Breaking news briefs */

    const history = Array.isArray(newsData.breakingHistory)
      ? newsData.breakingHistory
      : [];

    const historyContainer = $("history-container");

    if (historyContainer) {
      historyContainer.innerHTML = history.length
        ? history.map((item) => {
            if (typeof item === "string") {
              return `
                <article class="history-item">
                  <span class="history-mark" aria-hidden="true">●</span>
                  <p>${escapeHTML(item)}</p>
                </article>
              `;
            }

            return `
              <article class="history-item">
                <span class="history-mark" aria-hidden="true">●</span>
                <div>
                  ${item.date
                    ? `<p class="story-date">${escapeHTML(formatDate(item.date))}</p>`
                    : ""}
                  <p>${escapeHTML(item.title || item.text || item.summary || "")}</p>
                  ${item.source
                    ? `<p class="story-source">Source: ${escapeHTML(item.source)}</p>`
                    : ""}
                </div>
              </article>
            `;
          }).join("")
        : `<p class="empty-state">No additional breaking briefs are available yet.</p>`;
    }
  }


  /* ==================== LEADERS WATCH ==================== */

  const LEADER_DEFINITIONS = [
    { id: "macron", name: "Emmanuel Macron" },
    { id: "burnham", name: "Andy Burnham" },
    { id: "merz", name: "Friedrich Merz" },
    { id: "trump", name: "Donald Trump" },
    { id: "tinubu", name: "Bola Ahmed Tinubu" },
    { id: "atiku", name: "Atiku Abubakar" },
    { id: "obi", name: "Peter Obi" },
    { id: "vonderleyen", name: "Ursula von der Leyen" },
    { id: "xi", name: "Xi Jinping" },
    { id: "putin", name: "Vladimir Putin" }
  ];


  function getLeaderUpdates(newsData) {
    const supplied = newsData.leadersWatch ?? newsData.leaders;

    if (Array.isArray(supplied)) {
      return supplied;
    }

    if (supplied && typeof supplied === "object") {
      return Object.entries(supplied).map(([id, value]) => ({
        id,
        ...(typeof value === "object" && value ? value : {
          summary: String(value)
        })
      }));
    }

    return [];
  }


  function renderLeadersWatch(newsData) {
    const updates = getLeaderUpdates(newsData);

    const updateMap = new Map();

    updates.forEach((item) => {
      const id = String(item.id || item.personId || "")
        .toLowerCase()
        .trim();

      if (id) updateMap.set(id, item);
    });

    LEADER_DEFINITIONS.forEach((leader) => {
      const updateContainer = $(`update-${leader.id}`);
      const sourceContainer = $(`source-${leader.id}`);

      if (!updateContainer) return;

      const update = updateMap.get(leader.id);

      if (!update) {
        setPlainEmptyState(
          updateContainer,
          "No new verified update has been added to the newsroom yet. Check the original sources for the latest statements."
        );

        if (sourceContainer) {
          sourceContainer.textContent =
            "No update supplied. No new statement is being claimed.";
        }

        return;
      }

      const summary =
        update.summary
        || update.content
        || update.statement
        || update.description
        || "";

      const title = update.title || "";

      const date = update.date || update.publishedAt || "";
      const source = update.source || "";
      const url = safeLink(update.url || update.link);

      if (!summary.trim() && !title.trim()) {
        setPlainEmptyState(
          updateContainer,
          "This entry has no update text yet."
        );

        if (sourceContainer) {
          sourceContainer.textContent = "No complete update supplied.";
        }

        return;
      }

      updateContainer.innerHTML = `
        ${date
          ? `<p class="leader-date">Update date: ${escapeHTML(formatDate(date))}</p>`
          : ""}

        ${title
          ? `<h4>${escapeHTML(title)}</h4>`
          : ""}

        <p>${escapeHTML(summary || title)}</p>

        ${update.quote
          ? `<p class="leader-quote">“${escapeHTML(update.quote)}”</p>`
          : ""}
      `;

      if (sourceContainer) {
        const sourceName = source || "Source not supplied";
        const sourceDate = date
          ? ` · Published ${formatDate(date)}`
          : "";

        sourceContainer.innerHTML = url
          ? `Source: <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(sourceName)}</a>${escapeHTML(sourceDate)}`
          : `Source: ${escapeHTML(sourceName)}${escapeHTML(sourceDate)}`;
      }
    });
  }


  /* ==================== NEWS ARCHIVE ==================== */

  function normaliseArchiveEntries(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.editions)) return data.editions;
    if (Array.isArray(data?.archives)) return data.archives;
    if (Array.isArray(data?.items)) return data.items;

    return [];
  }


  function renderArchiveCards(entries) {
    const container = $("archive-list");

    if (!container) return;

    if (!entries.length) {
      container.innerHTML = `
        <article class="archive-card">
          <span class="archive-icon" aria-hidden="true">🗂️</span>
          <h3>No saved editions yet</h3>
          <p>
            Previous editions will appear here after dated news files
            have been saved and added to archives/index.json.
          </p>
        </article>
      `;

      return;
    }

    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = new Date(a.date || a.publishedAt || 0).getTime();
      const dateB = new Date(b.date || b.publishedAt || 0).getTime();

      return dateB - dateA;
    });

    container.innerHTML = sortedEntries.map((entry) => {
      const title =
        entry.title
        || entry.edition
        || "News edition";

      const date = entry.date || entry.publishedAt || "";
      const description = entry.description || entry.summary || "";

      const rawURL = entry.url || entry.file || entry.path || "";
      const url = safeLink(rawURL);

      const linkHTML = url
        ? `
          <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">
            Open this edition
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        `
        : `<p class="archive-meta">Archive file link not supplied.</p>`;

      return `
        <article class="archive-card">

          <span class="archive-icon" aria-hidden="true">🗂️</span>

          <h3>${escapeHTML(title)}</h3>

          ${date
            ? `<p class="archive-meta">${escapeHTML(formatDate(date))}</p>`
            : ""}

          ${description
            ? `<p>${escapeHTML(description)}</p>`
            : ""}

          ${linkHTML}

        </article>
      `;
    }).join("");
  }


  async function loadArchive() {
    const container = $("archive-list");

    if (!container) return;

    try {
      const data = await fetchJSON(ARCHIVE_INDEX_FILE);
      const entries = normaliseArchiveEntries(data);

      renderArchiveCards(entries);
    } catch (error) {
      console.info(
        "No archive index has been loaded yet. This is expected until archive files are created.",
        error
      );

      renderArchiveCards([]);
    }
  }


  /* ==================== HERO VIDEO AND SOUND ==================== */

  function setupVideo() {
    const video = $("heroVideo");
    const source = $("video-source");
    const soundButton = $("sound-button");

    if (!video || !source) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    video.play().catch(() => {
      /* Some mobile browsers block autoplay. */
    });


    document.querySelectorAll("[data-video]").forEach((button) => {
      button.addEventListener("click", () => {
        const file = safeImageURL(button.dataset.video);

        if (!file) return;

        const currentSource = source.getAttribute("src");

        if (currentSource === file) {
          video.play().catch(() => {});
          return;
        }

        const wasMuted = video.muted;

        source.src = file;
        video.muted = wasMuted;
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
        try {
          if (video.muted) {
            video.muted = false;
            video.volume = 1;

            await video.play();

            soundButton.innerHTML = `
              <i class="fa-solid fa-volume-high" aria-hidden="true"></i>
              Sound on
            `;

            soundButton.setAttribute("aria-pressed", "true");
          } else {
            video.muted = true;

            soundButton.innerHTML = `
              <i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
              Enable sound
            `;

            soundButton.setAttribute("aria-pressed", "false");
          }
        } catch (error) {
          video.muted = true;
          soundButton.setAttribute("aria-pressed", "false");

          console.warn("Sound could not be enabled:", error);

          alert(
            "Your browser did not enable sound. Please try the video player's sound control."
          );
        }
      });
    }
  }


  /* ==================== ADVERT FORM ==================== */

  function setupAdvertForm() {
    const form = $("advert-request-form");

    if (!form) return;

    /*
      The form retains its mailto action in index.html.
      No information is stored in a website database.
    */
    form.addEventListener("submit", () => {
      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.textContent = "Preparing your email…";
      }
    });
  }


  /* ==================== LOAD THE NEWSROOM ==================== */

  async function loadNewsroom() {
    try {
      const newsData = await fetchJSON(NEWS_FILE);

      if (!newsData || typeof newsData !== "object") {
        throw new Error("news.json does not contain a valid JSON object.");
      }

      renderTextSections(newsData);

      await renderFeatured(newsData);

      renderAdverts(newsData);

      await renderTopStories(newsData);

      renderLeadersWatch(newsData);

      const sections = [
        ["world-news", "world"],
        ["usa-news", "usa"],
        ["europe-news", "europe"],
        ["africa-news", "africa"],
        ["asia-news", "asia"],
        ["business-news", "business"],
        ["tech-news", "technology"]
      ];

      await Promise.all(
        sections.map(([id, category]) =>
          renderArticleSection(newsData, id, category)
        )
      );

      console.info("RadiantWaves Media newsroom loaded.");

    } catch (error) {
      console.error(
        "RadiantWaves Media could not load news.json:",
        error
      );

      const categoryIDs = [
        "world-news",
        "usa-news",
        "europe-news",
        "africa-news",
        "asia-news",
        "business-news",
        "tech-news"
      ];

      categoryIDs.forEach((id) => {
        showMessage(
          $(id),
          "News temporarily unavailable",
          "Please refresh the page. If the problem continues, check that news.json is valid JSON and is uploaded beside index.html."
        );
      });

      setPlainEmptyState(
        $("featured-news"),
        "The featured story could not be loaded. Please check news.json."
      );

      showMessage(
        $("top-stories-container"),
        "Top stories could not be loaded.",
        "Please check news.json and refresh the page."
      );

      setText(
        "breaking-ticker",
        "Newsroom update in progress — please refresh shortly."
      );

      setText(
        "morning-summary",
        "The newsroom briefing could not be loaded."
      );

      renderLeadersWatch({});
    }
  }


  /* ==================== STARTUP ==================== */

  document.addEventListener("DOMContentLoaded", () => {
    setText("copyright-year", new Date().getFullYear());

    setupVideo();
    setupAdvertForm();

    loadNewsroom();
    loadArchive();
  });

})();


/* =========================================================
   RADIANTWAVES MEDIA — SCRIPT.JS
   News feed, Leaders Watch, source links and sponsored adverts
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    NEWS_FILE: "./news.json",
    NEWS_REFRESH_INTERVAL: 0,
    CONTACT_EMAIL: "info@radiantwavesmedia.com",
    FORM_ACCESS_KEY: "",
    FORM_ENDPOINT: "https://api.web3forms.com/submit"
  };

  const CATEGORY_TARGETS = {
    world: "world-news",
    usa: "usa-news",
    europe: "europe-news",
    africa: "africa-news",
    asia: "asia-news",
    business: "business-news",
    technology: "tech-news"
  };

  const CATEGORY_LABELS = {
    world: "World",
    usa: "USA",
    europe: "Europe",
    africa: "Africa",
    asia: "Asia",
    business: "Business",
    technology: "Technology"
  };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const $ = (id) => document.getElementById(id);

  /* =========================================================
     GENERAL HELPERS
     ========================================================= */

  function setText(id, value) {
    const element = $(id);

    if (element && value !== undefined && value !== null) {
      element.textContent = String(value);
    }
  }

  function safeUrl(value, allowMailto = false) {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
      const url = new URL(value.trim(), window.location.href);

      if (
        url.protocol === "https:" ||
        url.protocol === "http:" ||
        (allowMailto && url.protocol === "mailto:")
      ) {
        return url.href;
      }
    } catch (_) {
      return "";
    }

    return "";
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function isoDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) element.className = className;

    if (text !== undefined && text !== null && text !== "") {
      element.textContent = String(text);
    }

    return element;
  }

  function makeTimeElement(value, prefix = "") {
    const time = document.createElement("time");
    const iso = isoDate(value);

    if (iso) time.dateTime = iso;

    time.textContent =
      (prefix ? prefix + " " : "") + formatDate(value);

    return time;
  }

  function makeLink(url, label, className = "source-link") {
    const link = makeElement("a", className, label);
    const validUrl = safeUrl(url, true);

    if (validUrl) {
      link.href = validUrl;

      if (!validUrl.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
    }

    return link;
  }

  function replaceContents(target, elements) {
    if (!target) return;

    target.replaceChildren();

    elements.forEach((element) => {
      if (element) target.appendChild(element);
    });
  }

  function placeholder(message) {
    return makeElement("p", "empty-message", message);
  }

  function getSummary(item) {
    if (!item || typeof item !== "object") return "";

    return item.summary || item.description || item.content || "";
  }

  function getStoryUrl(item) {
    if (!item || typeof item !== "object") return "";

    return safeUrl(item.url || item.sourceUrl);
  }

  function sourceMetadata(item) {
    return item.source ? ["Source: " + item.source] : [];
  }

  function appendMetadata(content, item, options = {}) {
    const { showDate = true, datePrefix = "" } = options;
    const fragment = document.createDocumentFragment();
    const sourceText = sourceMetadata(item).join(" · ");

    if (sourceText) {
      fragment.appendChild(
        makeElement("span", "story-source", sourceText)
      );
    }

    if (showDate && item.date) {
      if (sourceText) {
        fragment.appendChild(
          makeElement("span", "story-source", " · ")
        );
      }

      fragment.appendChild(makeTimeElement(item.date, datePrefix));
    }

    if (fragment.childNodes.length) {
      const wrap = makeElement("p", "story-meta");
      wrap.appendChild(fragment);
      content.appendChild(wrap);
    }
  }

  /* =========================================================
     STANDARD NEWS CARDS
     ========================================================= */

  function makeArticleCard(article, categoryLabel) {
    const card = makeElement("article", "card news-card");
    const content = makeElement("div", "card-content");

    content.appendChild(
      makeElement(
        "span",
        "news-category",
        categoryLabel || article.category || "News"
      )
    );

    content.appendChild(
      makeElement("h3", "", article.title || "News update")
    );

    const summary = getSummary(article);

    if (summary) content.appendChild(makeElement("p", "", summary));

    appendMetadata(content, article);

    const url = getStoryUrl(article);

    if (url) {
      content.appendChild(
        makeLink(url, "Read the original report ↗", "text-link")
      );
    } else {
      content.appendChild(
        makeElement("p", "small-note", "Original report link not supplied.")
      );
    }

    card.appendChild(content);
    return card;
  }

  /* =========================================================
     FEATURED STORY
     ========================================================= */

  function injectFeaturedJsonLd(story) {
    if (!story || typeof story !== "object") return;

    const url = getStoryUrl(story);
    let domain = "";

    if (url) {
      try {
        domain = new URL(url).hostname.replace(/^www\./, "");
      } catch (_) {
        domain = "";
      }
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: story.title || "Latest global news",
      description: getSummary(story),
      datePublished: isoDate(story.date) || undefined,
      author: {
        "@type": "Organization",
        name: story.source || "RadiantWaves Media"
      },
      publisher: {
        "@type": "Organization",
        name: "RadiantWaves Media",
        logo: {
          "@type": "ImageObject",
          url: new URL("./logo.png", window.location.href).href
        }
      },
      mainEntityOfPage: url || undefined
    };

    if (domain) jsonLd.isBasedOn = url;

    let tag = $("featured-jsonld");

    if (!tag) {
      tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.id = "featured-jsonld";
      document.head.appendChild(tag);
    }

    tag.textContent = JSON.stringify(jsonLd);
  }

  function renderFeaturedStory(story) {
    const container = $("featured-news");
    if (!container) return;

    if (!story || typeof story !== "object") {
      replaceContents(container, [
        placeholder("No featured story is available in this edition.")
      ]);
      return;
    }

    const wrapper = makeElement("div", "featured-copy");

    wrapper.appendChild(
      makeElement("span", "news-category", "FEATURED STORY")
    );

    wrapper.appendChild(
      makeElement("h2", "", story.title || "Latest global news")
    );

    const body = getSummary(story);

    if (body) wrapper.appendChild(makeElement("p", "", body));

    appendMetadata(wrapper, story);

    const url = getStoryUrl(story);

    if (url) {
      wrapper.appendChild(
        makeLink(url, "Read the original report ↗", "text-link")
      );
    } else {
      wrapper.appendChild(
        makeElement("p", "small-note", "Original report link not supplied.")
      );
    }

    replaceContents(container, [wrapper]);
    injectFeaturedJsonLd(story);
  }

  /* =========================================================
     TOP STORIES
     ========================================================= */

  function renderTopStories(stories) {
    const container = $("top-stories-container");
    if (!container) return;

    if (!Array.isArray(stories) || !stories.length) {
      replaceContents(container, [
        placeholder("No top stories are available in this edition.")
      ]);
      return;
    }

    replaceContents(
      container,
      stories.map((story) =>
        makeArticleCard(story, story.category || "Top story")
      )
    );
  }

  /* =========================================================
     CATEGORY NEWS
     ========================================================= */

  function normaliseCategory(value) {
    const category = String(value || "").toLowerCase().trim();

    const aliases = {
      us: "usa",
      "united states": "usa",
      "u.s.": "usa",
      "u.s.a.": "usa",
      uk: "europe",
      "united kingdom": "europe",
      britain: "europe",
      "great britain": "europe",
      tech: "technology",
      "world news": "world",
      "african news": "africa",
      "european news": "europe",
      "asian news": "asia"
    };

    return aliases[category] || category;
  }

  function renderCategoryArticles(articles) {
    Object.entries(CATEGORY_TARGETS).forEach(([category, targetId]) => {
      const container = $(targetId);
      if (!container) return;

      const matching = Array.isArray(articles)
        ? articles.filter(
            (article) => normaliseCategory(article.category) === category
          )
        : [];

      if (!matching.length) {
        replaceContents(container, [
          placeholder(
            `No ${CATEGORY_LABELS[category]} articles are available in this edition.`
          )
        ]);
        return;
      }

      replaceContents(
        container,
        matching.map((article) =>
          makeArticleCard(article, CATEGORY_LABELS[category])
        )
      );
    });
  }

  /* =========================================================
     LEADERS WATCH
     ========================================================= */

  function renderLeaderPhoto(item, displayName) {
    const imageUrl = safeUrl(
      item.image ||
      item.photo ||
      item.imageUrl ||
      item.bannerImage ||
      item.portrait
    );

    const frame = makeElement("div", "leader-image-wrap");

    if (!imageUrl) {
      const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

      const fallback = makeElement(
        "div",
        "leader-photo-placeholder",
        initials || "RW"
      );

      fallback.setAttribute("role", "img");
      fallback.setAttribute(
        "aria-label",
        "No photograph supplied for " + displayName
      );

      frame.appendChild(fallback);
      return frame;
    }

    const image = document.createElement("img");

    image.className = "leader-photo";
    image.src = imageUrl;
    image.alt = "Photograph of " + displayName;
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.remove();
      frame.appendChild(
        makeElement("div", "leader-photo-placeholder", "Photo unavailable")
      );
    }, { once: true });

    frame.appendChild(image);
    return frame;
  }

  function renderLeadersWatch(data) {
    const grid = $("leaders-grid");
    if (!grid) return;

    const updates = data.leadersWatch || data.leaders || {};
    let entries = [];

    if (Array.isArray(updates)) {
      entries = updates
        .filter((item) => item && typeof item === "object")
        .map((item) => [item.name || item.id || "World leader", item]);
    } else if (updates && typeof updates === "object") {
      entries = Object.entries(updates);
    }

    if (!entries.length) {
      replaceContents(grid, [
        placeholder("Leaders Watch is awaiting verified updates for this edition.")
      ]);
      return;
    }

    const cards = entries.map(([name, originalItem]) => {
      const item =
        originalItem && typeof originalItem === "object"
          ? originalItem
          : { summary: String(originalItem || "") };

      const displayName = item.name || name;
      const card = makeElement("article", "card news-card leader-card");

      card.appendChild(renderLeaderPhoto(item, displayName));

      const content = makeElement("div", "card-content");

      content.appendChild(
        makeElement("span", "news-category", "LEADERS WATCH")
      );
      content.appendChild(makeElement("h3", "leader-name", displayName));

      if (item.role) {
        content.appendChild(makeElement("p", "leader-role", item.role));
      }

      if (item.title) {
        content.appendChild(
          makeElement("h4", "leader-headline", item.title)
        );
      }

      if (item.date) {
        const dateLine = makeElement("p", "story-date");
        dateLine.appendChild(makeTimeElement(item.date, "Update date:"));
        content.appendChild(dateLine);
      }

      const summary = getSummary(item);

      if (summary) {
        content.appendChild(makeElement("p", "leader-summary", summary));
      }

      if (item.status) {
        content.appendChild(makeElement("p", "leader-status", item.status));
      }

      if (item.source) {
        content.appendChild(
          makeElement("p", "story-source", "Source: " + item.source)
        );
      }

      const sourceUrl = getStoryUrl(item);

      if (sourceUrl) {
        content.appendChild(
          makeLink(
            sourceUrl,
            item.linkText || "Read the source report ↗",
            "text-link"
          )
        );
      } else if (item.status) {
        content.appendChild(
          makeElement(
            "p",
            "small-note",
            "No source link is attached. Check a reliable source before publishing a new statement."
          )
        );
      } else {
        content.appendChild(
          makeElement(
            "p",
            "small-note",
            "A verified source link has not yet been supplied."
          )
        );
      }

      card.appendChild(content);
      return card;
    });

    replaceContents(grid, cards);
  }

  /* =========================================================
     BREAKING NEWS TICKER
     Duplicates the headlines for a continuous CSS loop.
     Slows the existing CSS animation without changing its
     visual design.
     ========================================================= */

  function renderBreakingTicker(items) {
    const ticker = $("breaking-ticker");
    if (!ticker) return;

    const messages = Array.isArray(items)
      ? items.filter(
          (item) => typeof item === "string" && item.trim()
        )
      : [];

    if (!messages.length) {
      ticker.textContent =
        "Welcome to RadiantWaves Media — your global news update.";
      return;
    }

    const buildSequence = (hidden) => {
      const sequence = makeElement(
        "span",
        "ticker-sequence" + (hidden ? " ticker-sequence--clone" : "")
      );

      if (hidden) sequence.setAttribute("aria-hidden", "true");

      messages.forEach((message, index) => {
        if (index > 0) {
          sequence.appendChild(
            makeElement("span", "ticker-separator", " ◆ ")
          );
        }

        sequence.appendChild(
          makeElement("span", "ticker-item", message)
        );
      });

      return sequence;
    };

    ticker.replaceChildren(buildSequence(false), buildSequence(true));

    /*
     * Make the ticker approximately 1.7 times slower when its
     * animation is applied to .ticker-sequence in style.css.
     */
    ticker.querySelectorAll(".ticker-sequence").forEach((sequence) => {
      const animation = window.getComputedStyle(sequence).animationDuration;
      const seconds = parseFloat(animation);

      if (animation.includes("s") && Number.isFinite(seconds) && seconds > 0) {
        sequence.style.animationDuration = (seconds * 1.7) + "s";
      }
    });
  }

  /* =========================================================
     MORNING SUMMARY AND EDITORIAL NOTE
     ========================================================= */

  function renderMorningSummary(data) {
    setText(
      "morning-summary",
      data.morningSummary ||
        "The latest global summary will appear here when published."
    );

    setText(
      "editorial-note",
      data.editorialNote ||
        "Check original sources and compare reliable reports before drawing conclusions."
    );
  }

  /* =========================================================
     BIG QUESTION AND THOUGHT FOR TODAY
     ========================================================= */

  function renderQuestionAndQuote(data) {
    setText(
      "big-question",
      data.bigQuestion ||
        "When leaders make decisions about conflict, fuel prices and the economy, what should matter most: national security, economic stability or the everyday wellbeing of citizens?"
    );

    const quote = $("quote-of-the-day");
    if (!quote) return;

    const quoteData = data.quoteOfTheDay;
    let quoteText = "";
    let author = "RadiantWaves Media";

    if (typeof quoteData === "string") {
      quoteText = quoteData;
    } else if (quoteData && typeof quoteData === "object") {
      quoteText = quoteData.quote || quoteData.text || "";
      author = quoteData.author || author;
    }

    if (!quoteText) {
      quoteText =
        "Stay curious about the world, question what you hear, and look beyond the headline.";
    }

    quote.replaceChildren(
      makeElement("p", "", "\u201C" + quoteText + "\u201D")
    );

    const credit = quote.parentElement
      ? quote.parentElement.querySelector(".quote-credit")
      : null;

    if (credit) credit.textContent = author;
  }

  /* =========================================================
     BREAKING NEWS BRIEFS
     ========================================================= */

  function renderHistory(items) {
    const container = $("history-container");
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      replaceContents(container, [
        placeholder("No breaking news briefs are available.")
      ]);
      return;
    }

    const cards = items.map((item) => {
      const card = makeElement("article", "history-card");

      if (typeof item === "string") {
        card.appendChild(makeElement("p", "", item));
        return card;
      }

      if (!item || typeof item !== "object") return card;

      if (item.date) {
        const dateLine = makeElement("p", "story-date");
        dateLine.appendChild(makeTimeElement(item.date));
        card.appendChild(dateLine);
      }

      card.appendChild(
        makeElement("h3", "", item.title || "News development")
      );

      const summary = getSummary(item);
      if (summary) card.appendChild(makeElement("p", "", summary));

      if (item.source) {
        card.appendChild(
          makeElement("p", "story-source", "Source: " + item.source)
        );
      }

      const url = getStoryUrl(item);

      if (url) {
        card.appendChild(
          makeLink(url, "Read source report ↗", "text-link")
        );
      }

      return card;
    });

    replaceContents(container, cards);
  }

  /* =========================================================
     NEWS ARCHIVE
     ========================================================= */

  function renderArchive(data) {
    const container = $("archive-list");
    if (!container) return;

    const stories = [
      ...(Array.isArray(data.topStories) ? data.topStories : []),
      ...(Array.isArray(data.articles) ? data.articles : [])
    ];

    if (data.featured && typeof data.featured === "object") {
      stories.unshift(data.featured);
    }

    if (!stories.length) {
      replaceContents(container, [
        placeholder("The archive is awaiting published stories.")
      ]);
      return;
    }

    const cards = stories.map((article) => {
      const card = makeElement("article", "archive-card");

      card.appendChild(
        makeElement("h3", "", article.title || "News report")
      );

      const metadataLine = makeElement("p", "story-meta");

      const parts = [
        article.category || "Global news",
        article.source || ""
      ].filter(Boolean);

      if (parts.length) {
        metadataLine.appendChild(
          makeElement("span", "", parts.join(" · "))
        );
      }

      if (article.date) {
        if (parts.length) {
          metadataLine.appendChild(makeElement("span", "", " · "));
        }

        metadataLine.appendChild(makeTimeElement(article.date));
      }

      if (metadataLine.childNodes.length) {
        card.appendChild(metadataLine);
      }

      const url = getStoryUrl(article);

      if (url) {
        card.appendChild(
          makeLink(url, "Open original source ↗", "text-link")
        );
      }

      return card;
    });

    replaceContents(container, cards);
  }

  /* =========================================================
     SPONSORED ADVERTS
     FIX: displays image, subtitle, description, products
     and the supplied link from news.json.
     ========================================================= */

  function renderAdverts(items) {
    const container = $("sponsored-adverts");
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      replaceContents(container, [
        placeholder(
          "Advertise with RadiantWaves Media. Contact our team to discuss available opportunities."
        )
      ]);
      return;
    }

    const cards = items.map((item) => {
      const card = makeElement("article", "advert-card");

      card.appendChild(
        makeElement("span", "advert-label", item.label || "Sponsored")
      );

      /*
       * Advert image: reads paths such as assets/spices.jpeg
       * and assets/stonebreaker.jpeg from news.json.
       */
      if (item.image) {
        const imageUrl = safeUrl(item.image);

        if (imageUrl) {
          const image = document.createElement("img");
          image.className = "advert-image";
          image.src = imageUrl;
          image.alt = item.imageAlt || item.title || "Sponsored advert";
          image.loading = "lazy";
          image.decoding = "async";

          image.style.display = "block";
          image.style.width = "100%";
          image.style.maxWidth = "100%";
          image.style.height = "auto";
          image.style.maxHeight = "260px";
          image.style.objectFit = "contain";
          image.style.margin = "12px 0";
          image.style.borderRadius = "8px";

          image.addEventListener("error", () => {
            image.alt = "Advert image unavailable";
            image.style.display = "none";
            console.error("RadiantWaves advert image could not load:", item.image);
          }, { once: true });

          card.appendChild(image);
        }
      }

      card.appendChild(
        makeElement(
          "h3",
          "",
          item.title || "Advertise with RadiantWaves Media"
        )
      );

      if (item.subtitle) {
        card.appendChild(makeElement("h4", "advert-subtitle", item.subtitle));
      }

      const description = getSummary(item);

      if (description) {
        card.appendChild(makeElement("p", "", description));
      }

      if (Array.isArray(item.products) && item.products.length) {
        const list = makeElement("ul", "advert-products");

        item.products.forEach((product) => {
          list.appendChild(makeElement("li", "", String(product)));
        });

        card.appendChild(list);
      }

      /*
       * Accept either "link" or "url" from news.json.
       * Ignore "#" placeholders and use the advertising email
       * instead of sending visitors to the top of the page.
       */
      const suppliedLink = item.url || item.link || "";
      const usableLink =
        suppliedLink.trim() && suppliedLink.trim() !== "#"
          ? safeUrl(suppliedLink, true)
          : "";

      if (usableLink) {
        card.appendChild(
          makeLink(
            usableLink,
            item.button || item.linkText || "Find out more ↗",
            "text-link"
          )
        );
      } else {
        card.appendChild(
          makeLink(
            "mailto:" + CONFIG.CONTACT_EMAIL,
            item.button || "Contact our advertising team ↗",
            "text-link"
          )
        );
      }

      return card;
    });

    replaceContents(container, cards);
  }

  /* =========================================================
     HERO VIDEO AND HEADLINES
     ========================================================= */

  function renderHero(data) {
    const hero =
      data.hero && typeof data.hero === "object" ? data.hero : {};

    setText("hero-title", hero.title || "Gateway to Your World News");

    setText(
      "hero-desc",
      hero.description || "Connecting you to the stories shaping our world."
    );

    setText(
      "edition-date",
      [data.edition, data.date].filter(Boolean).join(" · ") ||
        "Global News Edition"
    );

    setText(
      "hero-marquee",
      hero.marquee ||
        "World · USA · Canada · Europe · UK · Africa · Asia · Australia"
    );

    const video = $("heroVideo");

    if (video && hero.video) {
      const validVideo = safeUrl(hero.video);

      if (validVideo && video.dataset.src !== validVideo) {
        video.dataset.src = validVideo;
        video.src = validVideo;
        video.load();
      }
    }
  }

  /* =========================================================
     RENDER ALL SECTIONS
     ========================================================= */

  function renderAll(data) {
    renderHero(data);
    renderFeaturedStory(data.featured);
    renderTopStories(data.topStories);
    renderCategoryArticles(data.articles);
    renderLeadersWatch(data);
    renderBreakingTicker(data.breaking);
    renderMorningSummary(data);
    renderQuestionAndQuote(data);
    renderHistory(data.breakingHistory);
    renderArchive(data);
    renderAdverts(data.sponsoredAdverts);

    setText("copyright-year", String(new Date().getFullYear()));

    document.dispatchEvent(
      new CustomEvent("radiantwaves:newsloaded", {
        detail: { edition: data.edition || data.date || "" }
      })
    );
  }

  /* =========================================================
     LOAD NEWS.JSON
     ========================================================= */

  async function loadNews() {
    try {
      const response = await fetch(CONFIG.NEWS_FILE, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Could not load news.json (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("news.json must contain a JSON object.");
      }

      renderAll(data);

      console.info(
        "RadiantWaves Media news loaded:",
        data.edition || data.date || "Edition"
      );
    } catch (error) {
      console.error("RadiantWaves news loading error:", error);

      const message =
        "The news feed could not be loaded. Check that news.json contains valid JSON and that the latest changes have been committed.";

      [
        "featured-news",
        "top-stories-container",
        "leaders-grid",
        "history-container",
        "archive-list",
        "sponsored-adverts"
      ].forEach((id) => {
        const container = $(id);

        if (container) replaceContents(container, [placeholder(message)]);
      });

      Object.values(CATEGORY_TARGETS).forEach((id) => {
        const container = $(id);

        if (container) replaceContents(container, [placeholder(message)]);
      });

      setText("breaking-ticker", "News feed temporarily unavailable.");
    }
  }

  /* =========================================================
     VIDEO SOUND CONTROL
     ========================================================= */

  function setupSoundButton() {
    const button = $("sound-button");
    const video = $("heroVideo");

    if (!button || !video) return;

    video.muted = true;
    video.playsInline = true;

    function updateButton() {
      button.replaceChildren();

      const icon = makeElement(
        "i",
        video.muted
          ? "fa-solid fa-volume-xmark"
          : "fa-solid fa-volume-high"
      );

      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);

      button.appendChild(
        document.createTextNode(
          video.muted ? " Enable sound" : " Turn sound off"
        )
      );

      button.setAttribute("aria-pressed", String(!video.muted));
    }

    button.addEventListener("click", async () => {
      video.muted = !video.muted;

      if (!video.muted) {
        try {
          await video.play();
        } catch (error) {
          console.warn("Video playback could not start.", error);
        }
      }

      updateButton();
    });

    updateButton();
  }

  /* =========================================================
     VIDEO SELECTION BUTTONS
     ========================================================= */

  function setupVideoButtons() {
    const video = $("heroVideo");
    if (!video) return;

    const buttons = document.querySelectorAll("[data-video]");

    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("is-active"))
      );

      button.addEventListener("click", async () => {
        const path = button.getAttribute("data-video");
        const validPath = safeUrl(path);

        if (!validPath) {
          console.warn("Invalid video path:", path);
          return;
        }

        video.src = validPath;
        video.load();

        buttons.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        if (prefersReducedMotion.matches) {
          video.pause();
          return;
        }

        try {
          await video.play();
        } catch (error) {
          console.warn("The selected video could not autoplay.", error);
        }
      });
    });
  }

  /* =========================================================
     VIDEO POLITENESS
     ========================================================= */

  function setupVideoPoliteness() {
    const video = $("heroVideo");
    if (!video) return;

    if (prefersReducedMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
    }

    prefersReducedMotion.addEventListener("change", (event) => {
      if (event.matches) {
        video.pause();
      } else if (!video.paused) {
        video.play().catch(() => {});
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        video.pause();
      } else if (
        !prefersReducedMotion.matches &&
        video.autoplay !== false
      ) {
        video.play().catch(() => {});
      }
    });
  }

  /* =========================================================
     ADVERT REQUEST FORM
     ========================================================= */

  function buildMailto(form, formData) {
    const name = String(formData.get("Full name") || "").trim();
    const email = String(formData.get("Email address") || "").trim();
    const whatsapp = String(formData.get("WhatsApp number") || "").trim();
    const organisation = String(
      formData.get("Business or organisation") || ""
    ).trim();
    const service = String(formData.get("Service") || "").trim();
    const details = String(formData.get("Details") || "").trim();

    const subject = encodeURIComponent(
      "RadiantWaves Media — " + (service || "Website enquiry")
    );

    const body = encodeURIComponent(
      "Advertising / Publicity Enquiry\n\n" +
      "Name: " + name + "\n" +
      "Email: " + email + "\n" +
      "WhatsApp: " + (whatsapp || "Not supplied") + "\n" +
      "Business / Organisation: " + (organisation || "Not supplied") + "\n" +
      "Service required: " + service + "\n\n" +
      "Details:\n" + details
    );

    return (
      "mailto:" + CONFIG.CONTACT_EMAIL +
      "?subject=" + subject +
      "&body=" + body
    );
  }

  function setFormStatus(form, message, isError = false) {
    let status = form.querySelector(".form-status");

    if (!status) {
      status = makeElement("p", "form-status");
      status.setAttribute("role", "status");
      form.appendChild(status);
    }

    status.textContent = message;
    status.classList.toggle("form-status--error", isError);
  }

  function setupAdvertForm() {
    const form = $("advert-request-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const formData = new FormData(form);

      if (!CONFIG.FORM_ACCESS_KEY) {
        window.location.href = buildMailto(form, formData);
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) submitButton.disabled = true;

      setFormStatus(form, "Sending your request…");

      try {
        const payload = {
          access_key: CONFIG.FORM_ACCESS_KEY,
          subject:
            "RadiantWaves Media — " +
            (String(formData.get("Service") || "").trim() ||
              "Website enquiry"),
          from_name: String(formData.get("Full name") || "").trim(),
          name: String(formData.get("Full name") || "").trim(),
          email: String(formData.get("Email address") || "").trim(),
          whatsapp: String(formData.get("WhatsApp number") || "").trim(),
          organisation: String(
            formData.get("Business or organisation") || ""
          ).trim(),
          service: String(formData.get("Service") || "").trim(),
          details: String(formData.get("Details") || "").trim()
        };

        const response = await fetch(CONFIG.FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          setFormStatus(
            form,
            "Thank you — your request has been sent. Our advertising team will reply to your email address."
          );
          form.reset();
        } else {
          throw new Error(
            result.message || "The form service rejected the request."
          );
        }
      } catch (error) {
        console.error("Advert form error:", error);

        setFormStatus(
          form,
          "Sending failed. Your email application will open instead so you can still send the request.",
          true
        );

        window.location.href = buildMailto(form, formData);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  function setupMobileNavigation() {
    const toggle = $("nav-toggle");
    const menu = $("nav-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute(
        "aria-label",
        expanded ? "Open menu" : "Close menu"
      );

      menu.classList.toggle("is-open", !expanded);
      document.body.classList.toggle("nav-open", !expanded);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        toggle.focus();
      }
    });
  }

  /* =========================================================
     STARTUP
     ========================================================= */

  function start() {
    setupSoundButton();
    setupVideoButtons();
    setupVideoPoliteness();
    setupMobileNavigation();
    setupAdvertForm();
    loadNews();

    if (CONFIG.NEWS_REFRESH_INTERVAL > 0) {
      window.setInterval(loadNews, CONFIG.NEWS_REFRESH_INTERVAL);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

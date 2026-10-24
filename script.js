/* =========================================================
   RADIANTWAVES MEDIA — SCRIPT.JS
   Complete corrected replacement
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

  /* GENERAL HELPERS */

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

    return (
      item.summary ||
      item.description ||
      item.content ||
      item.body ||
      item.text ||
      ""
    );
  }

  function getStoryUrl(item) {
    if (!item || typeof item !== "object") return "";

    return safeUrl(item.url || item.sourceUrl || item.link);
  }

  function appendMetadata(content, item, options = {}) {
    const { showDate = true, datePrefix = "" } = options;
    const fragment = document.createDocumentFragment();

    if (item.source) {
      fragment.appendChild(
        makeElement("span", "story-source", "Source: " + item.source)
      );
    }

    if (showDate && item.date) {
      if (item.source) {
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

  /* STANDARD NEWS CARDS */

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

    if (summary) {
      content.appendChild(makeElement("p", "", summary));
    }

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

  /* FEATURED STORY */

  function injectFeaturedJsonLd(story) {
    if (!story || typeof story !== "object") return;

    const url = getStoryUrl(story);

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

    const summary = getSummary(story);

    if (summary) {
      wrapper.appendChild(makeElement("p", "", summary));
    }

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

  /* TOP STORIES */

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

  /* CATEGORY NORMALISATION */

  function normaliseCategory(value) {
    const category = String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    const aliases = {
      us: "usa",
      "u.s.": "usa",
      "u.s.a.": "usa",
      america: "usa",
      "united states": "usa",
      "united states of america": "usa",

      uk: "europe",
      britain: "europe",
      "great britain": "europe",
      "united kingdom": "europe",
      "uk news": "europe",
      france: "europe",
      "european news": "europe",

      tech: "technology",
      "digital technology": "technology",
      "innovation and digital change": "technology",

      international: "world",
      global: "world",
      "world news": "world",
      "international affairs": "world",

      "african news": "africa",
      "asia news": "asia",
      "asian news": "asia",

      economy: "business",
      markets: "business",
      finance: "business",
      "markets and the economy": "business",

      "nigeria politics": "nigeria politics",
      politics: "nigeria politics"
    };

    return aliases[category] || category;
  }

  /*
   * Collect articles from the supported JSON locations.
   * Your current edition stores stories under topStories,
   * so category rendering must not rely on data.articles alone.
   */

  function getAllArticles(data) {
    const result = [];
    const seen = new Set();

    function addArticle(article, forcedCategory = "") {
      if (!article || typeof article !== "object") return;

      const copy = {
        ...article,
        category: article.category || forcedCategory || ""
      };

      const identity = [
        copy.title || "",
        copy.url || copy.sourceUrl || copy.link || "",
        copy.source || ""
      ].join("|");

      if (seen.has(identity)) return;

      seen.add(identity);
      result.push(copy);
    }

    if (Array.isArray(data.articles)) {
      data.articles.forEach((article) => addArticle(article));
    }

    if (Array.isArray(data.topStories)) {
      data.topStories.forEach((article) => addArticle(article));
    }

    if (data.categories && typeof data.categories === "object") {
      Object.entries(data.categories).forEach(([category, stories]) => {
        if (Array.isArray(stories)) {
          stories.forEach((article) => addArticle(article, category));
        }
      });
    }

    return result;
  }

  /* CATEGORY NEWS */

  function renderCategoryArticles(data) {
    const articles = getAllArticles(data);

    Object.entries(CATEGORY_TARGETS).forEach(([category, targetId]) => {
      const container = $(targetId);
      if (!container) return;

      let matching = articles.filter(
        (article) =>
          normaliseCategory(article.category) === category
      );

      /*
       * The supplied JSON does not currently contain a dedicated
       * World category. When necessary, show international reports
       * from the available top stories instead of an empty section.
       */
      if (category === "world" && matching.length === 0) {
        matching = articles.filter((article) => {
          const articleCategory = normaliseCategory(article.category);

          return (
            articleCategory !== "nigeria politics" &&
            articleCategory !== "technology"
          );
        });
      }

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

  /* LEADERS WATCH */

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
      if (Array.isArray(updates.leaders)) {
        entries = updates.leaders
          .filter((item) => item && typeof item === "object")
          .map((item) => [item.name || item.id || "World leader", item]);
      } else {
        entries = Object.entries(updates).filter(
          ([key, value]) =>
            key !== "note" &&
            value &&
            typeof value === "object"
        );
      }
    }

    const note =
      updates && !Array.isArray(updates) && typeof updates === "object"
        ? updates.note
        : "";

    const noteElement = $("leaders-note");

    if (noteElement) {
      noteElement.textContent = note ||
        "Check a reliable original source before publishing a new statement or claim.";
    }

    if (!entries.length) {
      replaceContents(grid, [
        placeholder(
          "No leader records are supplied in this edition. Restore the verified leader entries and image paths in news.json to display their profiles and photographs."
        )
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

      const url = getStoryUrl(item);

      if (url) {
        content.appendChild(
          makeLink(
            url,
            item.linkText || "Read the source report ↗",
            "text-link"
          )
        );
      } else {
        content.appendChild(
          makeElement(
            "p",
            "small-note",
            "No verified source link is attached. Check a reliable source before publishing a new statement."
          )
        );
      }

      card.appendChild(content);
      return card;
    });

    replaceContents(grid, cards);
  }

  /* BREAKING NEWS TICKER */

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

    function buildSequence(hidden) {
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
    }

    ticker.replaceChildren(
      buildSequence(false),
      buildSequence(true)
    );

    /* Slow the existing ticker animation by approximately 70%. */
    ticker.querySelectorAll(".ticker-sequence").forEach((sequence) => {
      const animation =
        window.getComputedStyle(sequence).animationDuration;

      const seconds = parseFloat(animation);

      if (
        animation.includes("s") &&
        Number.isFinite(seconds) &&
        seconds > 0
      ) {
        sequence.style.animationDuration = (seconds * 1.7) + "s";
      }
    });
  }

  /* SUMMARY AND EDITORIAL NOTE */

  function renderMorningSummary(data) {
    setText(
      "morning-summary",
      data.morningSummary ||
        data.summary ||
        "The latest global summary will appear here when published."
    );

    setText(
      "editorial-note",
      data.editorialNote ||
        "Check original sources and compare reliable reports before drawing conclusions."
    );
  }

  /* TODAY'S BIG QUESTION AND THOUGHT FOR TODAY */

  function renderQuestionAndQuote(data) {
    const questionElement = $("big-question");

    if (questionElement) {
      const questionData = data.bigQuestion || data.todaysBigQuestion;
      let questionText = "";

      if (typeof questionData === "string") {
        questionText = questionData;
      } else if (questionData && typeof questionData === "object") {
        questionText =
          questionData.question ||
          questionData.text ||
          "";
      }

      questionElement.textContent = questionText ||
        "What should voters expect from their leaders, and how should public promises be measured?";

      if (
        questionData &&
        typeof questionData === "object" &&
        questionData.prompt
      ) {
        const parent = questionElement.parentElement;
        let prompt = parent
          ? parent.querySelector(".big-question-prompt")
          : null;

        if (!prompt && parent) {
          prompt = makeElement("p", "big-question-prompt");
          questionElement.insertAdjacentElement("afterend", prompt);
        }

        if (prompt) prompt.textContent = questionData.prompt;
      }
    }

    const quote = $("quote-of-the-day");
    if (!quote) return;

    const quoteData = data.quoteOfTheDay || data.thoughtForToday;
    let quoteText = "";
    let author = "RadiantWaves Media";

    if (typeof quoteData === "string") {
      quoteText = quoteData;
    } else if (quoteData && typeof quoteData === "object") {
      quoteText = quoteData.quote || quoteData.text || "";
      author =
        quoteData.author ||
        quoteData.title ||
        author;
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

  /* BREAKING NEWS HISTORY */

  function renderHistory(items) {
    const container = $("history-container");
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      replaceContents(container, [
        placeholder(
          "No archived breaking-news briefs are available for this edition."
        )
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

      if (summary) {
        card.appendChild(makeElement("p", "", summary));
      }

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

  /* ARCHIVE */

  function renderArchive(data) {
    const container = $("archive-list");
    if (!container) return;

    const stories = [];
    const seen = new Set();

    function addStory(story) {
      if (!story || typeof story !== "object") return;

      const key = [
        story.title || "",
        story.url || story.sourceUrl || story.link || ""
      ].join("|");

      if (seen.has(key)) return;

      seen.add(key);
      stories.push(story);
    }

    if (data.featured) addStory(data.featured);

    if (Array.isArray(data.topStories)) {
      data.topStories.forEach(addStory);
    }

    if (Array.isArray(data.articles)) {
      data.articles.forEach(addStory);
    }

    /*
     * Accept real archive records if added to news.json later.
     * These fields must contain actual records, not just titles.
     */
    const archived = data.archives || data.archiveRecords || data.archive;

    if (Array.isArray(archived)) {
      archived.forEach((edition) => {
        if (Array.isArray(edition.articles)) {
          edition.articles.forEach((article) => {
            addStory({
              ...article,
              date: article.date || edition.date,
              edition: edition.edition || edition.title || ""
            });
          });
        } else if (Array.isArray(edition.topStories)) {
          edition.topStories.forEach((article) => {
            addStory({
              ...article,
              date: article.date || edition.date,
              edition: edition.edition || edition.title || ""
            });
          });
        } else {
          addStory(edition);
        }
      });
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

      const metadata = makeElement("p", "story-meta");

      const parts = [
        article.category || "Global news",
        article.source || "",
        article.edition || ""
      ].filter(Boolean);

      if (parts.length) {
        metadata.appendChild(
          makeElement("span", "", parts.join(" · "))
        );
      }

      if (article.date) {
        if (parts.length) {
          metadata.appendChild(makeElement("span", "", " · "));
        }

        metadata.appendChild(makeTimeElement(article.date));
      }

      if (metadata.childNodes.length) {
        card.appendChild(metadata);
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

  /* SPONSORED ADVERTS */

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

      if (item.image) {
        const imageUrl = safeUrl(item.image);

        if (imageUrl) {
          const image = document.createElement("img");

          image.className = "advert-image";
          image.src = imageUrl;
          image.alt = item.imageAlt || item.title || "Sponsored advert";
          image.loading = "lazy";
          image.decoding = "async";

          image.addEventListener("error", () => {
            image.style.display = "none";
            console.error(
              "RadiantWaves advert image could not load:",
              item.image
            );
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
        card.appendChild(
          makeElement("h4", "advert-subtitle", item.subtitle)
        );
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

      const suppliedLink = item.url || item.link || "";
      const validLink =
        suppliedLink.trim() && suppliedLink.trim() !== "#"
          ? safeUrl(suppliedLink, true)
          : "";

      if (validLink) {
        card.appendChild(
          makeLink(
            validLink,
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

  /* HERO */

  function renderHero(data) {
    const hero =
      data.hero && typeof data.hero === "object" ? data.hero : {};

    setText(
      "hero-title",
      hero.title || "Gateway to Your World News"
    );

    setText(
      "hero-desc",
      hero.description ||
        hero.subtitle ||
        "Connecting you to the stories shaping our world."
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

  /* RENDER ALL SECTIONS */

  function renderAll(data) {
    renderHero(data);
    renderFeaturedStory(data.featured);
    renderTopStories(data.topStories);

    /* Pass the entire JSON object, not data.articles alone. */
    renderCategoryArticles(data);

    renderLeadersWatch(data);
    renderBreakingTicker(data.breaking);
    renderMorningSummary(data);
    renderQuestionAndQuote(data);

    renderHistory(
      data.breakingHistory ||
      data.breakingNewsHistory ||
      data.history
    );

    renderArchive(data);
    renderAdverts(data.sponsoredAdverts);

    setText("copyright-year", String(new Date().getFullYear()));

    document.dispatchEvent(
      new CustomEvent("radiantwaves:newsloaded", {
        detail: {
          edition: data.edition || data.date || ""
        }
      })
    );
  }

  /* LOAD NEWS.JSON */

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

        if (container) {
          replaceContents(container, [placeholder(message)]);
        }
      });

      Object.values(CATEGORY_TARGETS).forEach((id) => {
        const container = $(id);

        if (container) {
          replaceContents(container, [placeholder(message)]);
        }
      });

      setText("breaking-ticker", "News feed temporarily unavailable.");
    }
  }

  /* VIDEO SOUND CONTROL */

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

  /* VIDEO SELECTION BUTTONS */

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

  /* REDUCED MOTION AND PAGE VISIBILITY */

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

  /* ADVERT REQUEST FORM */

  function buildMailto(formData) {
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
      "Business / Organisation: " +
      (organisation || "Not supplied") + "\n" +
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
        window.location.href = buildMailto(formData);
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

        window.location.href = buildMailto(formData);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  /* MOBILE NAVIGATION */

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

  /* STARTUP */

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

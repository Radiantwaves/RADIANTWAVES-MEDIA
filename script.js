
/* =========================================================
   RADIANTWAVES MEDIA — COMPLETE SCRIPT.JS
   Leaders Watch photos, verified source links and summaries
   ========================================================= */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json?v=5002";

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

  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    const element = $(id);

    if (element && value !== undefined && value !== null) {
      element.textContent = String(value);
    }
  }

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);

      if (url.protocol === "https:" || url.protocol === "http:") {
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

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    if (className) element.className = className;

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }

  function makeLink(url, label, className = "source-link") {
    const link = makeElement("a", className, label);
    const validUrl = safeUrl(url);

    if (validUrl) {
      link.href = validUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.setAttribute("aria-disabled", "true");
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

  /* =========================================================
     STANDARD NEWS ARTICLE CARDS
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

    const summary =
      article.summary ||
      article.description ||
      article.content ||
      "";

    if (summary) {
      content.appendChild(makeElement("p", "", summary));
    }

    const metadata = [
      article.source ? "Source: " + article.source : "",
      formatDate(article.date)
    ].filter(Boolean).join(" · ");

    if (metadata) {
      content.appendChild(makeElement("p", "story-source", metadata));
    }

    const url = safeUrl(article.url);

    if (url) {
      content.appendChild(
        makeLink(url, "Read the original report ↗", "text-link")
      );
    } else {
      content.appendChild(
        makeElement(
          "p",
          "small-note",
          "Original report link not supplied."
        )
      );
    }

    card.appendChild(content);
    return card;
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

    const body = story.content || story.summary || story.description || "";

    if (body) {
      wrapper.appendChild(makeElement("p", "", body));
    }

    const metadata = [
      story.source ? "Source: " + story.source : "",
      formatDate(story.date)
    ].filter(Boolean).join(" · ");

    if (metadata) {
      wrapper.appendChild(
        makeElement("p", "story-source", metadata)
      );
    }

    if (safeUrl(story.url)) {
      wrapper.appendChild(
        makeLink(story.url, "Read the original report ↗", "text-link")
      );
    } else {
      wrapper.appendChild(
        makeElement(
          "p",
          "small-note",
          "Original report link not supplied."
        )
      );
    }

    replaceContents(container, [wrapper]);
  }

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

  function renderCategoryArticles(articles) {
    Object.entries(CATEGORY_TARGETS).forEach(([category, targetId]) => {
      const container = $(targetId);
      if (!container) return;

      const matching = Array.isArray(articles)
        ? articles.filter((article) => {
            const value = String(article.category || "")
              .toLowerCase()
              .trim();

            if (category === "technology") {
              return value === "technology" || value === "tech";
            }

            if (category === "usa") {
              return [
                "usa",
                "us",
                "united states"
              ].includes(value);
            }

            return value === category;
          })
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
     Supports leader photos, summaries, dates and source links.
     Reads leadersWatch or leaders from news.json.
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
      const fallback = makeElement(
        "div",
        "leader-photo-placeholder",
        displayName
      );

      fallback.setAttribute("role", "img");
      fallback.setAttribute(
        "aria-label",
        "Photograph not supplied for " + displayName
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
        makeElement(
          "div",
          "leader-photo-placeholder",
          "Photograph unavailable"
        )
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
      entries = updates.map((item) => [
        item.name || item.id || "World leader",
        item
      ]);
    } else if (updates && typeof updates === "object") {
      entries = Object.entries(updates);
    }

    if (!entries.length) {
      replaceContents(grid, [
        placeholder(
          "Leaders Watch is awaiting verified updates for this edition."
        )
      ]);
      return;
    }

    const cards = entries.map(([name, item]) => {
      if (!item || typeof item !== "object") {
        item = { summary: String(item || "") };
      }

      const displayName = item.name || name;
      const card = makeElement(
        "article",
        "card news-card leader-card"
      );

      card.appendChild(renderLeaderPhoto(item, displayName));

      const content = makeElement("div", "card-content");

      content.appendChild(
        makeElement("span", "news-category", "LEADERS WATCH")
      );

      content.appendChild(
        makeElement("h3", "leader-name", displayName)
      );

      if (item.role) {
        content.appendChild(
          makeElement("p", "leader-role", item.role)
        );
      }

      if (item.title) {
        content.appendChild(
          makeElement("h4", "leader-headline", item.title)
        );
      }

      if (item.date) {
        content.appendChild(
          makeElement(
            "p",
            "story-date",
            "Updated: " + formatDate(item.date)
          )
        );
      }

      if (item.summary || item.description || item.content) {
        content.appendChild(
          makeElement(
            "p",
            "leader-summary",
            item.summary || item.description || item.content
          )
        );
      }

      /*
       * A status label can distinguish a verified update from
       * a policy discussion or an entry awaiting verification.
       */
      if (item.status) {
        content.appendChild(
          makeElement("p", "leader-status", item.status)
        );
      }

      if (item.source) {
        content.appendChild(
          makeElement("p", "story-source", "Source: " + item.source)
        );
      }

      const sourceUrl = safeUrl(item.url || item.sourceUrl);

      if (sourceUrl) {
        content.appendChild(
          makeLink(
            sourceUrl,
            item.linkText || "Read the source report ↗",
            "text-link"
          )
        );
      } else if (item.status) {
        /*
         * No invented or permanent links. This is suitable
         * for Atiku and Obi policy-watch discussion entries.
         */
        content.appendChild(
          makeElement(
            "p",
            "small-note",
            "No source link is attached to this entry. A source will be added when a relevant report is verified."
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
     ========================================================= */

  function renderBreakingTicker(items) {
    const ticker = $("breaking-ticker");
    if (!ticker) return;

    const messages = Array.isArray(items)
      ? items.filter((item) =>
          typeof item === "string" && item.trim()
        )
      : [];

    if (!messages.length) {
      ticker.textContent =
        "Welcome to RadiantWaves Media — your global news update.";
      return;
    }

    ticker.replaceChildren();

    messages.forEach((message, index) => {
      if (index > 0) {
        ticker.appendChild(
          makeElement("span", "ticker-separator", " ◆ ")
        );
      }

      ticker.appendChild(
        makeElement("span", "ticker-item", message)
      );
    });
  }

  /* =========================================================
     NEWSROOM SUMMARY AND EDITORIAL NOTE
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
      makeElement("p", "", "“" + quoteText + "”")
    );

    const credit = quote.parentElement
      ? quote.parentElement.querySelector(".quote-credit")
      : null;

    if (credit) {
      credit.textContent = author;
    }
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

      if (item.date) {
        card.appendChild(
          makeElement("p", "story-date", formatDate(item.date))
        );
      }

      card.appendChild(
        makeElement("h3", "", item.title || "News development")
      );

      if (item.summary || item.description) {
        card.appendChild(
          makeElement("p", "", item.summary || item.description)
        );
      }

      if (item.source) {
        card.appendChild(
          makeElement("p", "story-source", "Source: " + item.source)
        );
      }

      if (safeUrl(item.url)) {
        card.appendChild(
          makeLink(item.url, "Read source report ↗", "text-link")
        );
      }

      return card;
    });

    replaceContents(container, cards);
  }

  /* =========================================================
     NEWS EDITIONS AND ARCHIVES
     ========================================================= */

  function renderArchive(data) {
    const container = $("archive-list");
    if (!container) return;

    const stories = [
      ...(Array.isArray(data.topStories) ? data.topStories : []),
      ...(Array.isArray(data.articles) ? data.articles : [])
    ];

    if (data.featured) {
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

      const metadata = [
        article.category || "Global news",
        article.source || "",
        formatDate(article.date)
      ].filter(Boolean).join(" · ");

      if (metadata) {
        card.appendChild(makeElement("p", "", metadata));
      }

      if (safeUrl(article.url)) {
        card.appendChild(
          makeLink(article.url, "Open original source ↗", "text-link")
        );
      }

      return card;
    });

    replaceContents(container, cards);
  }

  /* =========================================================
     SPONSORED ADVERTS
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

      card.appendChild(
        makeElement(
          "h3",
          "",
          item.title || "Advertise with RadiantWaves Media"
        )
      );

      if (item.description || item.summary) {
        card.appendChild(
          makeElement("p", "", item.description || item.summary)
        );
      }

      const url = safeUrl(item.url);

      if (url) {
        card.appendChild(
          makeLink(
            url,
            item.linkText || "Find out more ↗",
            "text-link"
          )
        );
      } else {
        card.appendChild(
          makeLink(
            "https://radiantwavesmedia.com",
            "Visit RadiantWaves Media ↗",
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
    const hero = data.hero || {};

    setText(
      "hero-title",
      hero.title || "Gateway to Your World News"
    );

    setText(
      "hero-desc",
      hero.description ||
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

      if (validVideo && video.src !== validVideo) {
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
        detail: {
          edition: data.edition || data.date || ""
        }
      })
    );
  }

  /* =========================================================
     LOAD NEWS.JSON
     ========================================================= */

  async function loadNews() {
    try {
      const response = await fetch(NEWS_FILE, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Could not load news.json (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("news.json must contain a JSON object.");
      }

      renderAll(data);
    } catch (error) {
      console.error("RadiantWaves news loading error:", error);

      const message =
        "The news feed could not be loaded. Check that news.json contains valid JSON and has been committed to the repository.";

      [
        "featured-news",
        "top-stories-container",
        "leaders-grid",
        "history-container"
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

    document.querySelectorAll("[data-video]").forEach((button) => {
      button.addEventListener("click", async () => {
        const path = button.getAttribute("data-video");
        const validPath = safeUrl(path);

        if (!validPath) {
          console.warn("Invalid video path:", path);
          return;
        }

        video.src = validPath;
        video.load();

        document.querySelectorAll("[data-video]").forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        try {
          await video.play();
        } catch (error) {
          console.warn("The selected video could not autoplay.", error);
        }
      });
    });

    document.querySelectorAll("[data-video]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("is-active"))
      );
    });
  }

  /* =========================================================
     ADVERT REQUEST EMAIL FORM
     ========================================================= */

  function setupAdvertForm() {
    const form = $("advert-request-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const formData = new FormData(form);

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

      window.location.href =
        "mailto:info@radiantwavesmedia.com?subject=" +
        subject + "&body=" + body;
    });
  }

  /* =========================================================
     OPTIONAL MOBILE NAVIGATION
     ========================================================= */

  function setupMobileNavigation() {
    const toggle = $("nav-toggle");
    const menu = $("nav-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const expanded =
        toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!expanded));
      menu.classList.toggle("is-open", !expanded);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* =========================================================
     STARTUP
     ========================================================= */

  function start() {
    setupSoundButton();
    setupVideoButtons();
    setupMobileNavigation();
    setupAdvertForm();
    loadNews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

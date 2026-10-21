
/* =========================================================
   RADIANTWAVES MEDIA — COMPLETE SCRIPT.JS
   File 2 of 4
   Works with index.html and news.json
   ========================================================= */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json?v=5001";

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
    if (typeof value !== "string" || !value.trim()) return "";

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
      link.removeAttribute("href");
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

  /* ---------------------------------------------------------
     ARTICLE CARDS AND ORIGINAL REPORT LINKS
     --------------------------------------------------------- */

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

    const summary = article.summary ||
      article.description ||
      article.content ||
      "";

    if (summary) {
      content.appendChild(makeElement("p", "", summary));
    }

    const source = article.source || "Source not specified";
    const date = formatDate(article.date);

    content.appendChild(
      makeElement("p", "story-source", "Source: " + source)
    );

    if (date) {
      content.appendChild(
        makeElement("p", "story-date", date)
      );
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
          "Original report link not provided."
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
        placeholder("The original report link has not been supplied.")
      );
    }

    replaceContents(container, [wrapper]);
  }

  function renderTopStories(stories) {
    const container = $("top-stories-container");
    if (!container) return;

    if (!Array.isArray(stories) || stories.length === 0) {
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

  /* ---------------------------------------------------------
     CATEGORY NEWS
     --------------------------------------------------------- */

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
              return value === "usa" ||
                value === "us" ||
                value === "united states";
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

  /* ---------------------------------------------------------
     LEADERS WATCH
     Reads the actual leadersWatch object in news.json.
     Does not assume that its keys are short IDs.
     --------------------------------------------------------- */

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
          "No Leaders Watch entries have been added to this edition."
        )
      ]);
      return;
    }

    const cards = entries.map(([name, item]) => {
      const card = makeElement("article", "card news-card");
      const content = makeElement("div", "card-content");

      const displayName =
        item.name ||
        (name === "UK Government" ? "Andy Burnham — UK Government" : name);

      content.appendChild(
        makeElement("span", "news-category", "LEADERS WATCH")
      );

      content.appendChild(
        makeElement("h3", "", displayName)
      );

      if (item.role) {
        content.appendChild(
          makeElement("p", "", item.role)
        );
      }

      if (item.title) {
        content.appendChild(
          makeElement("h4", "", item.title)
        );
      }

      if (item.summary) {
        content.appendChild(
          makeElement("p", "", item.summary)
        );
      }

      if (item.source) {
        content.appendChild(
          makeElement("p", "story-source", "Source: " + item.source)
        );
      }

      if (item.date) {
        content.appendChild(
          makeElement("p", "story-date", formatDate(item.date))
        );
      } else {
        content.appendChild(
          makeElement(
            "p",
            "story-date",
            "Monitoring link — no update date supplied"
          )
        );
      }

      const url = safeUrl(item.url);

      if (url) {
        content.appendChild(
          makeLink(url, "Visit source / official updates ↗", "text-link")
        );
      } else {
        content.appendChild(
          makeElement(
            "p",
            "small-note",
            "No valid source link has been provided."
          )
        );
      }

      card.appendChild(content);
      return card;
    });

    replaceContents(grid, cards);
  }

  /* ---------------------------------------------------------
     BREAKING NEWS TICKER
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     NEWSROOM SUMMARY AND EDITORIAL NOTE
     --------------------------------------------------------- */

  function renderMorningSummary(data) {
    const summary = $("morning-summary");
    const note = $("editorial-note");

    if (summary) {
      const text = data.morningSummary || "";

      summary.textContent = text ||
        "The latest global summary will appear here when published.";
    }

    if (note) {
      note.textContent = data.editorialNote ||
        "Readers are encouraged to check original sources and compare reliable reports.";
    }
  }

  /* ---------------------------------------------------------
     BIG QUESTION AND THOUGHT FOR TODAY
     --------------------------------------------------------- */

  function renderQuestionAndQuote(data) {
    const question = $("big-question");
    const quote = $("quote-of-the-day");

    if (question) {
      question.textContent = data.bigQuestion ||
        "When leaders make decisions about conflict, fuel prices and the economy, what should matter most: national security, economic stability or the everyday wellbeing of citizens?";
    }

    if (quote) {
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

      quote.replaceChildren();

      quote.appendChild(
        makeElement("p", "", "“" + quoteText + "”")
      );

      const credit = $("quote-of-the-day")
        .parentElement
        ?.querySelector(".quote-credit");

      if (credit) {
        credit.textContent = author;
      }
    }
  }

  /* ---------------------------------------------------------
     BREAKING NEWS BRIEFS
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     NEWS EDITIONS AND ARCHIVES
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     SPONSORED ADVERTS
     --------------------------------------------------------- */

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
        const link = makeLink(
          url,
          item.linkText || "Find out more ↗",
          "text-link"
        );

        card.appendChild(link);
      } else {
        card.appendChild(
          makeLink(
            "https://radiantwavesmedia.com",
            "Visit RadiantWaves Media ↗",
            "text-link"
          )
        );
      }

      container.appendChild(card);
      return card;
    });

    replaceContents(container, cards);
  }

  /* ---------------------------------------------------------
     HERO VIDEO AND HEADLINES
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     RENDER ALL SECTIONS
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     LOAD NEWS.JSON
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     VIDEO SOUND CONTROL
     --------------------------------------------------------- */

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

      button.setAttribute(
        "aria-pressed",
        String(!video.muted)
      );
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

  /* ---------------------------------------------------------
     VIDEO SELECTION BUTTONS
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     ADVERT REQUEST EMAIL FORM
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     OPTIONAL MOBILE NAVIGATION
     Supports a toggle if one is added in a future HTML update.
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     STARTUP
     --------------------------------------------------------- */

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

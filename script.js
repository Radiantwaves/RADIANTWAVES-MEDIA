
/* =========================================================
   RADIANTWAVES MEDIA — COMPLETE SCRIPT.JS
   File 3 of 4
   Works with the matching news.json and index.html
   ========================================================= */

(() => {
  "use strict";

  const NEWS_FILE = "./news.json?v=5000";

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

  let newsData = null;

  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    const element = $(id);

    if (element && value !== undefined && value !== null) {
      element.textContent = String(value);
    }
  }

  function safeUrl(value) {
    if (!value || typeof value !== "string") return "";

    try {
      const parsed = new URL(value, window.location.href);

      if (
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
      ) {
        return parsed.href;
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

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }

  function makeLink(url, label, className) {
    const link = makeElement("a", className || "", label);
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

  function clearAndAppend(target, elements) {
    if (!target) return;

    target.replaceChildren();

    elements.forEach((element) => {
      if (element) target.appendChild(element);
    });
  }

  function makePlaceholder(message) {
    return makeElement("p", "empty-message", message);
  }

  function makeArticleCard(article, categoryLabel) {
    const card = makeElement("article", "news-card article-card");
    const content = makeElement("div", "card-content article-content");

    const category = makeElement(
      "span",
      "card-category article-category",
      categoryLabel || article.category || "News"
    );

    const title = makeElement(
      "h3",
      "",
      article.title || "News update"
    );

    const summary = makeElement(
      "p",
      "",
      article.summary || article.description || article.content || ""
    );

    content.appendChild(category);
    content.appendChild(title);

    if (summary.textContent) {
      content.appendChild(summary);
    }

    const footer = makeElement("div", "card-footer article-footer");
    const sourceText = article.source || "Source not specified";
    const dateText = formatDate(article.date);

    footer.appendChild(makeElement("span", "article-source", sourceText));

    if (dateText) {
      footer.appendChild(makeElement("span", "article-date", dateText));
    }

    content.appendChild(footer);

    const url = safeUrl(article.url);

    if (url) {
      const readMore = makeLink(url, "Read the original report ↗", "source-link");
      content.appendChild(readMore);
    }

    card.appendChild(content);

    return card;
  }

  function makeFeaturedStory(story) {
    const container = $("featured-news");

    if (!container) return;

    if (!story || typeof story !== "object") {
      clearAndAppend(container, [
        makePlaceholder("No featured story has been published in news.json yet.")
      ]);
      return;
    }

    const wrapper = makeElement("div", "featured-copy");
    const label = makeElement("span", "card-category", "FEATURED STORY");
    const heading = makeElement("h2", "", story.title || "Latest global news");
    const body = makeElement(
      "p",
      "",
      story.content || story.summary || story.description || ""
    );

    wrapper.appendChild(label);
    wrapper.appendChild(heading);

    if (body.textContent) {
      wrapper.appendChild(body);
    }

    if (story.source || story.date) {
      const meta = makeElement(
        "p",
        "article-meta",
        [story.source, formatDate(story.date)].filter(Boolean).join(" · ")
      );

      wrapper.appendChild(meta);
    }

    if (safeUrl(story.url)) {
      wrapper.appendChild(
        makeLink(story.url, "Read the source report ↗", "source-link")
      );
    }

    clearAndAppend(container, [wrapper]);
  }

  function renderTopStories(stories) {
    const container = $("top-stories-container");

    if (!container) return;

    if (!Array.isArray(stories) || stories.length === 0) {
      clearAndAppend(container, [
        makePlaceholder("No top stories are available in this edition.")
      ]);
      return;
    }

    const cards = stories.map((story) =>
      makeArticleCard(story, story.category || "Top story")
    );

    clearAndAppend(container, cards);
  }

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
              return value === "usa" || value === "us" ||
                value === "united states";
            }

            return value === category;
          })
        : [];

      if (matching.length === 0) {
        clearAndAppend(container, [
          makePlaceholder(
            `No ${CATEGORY_LABELS[category]} articles are available in this edition.`
          )
        ]);
        return;
      }

      clearAndAppend(
        container,
        matching.map((article) =>
          makeArticleCard(article, CATEGORY_LABELS[category])
        )
      );
    });
  }

  function renderBreakingTicker(items) {
    const ticker = $("breaking-ticker");

    if (!ticker) return;

    const messages = Array.isArray(items)
      ? items.filter((item) => typeof item === "string" && item.trim())
      : [];

    if (messages.length === 0) {
      ticker.textContent = "Welcome to RadiantWaves Media — your global news update.";
      return;
    }

    ticker.replaceChildren();

    messages.forEach((message, index) => {
      if (index > 0) {
        ticker.appendChild(
          makeElement("span", "ticker-separator", "  ◆  ")
        );
      }

      ticker.appendChild(
        makeElement("span", "ticker-item", message)
      );
    });
  }

  function renderMorningSummary(data) {
    const summary = $("morning-summary");
    const note = $("editorial-note");

    if (summary) {
      const text = typeof data.morningSummary === "string"
        ? data.morningSummary
        : "";

      clearAndAppend(summary, [
        makeElement("h2", "", "Morning Global Summary"),
        makeElement(
          "p",
          "",
          text || "The latest global summary will appear here when published."
        )
      ]);
    }

    if (note) {
      const text = typeof data.editorialNote === "string"
        ? data.editorialNote
        : "";

      clearAndAppend(note, [
        makeElement("h2", "", "Editorial Note"),
        makeElement(
          "p",
          "",
          text || "RadiantWaves Media encourages readers to check original sources and compare reliable reports."
        )
      ]);
    }
  }

  function renderQuestionAndQuote(data) {
    const question = $("big-question");
    const quote = $("quote-of-the-day");

    if (question) {
      clearAndAppend(question, [
        makeElement("h2", "", "💬 Today's Big Question"),
        makeElement(
          "p",
          "",
          data.bigQuestion ||
            "When leaders make decisions about conflict, fuel prices and the economy, what should matter most: national security, economic stability or the everyday wellbeing of citizens?"
        )
      ]);
    }

    if (quote) {
      const quoteText = typeof data.quoteOfTheDay === "string"
        ? data.quoteOfTheDay
        : data.quoteOfTheDay && data.quoteOfTheDay.text
          ? data.quoteOfTheDay.text
          : "Stay curious about the world, question what you hear, and look beyond the headline. Understanding the facts is the first step towards making informed decisions.";

      clearAndAppend(quote, [
        makeElement("h2", "", "🌍 Thought for Today"),
        makeElement("p", "", `“${quoteText}”`)
      ]);
    }
  }

  function renderHistory(items) {
    const container = $("history-container");

    if (!container) return;

    if (!Array.isArray(items) || items.length === 0) {
      clearAndAppend(container, [
        makePlaceholder("Historical news updates will appear here.")
      ]);
      return;
    }

    const cards = items.map((item) => {
      const card = makeElement("article", "history-card");

      if (typeof item === "string") {
        card.appendChild(makeElement("p", "", item));
      } else {
        card.appendChild(
          makeElement("h3", "", item.title || "From the archive")
        );

        card.appendChild(
          makeElement("p", "", item.summary || item.description || "")
        );

        if (safeUrl(item.url)) {
          card.appendChild(
            makeLink(item.url, "Read source ↗", "source-link")
          );
        }
      }

      return card;
    });

    clearAndAppend(container, cards);
  }

  function renderArchive(data) {
    const container = $("archive-list");

    if (!container) return;

    const articles = Array.isArray(data.articles) ? data.articles : [];
    const topStories = Array.isArray(data.topStories) ? data.topStories : [];

    const combined = [...topStories, ...articles];

    if (data.featured) {
      combined.unshift(data.featured);
    }

    if (combined.length === 0) {
      clearAndAppend(container, [
        makePlaceholder("The news archive is awaiting published stories.")
      ]);
      return;
    }

    const cards = combined.map((article) => {
      const card = makeElement("article", "archive-card");

      card.appendChild(
        makeElement("h3", "", article.title || "News report")
      );

      const metadata = [
        article.category || "Global news",
        article.source || "",
        formatDate(article.date)
      ].filter(Boolean).join(" · ");

      card.appendChild(makeElement("p", "", metadata));

      if (safeUrl(article.url)) {
        card.appendChild(
          makeLink(article.url, "Open original source ↗", "source-link")
        );
      }

      return card;
    });

    clearAndAppend(container, cards);
  }

  function renderAdverts(items) {
    const container = $("sponsored-adverts");

    if (!container) return;

    if (!Array.isArray(items) || items.length === 0) {
      clearAndAppend(container, [
        makePlaceholder(
          "Advertising opportunities are available. Contact RadiantWaves Media for enquiries."
        )
      ]);
      return;
    }

    const cards = items.map((item) => {
      const card = makeElement("article", "advert-card");

      card.appendChild(
        makeElement("span", "advert-label", "Advertisement")
      );

      card.appendChild(
        makeElement("h3", "", item.title || "Advertise with RadiantWaves Media")
      );

      card.appendChild(
        makeElement("p", "", item.description || item.summary || "")
      );

      if (safeUrl(item.url)) {
        card.appendChild(
          makeLink(item.url, item.linkText || "Find out more ↗", "source-link")
        );
      } else {
        card.appendChild(
          makeLink(
            "mailto:info@radiantwavesmedia.com?subject=Advertising%20Enquiry",
            "Contact us about advertising ↗",
            "source-link"
          )
        );
      }

      return card;
    });

    clearAndAppend(container, cards);
  }

  function renderHero(data) {
    const hero = data.hero || {};

    setText("hero-title", hero.title || "Gateway to Your World News");
    setText(
      "hero-desc",
      hero.description ||
        "Connecting you to the stories shaping our world."
    );

    setText(
      "edition-date",
      data.edition || data.date || "Global News Edition"
    );

    setText(
      "hero-marquee",
      hero.marquee ||
        "World · USA · Canada · Europe · UK · Africa · Asia · Australia"
    );

    const video = $("heroVideo");

    if (video && hero.video) {
      const validVideo = safeUrl(hero.video);

      if (validVideo && video.getAttribute("src") !== validVideo) {
        video.src = validVideo;
        video.load();
      }
    }
  }

  function renderAll(data) {
    newsData = data;

    renderHero(data);
    makeFeaturedStory(data.featured);
    renderTopStories(data.topStories);
    renderCategoryArticles(data.articles);
    renderBreakingTicker(data.breaking);
    renderMorningSummary(data);
    renderQuestionAndQuote(data);
    renderHistory(data.breakingHistory);
    renderArchive(data);
    renderAdverts(data.sponsoredAdverts);

    setText(
      "copyright-year",
      String(new Date().getFullYear())
    );

    document.dispatchEvent(
      new CustomEvent("radiantwaves:newsloaded", {
        detail: { edition: data.edition || data.date || "" }
      })
    );
  }

  async function loadNews() {
    try {
      const response = await fetch(NEWS_FILE, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Could not load news.json (HTTP ${response.status}).`);
      }

      const data = await response.json();

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("news.json must contain a JSON object.");
      }

      renderAll(data);
    } catch (error) {
      console.error("RadiantWaves news loading error:", error);

      const message = makeElement(
        "p",
        "empty-message",
        "The news feed could not be loaded. Please check that news.json is valid JSON and has been committed to the repository."
      );

      [
        "featured-news",
        "top-stories-container"
      ].forEach((id) => {
        const container = $(id);

        if (container) {
          container.replaceChildren(message.cloneNode(true));
        }
      });

      Object.values(CATEGORY_TARGETS).forEach((id) => {
        const container = $(id);

        if (container) {
          container.replaceChildren(message.cloneNode(true));
        }
      });
    }
  }

  /* Sound control for the hero video */

  function setupSoundButton() {
    const button = $("sound-button");
    const video = $("heroVideo");

    if (!button || !video) return;

    video.muted = true;
    video.playsInline = true;

    function updateButton() {
      button.textContent = video.muted
        ? "🔇 Turn sound on"
        : "🔊 Turn sound off";

      button.setAttribute(
        "aria-pressed",
        video.muted ? "false" : "true"
      );
    }

    button.addEventListener("click", async () => {
      video.muted = !video.muted;

      if (!video.muted) {
        try {
          await video.play();
        } catch (error) {
          console.warn("Video playback needs user interaction.", error);
        }
      }

      updateButton();
    });

    updateButton();
  }

  /* Video selector buttons */

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

        try {
          await video.play();
        } catch (error) {
          console.warn("The selected video could not autoplay.", error);
        }
      });
    });
  }

  /* Mobile navigation toggle, if the button exists */

  function setupMobileNavigation() {
    const toggle = $("nav-toggle");
    const menu = $("nav-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";

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

  /* Contact form: open the visitor's email application */

  function setupContactForm() {
    const form = $("contact-form");

    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const subject = form.querySelector('[name="subject"]');
      const message = form.querySelector('[name="message"]');

      const nameValue = name ? name.value.trim() : "";
      const emailValue = email ? email.value.trim() : "";
      const subjectValue = subject ? subject.value.trim() : "Website enquiry";
      const messageValue = message ? message.value.trim() : "";

      if (!nameValue || !emailValue || !messageValue) {
        window.alert("Please complete your name, email address and message.");
        return;
      }

      const mailSubject = encodeURIComponent(subjectValue);
      const mailBody = encodeURIComponent(
        `Name: ${nameValue}\nEmail: ${emailValue}\n\n${messageValue}`
      );

      window.location.href =
        `mailto:info@radiantwavesmedia.com?subject=${mailSubject}&body=${mailBody}`;
    });
  }

  /* Start after the page elements have loaded */

  function start() {
    setupSoundButton();
    setupVideoButtons();
    setupMobileNavigation();
    setupContactForm();
    loadNews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

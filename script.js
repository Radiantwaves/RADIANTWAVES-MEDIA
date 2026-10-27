/* =========================================================
   RADIANTWAVES MEDIA — SCRIPT.JS
   Complete newsroom renderer
   Supports news.json, Leaders Watch, Big Question,
   public-interest feature, source links and sponsored adverts.
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
    technology: "technology-news"
  };

  const CATEGORY_LABELS = {
    world: "World", usa: "USA", europe: "Europe", africa: "Africa",
    asia: "Asia", business: "Business", technology: "Technology"
  };

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function makeElement(tag, className = "", text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null && text !== "") {
      el.textContent = String(text);
    }
    return el;
  }

  function setText(id, value) {
    const el = $(id);
    if (el && value !== undefined && value !== null) {
      el.textContent = String(value);
    }
  }

  function safeUrl(value, allowMailto = false) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      if (
        ["https:", "http:"].includes(url.protocol) ||
        (allowMailto && url.protocol === "mailto:")
      ) {
        return url.href;
      }
    } catch (_) {}
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

  function makeTime(value, prefix = "") {
    const time = makeElement(
      "time",
      "",
      `${prefix ? prefix + " " : ""}${formatDate(value)}`
    );
    const iso = isoDate(value);
    if (iso) time.dateTime = iso;
    return time;
  }

  function makeLink(url, label, className = "text-link") {
    const link = makeElement("a", className, label);
    const valid = safeUrl(url, true);

    if (valid) {
      link.href = valid;
      if (!valid.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
    }

    return link;
  }

  function replaceContents(target, items) {
    if (!target) return;
    target.replaceChildren();
    items.filter(Boolean).forEach(item => target.appendChild(item));
  }

  function placeholder(message) {
    return makeElement("p", "empty-message", message);
  }

  function summaryOf(item) {
    return item && typeof item === "object"
      ? (item.summary || item.description || item.content || item.body || "")
      : "";
  }

  function urlOf(item) {
    return item && typeof item === "object"
      ? safeUrl(item.url || item.sourceUrl || item.link)
      : "";
  }

  function addMetadata(parent, item, includeDate = true) {
    const bits = [];

    if (item && item.source) {
      bits.push(`Source: ${item.source}`);
    }

    const line = makeElement("p", "story-meta");

    if (bits.length) {
      line.appendChild(makeElement("span", "story-source", bits.join(" · ")));
    }

    if (includeDate && item && item.date) {
      if (bits.length) {
        line.appendChild(makeElement("span", "story-source", " · "));
      }
      line.appendChild(makeTime(item.date));
    }

    if (line.childNodes.length) parent.appendChild(line);
  }

  function articleCard(item, categoryLabel) {
    const card = makeElement("article", "card news-card");
    const imagePath = item && (
      item.image || item.photo || item.imageUrl || item.imagePath
    );

    if (imagePath) {
      const validImage = safeUrl(imagePath);

      if (validImage) {
        const img = makeElement("img", "news-image");
        img.src = validImage;
        img.alt = item.imageAlt || item.title || "News photograph";
        img.loading = "lazy";
        img.decoding = "async";
        img.style.cssText =
          "display:block;width:100%;height:auto;max-height:300px;object-fit:cover;border-radius:8px";

        img.addEventListener("error", () => {
          img.style.display = "none";
        }, { once: true });

        card.appendChild(img);
      }
    }

    const content = makeElement("div", "card-content");
    content.appendChild(
      makeElement("span", "news-category", categoryLabel || item.category || "News")
    );
    content.appendChild(makeElement("h3", "", item.title || "News update"));

    const summary = summaryOf(item);
    if (summary) content.appendChild(makeElement("p", "", summary));

    if (item.whyItMatters) {
      content.appendChild(
        makeElement("p", "why-it-matters", item.whyItMatters)
      );
    }

    addMetadata(content, item);

    const url = urlOf(item);
    content.appendChild(
      url
        ? makeLink(url, item.linkText || "Read the original report ↗")
        : makeElement("p", "small-note", "Original report link not supplied.")
    );

    card.appendChild(content);
    return card;
  }

  function normaliseCategory(value) {
    const raw = String(value || "").toLowerCase().trim();

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
      "nigeria politics": "africa",
      politics: "africa",
      canada: "world",
      australia: "world",
      "african news": "africa",
      "european news": "europe",
      "asian news": "asia"
    };

    return aliases[raw] || raw;
  }

  function renderCategories(articles) {
    Object.entries(CATEGORY_TARGETS).forEach(([category, id]) => {
      const container = $(id);
      if (!container) return;

      const matching = Array.isArray(articles)
        ? articles.filter(
            item => normaliseCategory(item.category) === category
          )
        : [];

      replaceContents(
        container,
        matching.length
          ? matching.map(item => articleCard(item, CATEGORY_LABELS[category]))
          : [
              placeholder(
                `No ${CATEGORY_LABELS[category]} articles are available in this edition.`
              )
            ]
      );
    });
  }
     function renderLeaderPhoto(item, name) {
    const frame = makeElement("div", "leader-image-wrap");
    const imageUrl = safeUrl(
      item.image || item.photo || item.imageUrl || item.portrait
    );

    if (!imageUrl) {
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("") || "RW";

      const fallback = makeElement("div", "leader-photo-placeholder", initials);
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `No photograph supplied for ${name}`);
      frame.appendChild(fallback);
      return frame;
    }

    const img = makeElement("img", "leader-photo");
    img.src = imageUrl;
    img.alt = `Photograph of ${name}`;
    img.loading = "lazy";
    img.decoding = "async";

    img.addEventListener("error", () => {
      img.remove();
      frame.appendChild(
        makeElement("div", "leader-photo-placeholder", "Photo unavailable")
      );
    }, { once: true });

    frame.appendChild(img);
    return frame;
  }

  function renderLeaders(data) {
    const grid = $("leaders-grid");
    if (!grid) return;

    const source = data.leadersWatch || data.leaders || [];
    let leaders = [];

    if (Array.isArray(source)) {
      leaders = source.filter(
        item => item && typeof item === "object"
      );
    } else if (source && typeof source === "object") {
      if (Array.isArray(source.leaders)) {
        leaders = source.leaders;
      } else {
        leaders = Object.entries(source)
          .filter(([key, value]) =>
            key !== "note" && value && typeof value === "object"
          )
          .map(([name, value]) => ({ name, ...value }));
      }
    }

    if (!leaders.length) {
      replaceContents(grid, [
        placeholder(
          "Leaders Watch is awaiting verified updates for this edition."
        )
      ]);
      return;
    }

    replaceContents(grid, leaders.map(item => {
      const name = item.name || item.id || "World leader";
      const card = makeElement("article", "card news-card leader-card");

      card.appendChild(renderLeaderPhoto(item, name));

      const content = makeElement("div", "card-content");
      content.appendChild(
        makeElement("span", "news-category", "LEADERS WATCH")
      );
      content.appendChild(makeElement("h3", "leader-name", name));

      if (item.role) {
        content.appendChild(makeElement("p", "leader-role", item.role));
      }

      if (item.country) {
        content.appendChild(
          makeElement("p", "leader-country", item.country)
        );
      }

      if (item.title || item.headline) {
        content.appendChild(
          makeElement("h4", "leader-headline", item.title || item.headline)
        );
      }

      if (item.date) {
        const p = makeElement("p", "story-date");
        p.appendChild(makeTime(item.date, "Update date:"));
        content.appendChild(p);
      }

      const summary =
        item.update ||
        item.summary ||
        item.description ||
        item.content ||
        item.body ||
        "";

      if (summary) {
        content.appendChild(makeElement("p", "leader-summary", summary));
      }

      const statement =
        item.statement ||
        item.quote ||
        item.remark ||
        item.whatTheySaid ||
        "";

      if (statement) {
        content.appendChild(
          makeElement("h4", "leader-statement-heading", "What they said")
        );
        content.appendChild(
          makeElement("blockquote", "leader-statement", statement)
        );
      }

      if (item.status) {
        content.appendChild(
          makeElement("p", "leader-status", item.status)
        );
      }

      if (item.source) {
        content.appendChild(
          makeElement("p", "story-source", `Source: ${item.source}`)
        );
      }

      const url = urlOf(item);
      if (url) {
        content.appendChild(
          makeLink(url, item.linkText || "Read source ↗")
        );
      } else {
        content.appendChild(
          makeElement("p", "small-note", "Source link not supplied.")
        );
      }

      card.appendChild(content);
      return card;
    }));
  }

  function renderFeatured(item) {
    const target = $("featured-news");
    if (!target) return;

    if (!item || typeof item !== "object") {
      replaceContents(target, [
        placeholder("The featured story will appear when an edition is published.")
      ]);
      return;
    }

    const card = makeElement("article", "card featured-story");
    const imagePath =
      item.image || item.photo || item.imageUrl || item.imagePath;

    if (imagePath) {
      const validImage = safeUrl(imagePath);

      if (validImage) {
        const image = makeElement("img", "featured-image");
        image.src = validImage;
        image.alt = item.imageAlt || item.title || "Featured news photograph";
        image.loading = "lazy";
        image.decoding = "async";
        image.style.cssText =
          "display:block;width:100%;height:auto;max-height:440px;object-fit:cover;border-radius:8px";

        image.addEventListener("error", () => {
          image.style.display = "none";
        }, { once: true });

        card.appendChild(image);
      }
    }

    const content = makeElement("div", "card-content");
    content.appendChild(
      makeElement("span", "news-category", item.category || "FEATURED STORY")
    );
    content.appendChild(
      makeElement("h2", "featured-title", item.title || "Featured story")
    );

    const summary = summaryOf(item);
    if (summary) content.appendChild(makeElement("p", "", summary));

    if (item.whyItMatters) {
      content.appendChild(
        makeElement("p", "why-it-matters", item.whyItMatters)
      );
    }

    addMetadata(content, item);

    const url = urlOf(item);
    if (url) {
      content.appendChild(
        makeLink(url, item.linkText || "Read the original report ↗")
      );
    } else {
      content.appendChild(
        makeElement("p", "small-note", "Original report link not supplied.")
      );
    }

    card.appendChild(content);
    replaceContents(target, [card]);
  }

  function renderTopStories(stories) {
    const target = $("top-stories-container");
    if (!target) return;

    const list = Array.isArray(stories) ? stories : [];
    replaceContents(
      target,
      list.length
        ? list.map(item => articleCard(item, item.category || "Top Story"))
        : [placeholder("Top stories will appear when the news edition is published.")]
    );
  }

  function renderTicker(items) {
    const target = $("breaking-ticker");
    if (!target) return;

    let headlines = [];

    if (Array.isArray(items)) {
      headlines = items
        .map(item => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            return String(item.title || item.headline || item.text || "").trim();
          }
          return "";
        })
        .filter(Boolean);
    } else if (typeof items === "string" && items.trim()) {
      headlines = [items.trim()];
    }

    if (!headlines.length) {
      headlines = ["RadiantWaves Media — awaiting verified breaking-news updates."];
    }

    target.replaceChildren();

    const track = makeElement("div", "ticker-track");
    track.setAttribute("aria-label", "Breaking news headlines");

    const tickerText = headlines.join("   •   ");
    track.appendChild(makeElement("span", "ticker-content", tickerText));

    if (!reducedMotion.matches && tickerText.length > 45) {
      track.appendChild(makeElement("span", "ticker-content", tickerText));
    }

    target.appendChild(track);
  }

  function renderSummary(data) {
    const summary =
      data.morningSummary ||
      data.summary ||
      data.editorialSummary ||
      "";

    const summaryTarget = $("morning-summary");
    if (summaryTarget) {
      if (typeof summary === "string" && summary.trim()) {
        summaryTarget.textContent = summary;
      } else if (summary && typeof summary === "object") {
        summaryTarget.textContent =
          summary.text || summary.summary || summary.description || "";
      } else {
        summaryTarget.textContent =
          "The newsroom summary will be updated when this edition is published.";
      }
    }

    const editorial =
      data.editorialNote ||
      data.editorial ||
      data.newsroomNote ||
      "";

    const editorialTarget = $("editorial-note");
    if (editorialTarget) {
      if (typeof editorial === "string" && editorial.trim()) {
        editorialTarget.textContent = editorial;
      } else {
        editorialTarget.textContent =
          "RadiantWaves Media will continue to prioritise verified information, fair context and clear source attribution.";
      }
    }
  }

  function renderQuestionAndQuote(data) {
    const question =
      data.bigQuestion ||
      data.todaysBigQuestion ||
      data.todayBigQuestion ||
      data.questionOfTheDay ||
      "";

    const questionText =
      typeof question === "string"
        ? question
        : question && typeof question === "object"
          ? question.question || question.text || question.title || ""
          : "";

    setText(
      "big-question",
      questionText || "Today’s Big Question will appear in the latest edition."
    );
    setText("todays-big-question", questionText);
    setText("today-big-question", questionText);

    const quote =
      data.quoteOfTheDay ||
      data.thoughtForToday ||
      data.thoughtOfTheDay ||
      data.quote ||
      "";

    let quoteText = "";
    let quoteAuthor = "";

    if (typeof quote === "string") {
      quoteText = quote;
    } else if (quote && typeof quote === "object") {
      quoteText = quote.text || quote.quote || quote.thought || "";
      quoteAuthor = quote.author || quote.by || quote.source || "";
    }

    const quoteTarget = $("quote-of-the-day");
    if (quoteTarget) {
      quoteTarget.replaceChildren();

      if (quoteText) {
        quoteTarget.appendChild(
          makeElement("blockquote", "daily-quote", quoteText)
        );

        if (quoteAuthor) {
          quoteTarget.appendChild(
            makeElement("p", "quote-author", `— ${quoteAuthor}`)
          );
        }
      } else {
        quoteTarget.appendChild(
          placeholder("Thought for Today will appear in the latest edition.")
        );
      }
    }
  }
     function renderPublicInterestFeature(feature) {
    const target = $("public-interest-feature");
    if (!target) return;

    if (!feature || typeof feature !== "object") {
      replaceContents(target, [
        placeholder("No public-interest feature has been supplied for this edition.")
      ]);
      return;
    }

    const card = makeElement("article", "card public-interest-card");
    card.appendChild(
      makeElement("span", "news-category", feature.category || "PUBLIC INTEREST")
    );
    card.appendChild(
      makeElement("h3", "", feature.title || "Public-interest feature")
    );

    const summary = summaryOf(feature);
    if (summary) card.appendChild(makeElement("p", "", summary));

    if (feature.whyItMatters) {
      card.appendChild(
        makeElement("p", "why-it-matters", feature.whyItMatters)
      );
    }

    addMetadata(card, feature);

    const url = urlOf(feature);
    if (url) {
      card.appendChild(
        makeLink(url, feature.linkText || "Read the original report ↗")
      );
    }

    replaceContents(target, [card]);
  }

  function renderHistory(history) {
    const target = $("history-container");
    if (!target) return;

    const list = Array.isArray(history) ? history : [];

    replaceContents(
      target,
      list.length
        ? list.map(item => {
            if (typeof item === "string") {
              return makeElement("p", "history-item", item);
            }

            const entry = makeElement("article", "history-item");
            if (item.date || item.year) {
              entry.appendChild(
                makeElement("strong", "history-date", item.date || item.year)
              );
            }
            if (item.title) {
              entry.appendChild(makeElement("h3", "", item.title));
            }

            const summary = summaryOf(item);
            if (summary) entry.appendChild(makeElement("p", "", summary));

            if (item.source) {
              entry.appendChild(
                makeElement("p", "story-source", `Source: ${item.source}`)
              );
            }

            const url = urlOf(item);
            if (url) entry.appendChild(makeLink(url, "Read source ↗"));

            return entry;
          })
        : [placeholder("No historical news item has been supplied for this edition.")]
    );
  }

  function renderArchive(data) {
    const target = $("archive-container") || $("archive-list");
    if (!target) return;

    const archive =
      data.archive ||
      data.archives ||
      data.newsArchive ||
      data.editionsArchive ||
      [];

    let entries = [];

    if (Array.isArray(archive)) {
      entries = archive;
    } else if (archive && typeof archive === "object") {
      entries = Object.entries(archive).map(([key, value]) => {
        if (value && typeof value === "object") {
          return { edition: key, ...value };
        }
        return { edition: key, title: String(value || key) };
      });
    }

    if (!entries.length && data.edition) {
      entries = [{
        edition: data.edition,
        date: data.date || "",
        title: data.archiveTitle || data.edition,
        summary: data.archiveSummary || ""
      }];
    }

    replaceContents(
      target,
      entries.length
        ? entries.map(item => {
            const entry = makeElement("article", "archive-item");

            const title =
              item.title ||
              item.edition ||
              item.name ||
              "News edition";

            entry.appendChild(makeElement("h3", "", title));

            if (item.date) {
              entry.appendChild(makeTime(item.date));
            }

            const summary = summaryOf(item);
            if (summary) entry.appendChild(makeElement("p", "", summary));

            if (item.url || item.link || item.sourceUrl) {
              entry.appendChild(
                makeLink(
                  item.url || item.link || item.sourceUrl,
                  item.linkText || "Open edition ↗"
                )
              );
            } else if (item.file) {
              entry.appendChild(
                makeElement("p", "small-note", `Edition file: ${item.file}`)
              );
            }

            return entry;
          })
        : [placeholder("The news archive will appear as editions are published.")]
    );
  }

  function renderAdverts(adverts) {
    const target = $("sponsored-adverts");
    if (!target) return;

    if (!Array.isArray(adverts) || !adverts.length) {
      // Keep advert cards already present in index.html if JSON has no adverts.
      if (!target.children.length) {
        replaceContents(target, [
          placeholder("Sponsored advertising opportunities are available. Contact info@radiantwavesmedia.com.")
        ]);
      }
      return;
    }

    replaceContents(target, adverts.map(item => {
      const card = makeElement("article", "card advert-card");

      const imagePath =
        item.image || item.photo || item.imageUrl || item.imagePath;

      if (imagePath) {
        const validImage = safeUrl(imagePath);

        if (validImage) {
          const image = makeElement("img", "advert-image");
          image.src = validImage;
          image.alt = item.imageAlt || item.title || "Sponsored advert";
          image.loading = "lazy";
          image.decoding = "async";
          image.style.cssText =
            "display:block;width:100%;height:auto;max-height:300px;object-fit:cover;border-radius:8px";

          image.addEventListener("error", () => {
            image.style.display = "none";
          }, { once: true });

          card.appendChild(image);
        }
      }

      const content = makeElement("div", "card-content");
      content.appendChild(
        makeElement("span", "news-category", item.label || "SPONSORED")
      );
      content.appendChild(
        makeElement("h3", "", item.title || "Sponsored message")
      );

      const summary = summaryOf(item);
      if (summary) content.appendChild(makeElement("p", "", summary));

      if (item.disclaimer) {
        content.appendChild(
          makeElement("p", "small-note", item.disclaimer)
        );
      }

      const url = urlOf(item);
      if (url) {
        content.appendChild(
          makeLink(url, item.linkText || "Learn more ↗")
        );
      }

      card.appendChild(content);
      return card;
    }));
  }

  function findFirstElement(ids) {
    for (const id of ids) {
      const el = $(id);
      if (el) return el;
    }
    return null;
  }

  function renderHero(data) {
    const hero = data.hero || data.heroStory || data.featured || {};
    const edition = data.edition || data.date || data.editionDate || "";

    setText("hero-date", edition ? `Edition: ${edition}` : "");

    const title =
      hero.title ||
      data.headline ||
      data.heroTitle ||
      "";

    const description =
      hero.description ||
      hero.summary ||
      data.heroDescription ||
      "";

    if (title) setText("hero-title", title);
    if (description) setText("hero-desc", description);

    const video = $("heroVideo");
    if (video) {
      const videoPath = hero.video || hero.videoUrl || data.heroVideo || "";
      const valid = safeUrl(videoPath);

      if (valid && video.getAttribute("src") !== valid) {
        video.src = valid;
        video.load();
      }
    }

    // Optional hero image: only set it if the JSON supplies a usable path.
    const heroImage = findFirstElement(["hero-image", "heroImage"]);

    if (heroImage && hero.image) {
      const valid = safeUrl(hero.image);

      if (valid) {
        if (heroImage.tagName === "IMG") {
          heroImage.src = valid;
        } else {
          heroImage.style.backgroundImage =
            `url("${valid.replace(/["\\]/g, "")}")`;
        }
      }
    }
  }

  function renderAll(data) {
    renderHero(data);
    renderFeatured(data.featured || data.featuredStory);
    renderTopStories(data.topStories || data.articles || []);

    const combined = [];

    [
      data.articles,
      data.worldNews,
      data.usaNews,
      data.europeNews,
      data.africaNews,
      data.asiaNews,
      data.businessNews,
      data.technologyNews,
      data.topStories
    ].forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item && typeof item === "object") combined.push(item);
        });
      }
    });

    const unique = [];
    const seen = new Set();

    combined.forEach(item => {
      const key =
        item.id ||
        `${item.title || ""}|${item.url || item.sourceUrl || item.link || ""}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    renderCategories(unique);
    renderLeaders(data);
    renderTicker(data.breaking || data.breakingNews || []);
    renderSummary(data);
    renderQuestionAndQuote(data);
    renderPublicInterestFeature(data.publicInterestFeature);
    renderHistory(
      data.breakingHistory ||
      data.breakingNewsHistory ||
      data.history ||
      []
    );
    renderArchive(data);
    renderAdverts(data.sponsoredAdverts);

    setText("copyright-year", String(new Date().getFullYear()));

    document.dispatchEvent(
      new CustomEvent("radiantwaves:newsloaded", {
        detail: { edition: data.edition || data.date || "" }
      })
    );
  }
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
        "The news feed could not be loaded. Check that news.json is valid JSON and that changes have been committed.";

      [
        "featured-news",
        "top-stories-container",
        "leaders-grid",
        "history-container",
        "archive-container",
        "archive-list",
        "sponsored-adverts"
      ].forEach(id => {
        const el = $(id);

        if (el) {
          replaceContents(el, [placeholder(message)]);
        }
      });

      Object.values(CATEGORY_TARGETS).forEach(id => {
        if ($(id)) {
          replaceContents($(id), [placeholder(message)]);
        }
      });

      setText("breaking-ticker", "News feed temporarily unavailable.");
    }
  }

  function setupSoundButton() {
    const button = $("sound-button");
    const video = $("heroVideo");

    if (!button || !video) return;

    video.muted = true;
    video.playsInline = true;

    const update = () => {
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
    };

    button.addEventListener("click", async () => {
      video.muted = !video.muted;

      if (!video.muted) {
        try {
          await video.play();
        } catch (error) {
          console.warn("Video playback could not start.", error);
        }
      }

      update();
    });

    update();
  }

  function setupVideoButtons() {
    const video = $("heroVideo");
    if (!video) return;

    const buttons = document.querySelectorAll("[data-video]");

    buttons.forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("is-active"))
      );

      button.addEventListener("click", async () => {
        const path = button.getAttribute("data-video");
        const valid = safeUrl(path);

        if (!valid) return;

        video.src = valid;
        video.load();

        buttons.forEach(item => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        if (reducedMotion.matches) {
          video.pause();
          return;
        }

        try {
          await video.play();
        } catch (error) {
          console.warn("Selected video could not autoplay.", error);
        }
      });
    });
  }

  function setupVideoPoliteness() {
    const video = $("heroVideo");
    if (!video) return;

    if (reducedMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
    }

    reducedMotion.addEventListener("change", event => {
      if (event.matches) video.pause();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
    });
  }

  function setupAdvertForm() {
    const form = $("advert-request-form");
    if (!form) return;

    function mailtoFrom(data) {
      const fields = [
        ["Name", data.get("name")],
        ["Email", data.get("email")],
        ["WhatsApp", data.get("whatsapp")],
        ["Business / Organisation", data.get("company")],
        ["Service required", data.get("subject")],
        ["Details", data.get("message")]
      ];

      const service = String(
        data.get("subject") || "Website enquiry"
      ).trim();

      const body = fields
        .map(([label, value]) =>
          `${label}: ${String(value || "").trim()}`
        )
        .join("\n");

      return (
        `mailto:${CONFIG.CONTACT_EMAIL}` +
        `?subject=${encodeURIComponent("RadiantWaves Media — " + service)}` +
        `&body=${encodeURIComponent(body)}`
      );
    }

    function status(message, isError = false) {
      let el = form.querySelector(".form-status");

      if (!el) {
        el = makeElement("p", "form-status");
        el.setAttribute("role", "status");
        form.appendChild(el);
      }

      el.textContent = message;
      el.classList.toggle("form-status--error", isError);
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);

      // No access key is configured, so open the visitor's email application.
      if (!CONFIG.FORM_ACCESS_KEY) {
        window.location.href = mailtoFrom(data);
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      status("Sending your request…");

      try {
        const payload = {
          access_key: CONFIG.FORM_ACCESS_KEY,
          subject:
            "RadiantWaves Media — " +
            String(data.get("subject") || "Website enquiry"),
          from_name: String(data.get("name") || ""),
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          whatsapp: String(data.get("whatsapp") || ""),
          organisation: String(data.get("company") || ""),
          service: String(data.get("subject") || ""),
          details: String(data.get("message") || "")
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

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Form service rejected the request."
          );
        }

        status(
          "Thank you — your request has been sent. Our team will reply to your email address."
        );

        form.reset();
      } catch (error) {
        console.error("Advert form error:", error);

        status(
          "Sending failed. Your email application will open so you can still send the request.",
          true
        );

        window.location.href = mailtoFrom(data);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function setupMobileNavigation() {
    const toggle = $("nav-toggle");
    const menu = $("nav-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");

      menu.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });

    document.addEventListener("keydown", event => {
      if (
        event.key === "Escape" &&
        menu.classList.contains("is-open")
      ) {
        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        toggle.focus();
      }
    });
  }

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

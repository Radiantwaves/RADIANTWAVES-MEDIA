

```javascript
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
    if (text !== undefined && text !== null && text !== "") el.textContent = String(text);
    return el;
  }

  function setText(id, value) {
    const el = $(id);
    if (el && value !== undefined && value !== null) el.textContent = String(value);
  }

  function safeUrl(value, allowMailto = false) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      if (["https:", "http:"].includes(url.protocol) ||
          (allowMailto && url.protocol === "mailto:")) return url.href;
    } catch (_) {}
    return "";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function isoDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function makeTime(value, prefix = "") {
    const time = makeElement("time", "", `${prefix ? prefix + " " : ""}${formatDate(value)}`);
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
    if (item && item.source) bits.push(`Source: ${item.source}`);
    const line = makeElement("p", "story-meta");
    if (bits.length) line.appendChild(makeElement("span", "story-source", bits.join(" · ")));
    if (includeDate && item && item.date) {
      if (bits.length) line.appendChild(makeElement("span", "story-source", " · "));
      line.appendChild(makeTime(item.date));
    }
    if (line.childNodes.length) parent.appendChild(line);
  }

  function articleCard(item, categoryLabel) {
    const card = makeElement("article", "card news-card");
    const imagePath = item && (item.image || item.photo || item.imageUrl || item.imagePath);
    if (imagePath) {
      const validImage = safeUrl(imagePath);
      if (validImage) {
        const img = makeElement("img", "news-image");
        img.src = validImage;
        img.alt = item.imageAlt || item.title || "News photograph";
        img.loading = "lazy";
        img.decoding = "async";
        img.style.cssText = "display:block;width:100%;height:auto;max-height:300px;object-fit:cover;border-radius:8px";
        img.addEventListener("error", () => { img.style.display = "none"; }, { once: true });
        card.appendChild(img);
      }
    }
    const content = makeElement("div", "card-content");
    content.appendChild(makeElement("span", "news-category", categoryLabel || item.category || "News"));
    content.appendChild(makeElement("h3", "", item.title || "News update"));
    const summary = summaryOf(item);
    if (summary) content.appendChild(makeElement("p", "", summary));
    if (item.whyItMatters) content.appendChild(makeElement("p", "why-it-matters", item.whyItMatters));
    addMetadata(content, item);
    const url = urlOf(item);
    content.appendChild(url
      ? makeLink(url, item.linkText || "Read the original report ↗")
      : makeElement("p", "small-note", "Original report link not supplied."));
    card.appendChild(content);
    return card;
  }

  function normaliseCategory(value) {
    const raw = String(value || "").toLowerCase().trim();
    const aliases = {
      us: "usa", "united states": "usa", "u.s.": "usa", "u.s.a.": "usa",
      uk: "europe", "united kingdom": "europe", britain: "europe",
      "great britain": "europe", tech: "technology", "world news": "world",
      "nigeria politics": "africa", politics: "africa", canada: "world", australia: "world",
      "african news": "africa", "european news": "europe", "asian news": "asia"
    };
    return aliases[raw] || raw;
  }

  function renderCategories(articles) {
    Object.entries(CATEGORY_TARGETS).forEach(([category, id]) => {
      const container = $(id);
      if (!container) return;
      const matching = Array.isArray(articles)
        ? articles.filter(item => normaliseCategory(item.category) === category)
        : [];
      replaceContents(container, matching.length
        ? matching.map(item => articleCard(item, CATEGORY_LABELS[category]))
        : [placeholder(`No ${CATEGORY_LABELS[category]} articles are available in this edition.`)]);
    });
  }

  function renderLeaderPhoto(item, name) {
    const frame = makeElement("div", "leader-image-wrap");
    const imageUrl = safeUrl(item.image || item.photo || item.imageUrl || item.portrait);
    if (!imageUrl) {
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
        .map(part => part.charAt(0).toUpperCase()).join("") || "RW";
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
      frame.appendChild(makeElement("div", "leader-photo-placeholder", "Photo unavailable"));
    }, { once: true });
    frame.appendChild(img);
    return frame;
  }

  function renderLeaders(data) {
    const grid = $("leaders-grid");
    if (!grid) return;
    let source = data.leadersWatch || data.leaders || [];
    let leaders = [];
    if (Array.isArray(source)) leaders = source.filter(item => item && typeof item === "object");
    else if (source && typeof source === "object") {
      if (Array.isArray(source.leaders)) leaders = source.leaders;
      else leaders = Object.entries(source)
        .filter(([key, value]) => key !== "note" && value && typeof value === "object")
        .map(([name, value]) => ({ name, ...value }));
    }
    if (!leaders.length) {
      replaceContents(grid, [placeholder("Leaders Watch is awaiting verified updates for this edition.")]);
      return;
    }
    replaceContents(grid, leaders.map(item => {
      const name = item.name || item.id || "World leader";
      const card = makeElement("article", "card news-card leader-card");
      card.appendChild(renderLeaderPhoto(item, name));
      const content = makeElement("div", "card-content");
      content.appendChild(makeElement("span", "news-category", "LEADERS WATCH"));
      content.appendChild(makeElement("h3", "leader-name", name));
      if (item.role) content.appendChild(makeElement("p", "leader-role", item.role));
      if (item.country) content.appendChild(makeElement("p", "leader-country", item.country));
      if (item.title || item.headline) content.appendChild(makeElement("h4", "leader-headline", item.title || item.headline));
      if (item.date) {
        const p = makeElement("p", "story-date");
        p.appendChild(makeTime(item.date, "Update date:"));
        content.appendChild(p);
      }
      const summary = item.update || item.summary || item.description || item.content || item.body || "";
      if (summary) content.appendChild(makeElement("p", "leader-summary", summary));
      const statement = item.statement || item.quote || item.remark || item.whatTheySaid || "";
      if (statement) {
        content.appendChild(makeElement("h4", "leader-statement-heading", "What they said"));
        content.appendChild(makeElement("blockquote", "leader-statement", statement));
      }
      if (item.status) content.appendChild(makeElement("p", "leader-status", item.status));
      if (item.source) content.appendChild(makeElement("p", "story-source", `Source: ${item.source}`));
      const url = urlOf(item);
      if (url) content.appendChild(makeLink(url, item.linkText || "Read the source report ↗"));
      else content.appendChild(makeElement("p", "small-note", "No source link supplied for this update."));
      card.appendChild(content);
      return card;
    }));
  }

  function installLayoutFixes() {
    if (document.getElementById("rw-layout-fixes")) return;
    const style = makeElement("style");
    style.id = "rw-layout-fixes";
    style.textContent = `
      /* Breaking-news ticker: left aligned, continuous right-to-left movement */
      .ticker-wrap { display:flex !important; align-items:center !important; justify-content:flex-start !important; text-align:left !important; }
      .ticker-label { flex:0 0 auto !important; text-align:left !important; }
      .ticker-viewport { flex:1 1 auto !important; min-width:0 !important; overflow:hidden !important; text-align:left !important; }
      #breaking-ticker { display:block !important; width:100% !important; overflow:hidden !important; text-align:left !important; }
      #breaking-ticker .ticker-track { display:flex; width:max-content; min-width:max-content; align-items:center; animation:rwBreakingScroll 38s linear infinite; will-change:transform; }
      #breaking-ticker .ticker-sequence { display:flex; flex:0 0 auto; align-items:center; white-space:nowrap; }
      #breaking-ticker .ticker-item { display:inline-block; white-space:nowrap; padding:0 1.1rem; }
      #breaking-ticker .ticker-separator { white-space:pre; }
      .ticker-toggle { flex:0 0 auto; margin-left:10px; padding:6px 10px; border:1px solid currentColor; border-radius:4px; background:transparent; color:inherit; font:inherit; font-size:.8rem; cursor:pointer; }
      .ticker-toggle:focus-visible { outline:3px solid #f4c542; outline-offset:3px; }
      @keyframes rwBreakingScroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
      .ticker-wrap:hover #breaking-ticker .ticker-track,
      .ticker-wrap:focus-within #breaking-ticker .ticker-track,
      #breaking-ticker.is-paused .ticker-track { animation-play-state:paused; }
      /* Centre the complete footer on desktop and mobile */
      .site-footer { text-align:center !important; }
      .site-footer .footer-brand, .site-footer .footer-slogan,
      .site-footer .footer-contact, .site-footer .footer-disclaimer { text-align:center !important; margin-left:auto !important; margin-right:auto !important; }
      .site-footer .social { display:flex !important; justify-content:center !important; align-items:center !important; flex-wrap:wrap !important; }
      @media (prefers-reduced-motion: reduce) {
        #breaking-ticker .ticker-track { animation:none !important; transform:none !important; }
        #breaking-ticker { overflow-x:auto !important; }
      }
      @media (max-width:600px) {
        .ticker-wrap { flex-wrap:nowrap !important; }
        .ticker-label { font-size:.75rem !important; }
        .ticker-toggle { padding:5px 7px; font-size:.72rem; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderTicker(items) {
    const ticker = $("breaking-ticker");
    if (!ticker) return;
    const messages = Array.isArray(items)
      ? items.map(item => typeof item === "string" ? item :
          (item && typeof item === "object" ? [item.title, item.description || item.summary].filter(Boolean).join(" — ") : ""))
        .filter(message => typeof message === "string" && message.trim())
      : [];
    const finalMessages = messages.length
      ? messages
      : ["Welcome to RadiantWaves Media — your global news update."];

    const sequence = (clone = false) => {
      const span = makeElement("span", "ticker-sequence" + (clone ? " ticker-sequence--clone" : ""));
      if (clone) span.setAttribute("aria-hidden", "true");
      finalMessages.forEach((message, index) => {
        if (index) span.appendChild(makeElement("span", "ticker-separator", " ◆ "));
        span.appendChild(makeElement("span", "ticker-item", message));
      });
      return span;
    };

    const track = makeElement("div", "ticker-track");
    track.appendChild(sequence(false));
    track.appendChild(sequence(true));
    ticker.replaceChildren(track);
    ticker.setAttribute("aria-label", "Breaking news headlines");

    const wrap = ticker.closest(".ticker-wrap") || ticker.parentElement;
    if (wrap && !wrap.querySelector(".ticker-toggle")) {
      const button = makeElement("button", "ticker-toggle", "Pause");
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Pause breaking news headlines");
      button.addEventListener("click", () => {
        const paused = ticker.classList.toggle("is-paused");
        button.textContent = paused ? "Play" : "Pause";
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute("aria-label", paused ? "Play breaking news headlines" : "Pause breaking news headlines");
      });
      wrap.appendChild(button);
    }
    if (reducedMotion.matches) ticker.classList.add("is-paused");
  }
    function renderSummary(data) {
    setText("morning-summary", data.morningSummary ||
      "The latest global summary will appear here when published.");
    setText("editorial-note", data.editorialNote ||
      "Check original sources and compare reliable reports before drawing conclusions.");
  }

  function findFirstElement(ids) {
    for (const id of ids) {
      const el = $(id);
      if (el) return el;
    }
    return null;
  }

  function renderQuestionAndQuote(data) {
    const question = findFirstElement(["big-question", "todays-big-question", "today-big-question", "big-question-text", "question-of-the-day"]);
    if (question) {
      const value = data.todaysBigQuestion || data.bigQuestion;
      const text = typeof value === "string" ? value :
        (value && typeof value === "object" ? (value.question || value.text || "") : "");
      question.textContent = text || "What should governments prioritise when living costs rise and public services come under pressure?";
      if (value && typeof value === "object" && value.context) {
        const context = makeElement("p", "big-question-context", value.context);
        const invite = value.invite ? makeElement("p", "big-question-invite", value.invite) : null;
        const parent = question.parentElement;
        if (parent) {
          parent.querySelectorAll(".big-question-context,.big-question-invite").forEach(el => el.remove());
          question.insertAdjacentElement("afterend", context);
          if (invite) context.insertAdjacentElement("afterend", invite);
        }
      }
    }
    const quote = $("quote-of-the-day");
    if (quote) {
      const q = data.thoughtForToday || data.quoteOfTheDay || data.quote;
      const quoteText = typeof q === "string" ? q : (q && (q.text || q.quote || q.statement)) || "";
      const author = (q && typeof q === "object" && (q.author || q.attribution)) || "RadiantWaves Media";
      quote.replaceChildren(makeElement("p", "", `“${quoteText || "Stay curious about the world, question what you hear, and look beyond the headline."}”`));
      const credit = quote.parentElement && quote.parentElement.querySelector(".quote-credit");
      if (credit) credit.textContent = author;
      else quote.appendChild(makeElement("p", "quote-credit", author));
    }
  }

  function renderPublicInterestFeature(feature) {
    if (!feature || typeof feature !== "object") return;
    // Prefer an existing section/container; otherwise create a visible section
    // just before the top stories so the feature is not silently lost.
    let container = findFirstElement([
      "public-interest-feature", "public-interest-container",
      "presidential-questions", "publicInterestFeature"
    ]);
    if (!container) {
      container = makeElement("section", "public-interest-feature");
      container.id = "public-interest-feature";
      const heading = makeElement("h2", "", "Public-interest journalism");
      container.appendChild(heading);
      const anchor = $("top-stories-container") || $("featured-news");
      if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(container, anchor);
      else document.body.appendChild(container);
    }
    container.classList.add("public-interest-feature");
    const content = makeElement("div", "public-interest-content");
    content.appendChild(makeElement("span", "news-category", feature.type || "PUBLIC-INTEREST FEATURE"));
    content.appendChild(makeElement("h2", "", feature.title || "Questions that matter to the public"));
    if (feature.introduction) content.appendChild(makeElement("p", "", feature.introduction));
    if (feature.summary) content.appendChild(makeElement("p", "", feature.summary));
    if (Array.isArray(feature.questions) && feature.questions.length) {
      const list = makeElement("ol", "public-interest-questions");
      feature.questions.forEach(question => list.appendChild(makeElement("li", "", String(question))));
      content.appendChild(list);
    }
    if (feature.invitation) {
      content.appendChild(makeElement("h3", "", feature.invitation.heading || "Invitation to respond"));
      const text = feature.invitation.text || feature.invitation.body;
      if (text) content.appendChild(makeElement("p", "", text));
      if (feature.invitation.contact) {
        const contact = feature.invitation.contact;
        const email = typeof contact === "string" ? contact : contact.email;
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          content.appendChild(makeLink(`mailto:${email}`, `Respond by email: ${email}`));
        }
      }
    }
    if (feature.fairnessNote) content.appendChild(makeElement("p", "small-note", feature.fairnessNote));
    if (feature.source) content.appendChild(makeElement("p", "story-source", `Source: ${feature.source}`));
    const featureUrl = urlOf(feature);
    if (featureUrl) content.appendChild(makeLink(featureUrl, feature.linkText || "Read the full feature ↗"));
    const existingHeading = container.querySelector(":scope > h2");
    container.replaceChildren();
    if (existingHeading && existingHeading.textContent !== (feature.title || "")) {
      container.appendChild(existingHeading);
    }
    container.appendChild(content);
  }

  function renderHistory(items) {
    const container = $("history-container");
    if (!container) return;
    if (!Array.isArray(items) || !items.length) {
      replaceContents(container, [placeholder("No breaking news briefs are available.")]);
      return;
    }
    replaceContents(container, items.map(item => {
      const card = makeElement("article", "history-card");
      if (typeof item === "string") {
        card.appendChild(makeElement("p", "", item));
        return card;
      }
      if (!item || typeof item !== "object") return card;
      if (item.date) {
        const p = makeElement("p", "story-date");
        p.appendChild(makeTime(item.date));
        card.appendChild(p);
      }
      card.appendChild(makeElement("h3", "", item.title || "News development"));
      const summary = summaryOf(item);
      if (summary) card.appendChild(makeElement("p", "", summary));
      if (item.source) card.appendChild(makeElement("p", "story-source", `Source: ${item.source}`));
      const url = urlOf(item);
      if (url) card.appendChild(makeLink(url, "Read source report ↗"));
      return card;
    }));
  }

  function renderArchive(data) {
    const container = findFirstElement(["archive-container", "archive-list"]);
    if (!container) return;
    const archives = data.archives || data.archiveRecords || data.archive || [];
    const stories = Array.isArray(archives) ? archives : [];
    if (!stories.length) {
      replaceContents(container, [placeholder("No previous editions have been added to the archive yet.")]);
      return;
    }
    replaceContents(container, stories.map(item => {
      const card = makeElement("article", "archive-card");
      card.appendChild(makeElement("h3", "", item.title || item.edition || "News edition"));
      const meta = makeElement("p", "story-meta");
      const parts = [item.category || item.edition || "Global news", item.source || ""].filter(Boolean);
      if (parts.length) meta.appendChild(makeElement("span", "", parts.join(" · ")));
      if (item.date) {
        if (parts.length) meta.appendChild(makeElement("span", "", " · "));
        meta.appendChild(makeTime(item.date));
      }
      if (meta.childNodes.length) card.appendChild(meta);
      const summary = summaryOf(item);
      if (summary) card.appendChild(makeElement("p", "", summary));
      const url = urlOf(item);
      if (url) card.appendChild(makeLink(url, "Open original source ↗"));
      return card;
    }));
  }

  function renderAdverts(items) {
    const container = $("sponsored-adverts");
    if (!container) return;
    if (!Array.isArray(items) || !items.length) return;
    replaceContents(container, items.map(item => {
      const card = makeElement("article", "advert-card");
      card.appendChild(makeElement("span", "advert-label", item.label || "Sponsored"));
      if (item.image) {
        const imageUrl = safeUrl(item.image);
        if (imageUrl) {
          const img = makeElement("img", "advert-image");
          img.src = imageUrl;
          img.alt = item.imageAlt || item.title || "Sponsored advert";
          img.loading = "lazy";
          img.decoding = "async";
          img.style.cssText = "display:block;width:100%;max-width:100%;height:auto;max-height:260px;object-fit:contain;margin:12px 0;border-radius:8px";
          img.addEventListener("error", () => { img.style.display = "none"; }, { once: true });
          card.appendChild(img);
        }
      }
      card.appendChild(makeElement("h3", "", item.title || "Advertise with RadiantWaves Media"));
      if (item.subtitle) card.appendChild(makeElement("h4", "advert-subtitle", item.subtitle));
      const description = summaryOf(item);
      if (description) card.appendChild(makeElement("p", "", description));
      if (Array.isArray(item.products) && item.products.length) {
        const list = makeElement("ul", "advert-products");
        item.products.forEach(product => list.appendChild(makeElement("li", "", String(product))));
        card.appendChild(list);
      }
      const supplied = String(item.url || item.link || "").trim();
      const usable = supplied && supplied !== "#" ? safeUrl(supplied, true) : "";
      card.appendChild(usable
        ? makeLink(usable, item.button || item.linkText || "Find out more ↗")
        : makeLink(`mailto:${CONFIG.CONTACT_EMAIL}`, item.button || "Contact our advertising team ↗"));
      return card;
    }));
  }

  function renderHero(data) {
    const hero = data.hero && typeof data.hero === "object" ? data.hero : {};
    setText("hero-title", hero.title || "Gateway to Your World News");
    setText("hero-desc", hero.description || "Connecting you to the stories shaping our world.");
    setText("hero-date", [data.edition, data.date].filter(Boolean).join(" · ") || "Global News Edition");
    setText("edition-date", [data.edition, data.date].filter(Boolean).join(" · ") || "Global News Edition");

    const marquee = findFirstElement(["hero-marquee", "marquee-text", "hero-marquee-text"]);
    if (marquee && hero.marquee) marquee.textContent = hero.marquee;

    const video = $("heroVideo");
    if (video && hero.video) {
      const validVideo = safeUrl(hero.video);
      if (validVideo && video.getAttribute("src") !== validVideo) {
        video.src = validVideo;
        video.load();
      }
    }

    const heroImage = findFirstElement(["hero-image", "heroImage"]);
    if (heroImage && hero.image) {
      const valid = safeUrl(hero.image);
      if (valid) {
        if (heroImage.tagName === "IMG") heroImage.src = valid;
        else heroImage.style.backgroundImage = `url("${valid.replace(/["\\]/g, "")}")`;
      }
    }
  }

  function renderFeatured(item) {
    const container = $("featured-news");
    if (!container) return;
    if (!item || typeof item !== "object") {
      replaceContents(container, [placeholder("The featured story will appear here when published.")]);
      return;
    }
    replaceContents(container, [articleCard(item, item.category || "Featured")]);
  }

  function renderTopStories(items) {
    const container = $("top-stories-container");
    if (!container) return;
    if (!Array.isArray(items) || !items.length) {
      replaceContents(container, [placeholder("Top stories will appear here when published.")]);
      return;
    }
    replaceContents(container, items.map(item => articleCard(item, item.category || "Top Story")));
  }

  function renderAll(data) {
    renderHero(data);
    renderFeatured(data.featured || data.featuredStory);
    renderTopStories(data.topStories || data.articles || []);

    const combined = [];
    [data.articles, data.worldNews, data.usaNews, data.europeNews, data.africaNews,
      data.asiaNews, data.businessNews, data.technologyNews, data.topStories].forEach(list => {
      if (Array.isArray(list)) list.forEach(item => {
        if (item && typeof item === "object") combined.push(item);
      });
    });

    const unique = [];
    const seen = new Set();
    combined.forEach(item => {
      const key = item.id || `${item.title || ""}|${item.url || item.sourceUrl || item.link || ""}`;
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
    renderHistory(data.breakingHistory || data.breakingNewsHistory || data.history || []);
    renderArchive(data);
    renderAdverts(data.sponsoredAdverts);
    setText("copyright-year", String(new Date().getFullYear()));

    document.dispatchEvent(new CustomEvent("radiantwaves:newsloaded", {
      detail: { edition: data.edition || data.date || "" }
    }));
  }

  async function loadNews() {
    try {
      const response = await fetch(CONFIG.NEWS_FILE, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load news.json (HTTP ${response.status}).`);

      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("news.json must contain a JSON object.");
      }

      renderAll(data);
      console.info("RadiantWaves Media news loaded:", data.edition || data.date || "Edition");
    } catch (error) {
      console.error("RadiantWaves news loading error:", error);
      const message = "The news feed could not be loaded. Check that news.json is valid JSON and that changes have been committed.";

      ["featured-news", "top-stories-container", "leaders-grid", "history-container",
        "archive-container", "archive-list", "sponsored-adverts", "big-question",
        "todays-big-question", "today-big-question"].forEach(id => {
        const el = $(id);
        if (el && ["featured-news", "top-stories-container", "leaders-grid",
          "history-container", "archive-container", "archive-list", "sponsored-adverts"].includes(id)) {
          replaceContents(el, [placeholder(message)]);
        }
      });

      Object.values(CATEGORY_TARGETS).forEach(id => {
        if ($(id)) replaceContents($(id), [placeholder(message)]);
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
      const icon = makeElement("i", video.muted
        ? "fa-solid fa-volume-xmark"
        : "fa-solid fa-volume-high");
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
      button.appendChild(document.createTextNode(
        video.muted ? " Enable sound" : " Turn sound off"
      ));
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
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));

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

      const service = String(data.get("subject") || "Website enquiry").trim();
      const body = fields.map(([label, value]) =>
        `${label}: ${String(value || "").trim()}`
      ).join("\n");

      return `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent("RadiantWaves Media — " + service)}&body=${encodeURIComponent(body)}`;
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
          subject: "RadiantWaves Media — " + String(data.get("subject") || "Website enquiry"),
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
          throw new Error(result.message || "Form service rejected the request.");
        }

        status("Thank you — your request has been sent. Our team will reply to your email address.");
        form.reset();
      } catch (error) {
        console.error("Advert form error:", error);
        status("Sending failed. Your email application will open so you can still send the request.", true);
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

    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        toggle.focus();
      }
    });
  }

  function start() {
    installLayoutFixes();
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

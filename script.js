"use strict";

/* =========================================================
   RADIANTWAVES MEDIA NIGERIA LTD
   NEWSROOM WEBSITE JAVASCRIPT
   Version 6001
   ========================================================= */

const CONFIG = {
    NEWS_FILE: "./news.json",
    CONTACT_EMAIL: "info@radiantwavesmedia.com",
    REFRESH_INTERVAL: 0
};

const CATEGORY_TARGETS = {
    world: "world-news",
    usa: "usa-news",
    europe: "europe-news",
    africa: "africa-news",
    nigeria: "nigeria-news",
    asia: "asia-news",
    business: "business-news",
    technology: "technology-news",
    editorial: "editorial-news",
    analysis: "analysis-news",
    factcheck: "fact-check-news",
    beyondstatement: "beyond-statement-news"
};

let newsroomData = null;
let allArticles = [];

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

function cleanText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;

    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }

    return fallback;
}

function escapeHTML(value) {
    return cleanText(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function safeUrl(value) {
    const url = cleanText(value);

    if (!url) return "";

    try {
        const parsed = new URL(url, window.location.href);

        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:" ||
            parsed.protocol === "mailto:"
        ) {
            return parsed.href;
        }
    } catch (error) {
        return "";
    }

    return "";
}

function safeImage(value) {
    const image = cleanText(value);

    if (!image) return "";

    if (
        image.startsWith("assets/") ||
        image.startsWith("./assets/") ||
        image.startsWith("images/")
    ) {
        return image;
    }

    return safeUrl(image);
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return cleanText(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getFirstValue(object, fields, fallback = "") {
    if (!object || typeof object !== "object") return fallback;

    for (const field of fields) {
        const value = object[field];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return fallback;
}

function getArray(value) {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
        return [value];
    }

    return [];
}

/* =========================================================
   IMPROVED CATEGORY RECOGNITION
   ========================================================= */

function normaliseCategory(value) {
    const original = cleanText(value).toLowerCase();

    if (!original) return "";

    const category = original
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]/g, "");

    const aliases = {
        uk: "europe",
        britain: "europe",
        british: "europe",
        unitedkingdom: "europe",
        europeanunion: "europe",
        eu: "europe",
        france: "europe",
        germany: "europe",
        canada: "world",
        australia: "world",
        newzealand: "world",
        politics: "nigeria",
        nigerianpolitics: "nigeria",
        tech: "technology",
        artificialintelligence: "technology",
        factcheck: "factcheck",
        factchecking: "factcheck",
        beyondthestatement: "beyondstatement",
        leaderswatch: "beyondstatement",
        editorialopinion: "editorial"
    };

    if (aliases[category]) {
        return aliases[category];
    }

    /*
       Recognise categories that contain a region or country.
       Examples:
       Nigeria Politics -> nigeria
       Nigeria Economy -> nigeria
       USA Politics -> usa
       France Economy -> europe
       South Africa Politics -> africa
    */

    if (
        category.includes("nigeria") ||
        category.includes("nigerian")
    ) {
        return "nigeria";
    }

    if (
        category.includes("usa") ||
        category.includes("unitedstates") ||
        category.includes("america") ||
        category.includes("uspolitics")
    ) {
        return "usa";
    }

    if (
        category.includes("europe") ||
        category.includes("european") ||
        category.includes("france") ||
        category.includes("germany") ||
        category.includes("britain") ||
        category.includes("british") ||
        category.includes("uk") ||
        category.includes("unitedkingdom")
    ) {
        return "europe";
    }

    if (
        category.includes("africa") ||
        category.includes("southafrica") ||
        category.includes("kenya") ||
        category.includes("ghana") ||
        category.includes("uganda") ||
        category.includes("senegal") ||
        category.includes("ethiopia")
    ) {
        return "africa";
    }

    if (
        category.includes("asia") ||
        category.includes("china") ||
        category.includes("india") ||
        category.includes("japan") ||
        category.includes("korea") ||
        category.includes("pakistan")
    ) {
        return "asia";
    }

    if (
        category.includes("technology") ||
        category.includes("digital") ||
        category.includes("artificialintelligence") ||
        category.includes("innovation")
    ) {
        return "technology";
    }

    if (category.includes("business")) {
        return "business";
    }

    if (category.includes("editorial")) {
        return "editorial";
    }

    if (category.includes("analysis")) {
        return "analysis";
    }

    if (
        category.includes("factcheck") ||
        category.includes("factchecking")
    ) {
        return "factcheck";
    }

    if (
        category.includes("beyondstatement") ||
        category.includes("leaderswatch")
    ) {
        return "beyondstatement";
    }

    if (category.includes("world")) {
        return "world";
    }

    return category;
}

/* =========================================================
   SAFE CONTENT RENDERING
   ========================================================= */

function renderParagraphs(value) {
    if (!value) return "";

    const paragraphs = Array.isArray(value)
        ? value
        : String(value).split(/\n+/);

    return paragraphs
        .filter(Boolean)
        .map(paragraph =>
            `<p>${escapeHTML(paragraph)}</p>`
        )
        .join("");
}

function renderSection(title, content) {
    if (!content) return "";

    return `
        <div class="article-detail-section">
            <h4>${escapeHTML(title)}</h4>
            ${renderParagraphs(content)}
        </div>
    `;
}

function renderSources(item) {
    const sources = getArray(item.sources);

    if (!sources.length && item.source) {
        sources.push({
            name: item.source,
            url: item.url
        });
    }

    if (!sources.length) return "";

    const links = sources.map(source => {
        if (typeof source === "string") {
            return `<li>${escapeHTML(source)}</li>`;
        }

        const name = getFirstValue(
            source,
            ["name", "title", "publisher"],
            "Source"
        );

        const url = safeUrl(
            getFirstValue(source, ["url", "link"], "")
        );

        if (!url) {
            return `<li>${escapeHTML(name)}</li>`;
        }

        return `
            <li>
                <a href="${escapeHTML(url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    ${escapeHTML(name)}
                </a>
            </li>
        `;
    }).join("");

    return `
        <div class="article-sources">
            <h4>Sources and further reading</h4>
            <ul>${links}</ul>
        </div>
    `;
}

function renderPresenterScript(item) {
    const script = getFirstValue(
        item,
        ["presenterScript", "script", "broadcastScript"],
        ""
    );

    if (!script) return "";

    return `
        <div class="presenter-script">
            <h4>Presenter's Script</h4>
            ${renderParagraphs(script)}
        </div>
    `;
}

/* =========================================================
   NEWS CARD RENDERING
   ========================================================= */

function renderNewsCard(item, options = {}) {
    if (!item || typeof item !== "object") return "";

    const title = getFirstValue(
        item,
        ["title", "headline"],
        "Untitled report"
    );

    const category = getFirstValue(
        item,
        ["category", "section"],
        "News"
    );

    const summary = getFirstValue(
        item,
        ["summary", "description", "intro", "excerpt"],
        ""
    );

    const image = safeImage(
        getFirstValue(item, ["image", "imageUrl", "thumbnail"], "")
    );

    const date = getFirstValue(
        item,
        ["date", "publishedAt", "updated"],
        ""
    );

    const sourceUrl = safeUrl(
        getFirstValue(item, ["url", "link", "sourceUrl"], "")
    );

    const whyItMatters = getFirstValue(
        item,
        ["whyItMatters", "significance"],
        ""
    );

    const background = getFirstValue(
        item,
        ["background", "context"],
        ""
    );

    const report = getFirstValue(
        item,
        ["content", "body", "report", "fullReport"],
        ""
    );

    const nextSteps = getFirstValue(
        item,
        ["whatHappensNext", "nextSteps"],
        ""
    );

    const perspective = getFirstValue(
        item,
        ["radiantWavesView", "analysis", "ourView"],
        ""
    );

    const hasDetails =
        report ||
        background ||
        whyItMatters ||
        nextSteps ||
        perspective ||
        item.presenterScript ||
        item.script ||
        item.sources;

    const detailsId = "article-" +
        Math.random().toString(36).slice(2, 11);

    const imageHTML = image
        ? `
            <div class="news-card-image">
                <img src="${escapeHTML(image)}"
                     alt="${escapeHTML(title)}"
                     loading="lazy"
                     onerror="this.style.display='none'">
            </div>
        `
        : "";

    const sourceHTML = sourceUrl
        ? `
            <a class="source-link"
               href="${escapeHTML(sourceUrl)}"
               target="_blank"
               rel="noopener noreferrer">
                Read source
            </a>
        `
        : "";

    const detailsHTML = hasDetails
        ? `
            <div class="article-expanded-content" id="${detailsId}">
                ${renderSection("Full report", report)}
                ${renderSection("Background and context", background)}
                ${renderSection("Why this matters", whyItMatters)}
                ${renderSection("What happens next?", nextSteps)}
                ${renderSection("RadiantWaves Perspective", perspective)}
                ${renderPresenterScript(item)}
                ${renderSources(item)}
            </div>
            <button class="read-more-button"
                    type="button"
                    aria-expanded="false"
                    aria-controls="${detailsId}">
                Read full report
            </button>
        `
        : "";

    return `
        <article class="news-card">
            ${imageHTML}

            <div class="card-content">
                <span class="news-category">
                    ${escapeHTML(category)}
                </span>

                <h3>${escapeHTML(title)}</h3>

                ${date ? `
                    <div class="story-meta">
                        ${escapeHTML(formatDate(date))}
                    </div>
                ` : ""}

                ${summary ? `
                    <p>${escapeHTML(summary)}</p>
                ` : ""}

                ${detailsHTML}

                ${sourceHTML}
            </div>
        </article>
    `;
}

function renderCardCollection(containerId, items, emptyMessage) {
    const container = getElement(containerId);

    if (!container) return;

    const validItems = getArray(items).filter(item =>
        item && typeof item === "object"
    );

    if (!validItems.length) {
        container.innerHTML = `
            <p class="empty-news-message">
                ${escapeHTML(
                    emptyMessage || "No verified update added yet."
                )}
            </p>
        `;
        return;
    }

    container.innerHTML = validItems
        .map(item => renderNewsCard(item))
        .join("");
}

/* =========================================================
   CATEGORY AND REGIONAL NEWS
   ========================================================= */

function collectArticles(data) {
    /*
       Each collection receives a fallback category.
       This means a story can still appear in its correct
       regional section even if its category wording differs.
    */

    const collections = [
        { name: "articles", category: "" },
        { name: "topStories", category: "" },
        { name: "worldNews", category: "world" },
        { name: "usaNews", category: "usa" },
        { name: "europeNews", category: "europe" },
        { name: "africaNews", category: "africa" },
        { name: "nigeriaNews", category: "nigeria" },
        { name: "asiaNews", category: "asia" },
        { name: "businessNews", category: "business" },
        { name: "technologyNews", category: "technology" },
        { name: "editorial", category: "editorial" },
        { name: "analysis", category: "analysis" },
        { name: "factCheck", category: "factcheck" },
        { name: "beyondStatement", category: "beyondstatement" }
    ];

    const combined = [];

    collections.forEach(collection => {
        const items = getArray(data[collection.name]);

        items.forEach(item => {
            if (!item || typeof item !== "object") return;

            const originalCategory = getFirstValue(
                item,
                ["category", "section"],
                ""
            );

            const recognisedCategory = normaliseCategory(
                originalCategory
            );

            const finalCategory = CATEGORY_TARGETS[recognisedCategory]
                ? recognisedCategory
                : collection.category;

            combined.push({
                ...item,
                _rwCategory: finalCategory
            });
        });
    });

    const seen = new Set();

    return combined.filter(item => {
        const identity = [
            cleanText(item.title || item.headline).toLowerCase(),
            cleanText(item.url || item.link).toLowerCase()
        ].join("|");

        if (identity === "|") return false;

        if (seen.has(identity)) return false;

        seen.add(identity);
        return true;
    });
}

function renderCategories(data) {
    allArticles = collectArticles(data);

    Object.entries(CATEGORY_TARGETS).forEach(([category, target]) => {
        const matching = allArticles.filter(item => {
            const itemCategory = item._rwCategory ||
                normaliseCategory(
                    item.category || item.section || ""
                );

            return itemCategory === category;
        });

        renderCardCollection(
            target,
            matching,
            "No verified " + category + " update added yet."
        );
    });
}

/* =========================================================
   FEATURED AND TOP STORIES
   ========================================================= */

function renderFeatured(data) {
    const container = getElement("featured-news");

    if (!container) return;

    const featured = data.featured;

    if (!featured) {
        container.innerHTML =
            `<p class="empty-news-message">No featured report selected yet.</p>`;
        return;
    }

    container.innerHTML = renderNewsCard(featured, {
        featured: true
    });
}

function renderTopStories(data) {
    const stories = getArray(data.topStories);

    renderCardCollection(
        "top-stories-container",
        stories,
        "No verified top stories have been added yet."
    );
}

/* =========================================================
   HERO AND BREAKING NEWS
   ========================================================= */

function renderHero(data) {
    const hero = data.hero || {};

    const title = getFirstValue(
        hero,
        ["title"],
        data.headline || "Gateway to Your World News"
    );

    const description = getFirstValue(
        hero,
        ["description"],
        data.intro || ""
    );

    const titleElement = getElement("hero-title");
    const descriptionElement = getElement("hero-description");
    const dateElement = getElement("hero-date");

    if (titleElement) titleElement.textContent = title;

    if (descriptionElement) {
        descriptionElement.textContent = description;
    }

    if (dateElement) {
        dateElement.textContent =
            [data.edition, data.date, data.editionTime]
                .filter(Boolean)
                .join(" | ");
    }

    const marquee = getElement("hero-marquee");

    if (marquee) {
        marquee.textContent = cleanText(hero.marquee);
    }

    const videoSource = getElement("video-source");
    const heroVideo = getElement("heroVideo");

    if (hero.video && videoSource && heroVideo) {
        videoSource.src = safeImage(hero.video);
        heroVideo.load();
    }

    const heroImage = getElement("hero-image");

    if (heroImage && hero.image) {
        heroImage.src = safeImage(hero.image);
    }
}

function renderBreaking(data) {
    const container = getElement("breaking-ticker");

    if (!container) return;

    const breaking = getArray(data.breaking);

    if (!breaking.length) {
        container.textContent =
            "RadiantWaves Media — Connecting You to the World's Most Important Stories.";
        return;
    }

    container.innerHTML = breaking.map(item => {
        const title = typeof item === "string"
            ? item
            : getFirstValue(item, ["title", "headline", "text"], "");

        return `<span class="ticker-item">${escapeHTML(title)}</span>`;
    }).join("");
}

/* =========================================================
   NEWSROOM SUMMARY AND EDITORIAL NOTE
   ========================================================= */

function renderSummary(data) {
    const summary = getElement("morning-summary");
    const editorial = getElement("editorial-note");

    if (summary) {
        const value = getFirstValue(
            data,
            ["morningSummary", "newsSummary"],
            ""
        );

        summary.innerHTML = value
            ? renderParagraphs(value)
            : "<p>No newsroom summary has been added yet.</p>";
    }

    if (editorial) {
        const value = getFirstValue(
            data,
            ["editorialNote", "editorialMessage"],
            ""
        );

        editorial.innerHTML = value
            ? renderParagraphs(value)
            : "<p>No editorial note has been added yet.</p>";
    }
}

/* =========================================================
   PUBLIC INTEREST FEATURE
   ========================================================= */

function renderPublicInterestFeature(data) {
    const container = getElement("public-interest-feature");

    if (!container) return;

    const feature = data.publicInterestFeature ||
        data.publicInterest ||
        data.featuredPublicInterest;

    if (!feature) {
        container.innerHTML =
            "<p>No public-interest feature has been added yet.</p>";
        return;
    }

    container.innerHTML = renderNewsCard(feature);
}

/* =========================================================
   TECHNOLOGY AND INNOVATION
   ========================================================= */

function renderTechnologyInnovation(data) {
    const container = getElement("technology-innovation");

    if (!container) return;

    /*
       Read both fields independently.
       Do not let a non-empty array hide the innovation object.
    */

    const technologyItems = getArray(data.technologyInnovation);
    const innovationItems = getArray(data.innovation);

    const combined = [
        ...technologyItems,
        ...innovationItems
    ];

    const seen = new Set();

    const items = combined.filter(item => {
        if (!item || typeof item !== "object") return false;

        const identity = [
            cleanText(item.title || item.headline).toLowerCase(),
            cleanText(item.url || item.link).toLowerCase()
        ].join("|");

        if (identity === "|") return false;

        if (seen.has(identity)) return false;

        seen.add(identity);
        return true;
    });

    if (!items.length) {
        container.innerHTML =
            "<p>No verified innovation update added yet.</p>";
        return;
    }

    container.innerHTML = items
        .map(item => renderNewsCard(item))
        .join("");
}

/* =========================================================
   LEADERS WATCH
   ========================================================= */

function renderLeaders(data) {
    const container = getElement("leaders-grid");

    if (!container) return;

    const leadersData = data.leadersWatch || {};
    const leaders = getArray(leadersData.leaders);

    if (!leaders.length) {
        container.innerHTML =
            "<p>No verified Leaders Watch update added yet.</p>";
        return;
    }

    container.innerHTML = leaders.map(leader => {
        const name = getFirstValue(
            leader,
            ["name", "leader"],
            "Leader"
        );

        const role = getFirstValue(
            leader,
            ["role", "position", "title"],
            ""
        );

        const country = getFirstValue(
            leader,
            ["country"],
            ""
        );

        const headline = getFirstValue(
            leader,
            ["headline", "title"],
            ""
        );

        const update = getFirstValue(
            leader,
            ["report", "content", "body", "update", "summary", "description"],
            ""
        );

        const statement = getFirstValue(
            leader,
            ["statement", "quote", "remark", "whatTheySaid"],
            ""
        );

        const background = getFirstValue(
            leader,
            ["background", "context"],
            ""
        );

        const implications = getFirstValue(
            leader,
            ["implications", "whyItMatters"],
            ""
        );

        const response = getFirstValue(
            leader,
            ["radiantWavesView", "analysis", "ourView"],
            ""
        );

        const script = getFirstValue(
            leader,
            ["presenterScript", "script"],
            ""
        );

        const image = safeImage(
            getFirstValue(leader, ["image", "photo"], "")
        );

        const source = safeUrl(
            getFirstValue(leader, ["url", "sourceUrl"], "")
        );

        return `
            <article class="leader-card">
                ${image ? `
                    <img class="leader-photo"
                         src="${escapeHTML(image)}"
                         alt="${escapeHTML(name)}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                ` : ""}

                <div class="leader-card-content">
                    <h3 class="leader-name">
                        ${escapeHTML(name)}
                    </h3>

                    <p class="leader-role">
                        ${escapeHTML(role)}
                        ${country ? " | " + escapeHTML(country) : ""}
                    </p>

                    ${headline ? `
                        <h4 class="leader-headline">
                            ${escapeHTML(headline)}
                        </h4>
                    ` : ""}

                    ${leader.status ? `
                        <p class="leader-status">
                            ${escapeHTML(leader.status)}
                        </p>
                    ` : ""}

                    ${statement ? `
                        <div class="leader-statement">
                            <h4>Statement or public position</h4>
                            ${renderParagraphs(statement)}
                        </div>
                    ` : ""}

                    ${renderSection("Latest report", update)}
                    ${renderSection("Background", background)}
                    ${renderSection("Why it matters", implications)}
                    ${renderSection("RadiantWaves Perspective", response)}
                    ${renderSection("Presenter's Script", script)}

                    ${source ? `
                        <a class="source-link"
                           href="${escapeHTML(source)}"
                           target="_blank"
                           rel="noopener noreferrer">
                            View source
                        </a>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");
}

/* =========================================================
   ELECTION WATCH
   ========================================================= */

function renderElectionWatch(data) {
    const container = getElement("election-watch-news");

    if (!container) return;

    const items = getArray(data.electionWatch);

    if (!items.length) {
        container.innerHTML =
            "<p>No verified election update added yet.</p>";
        return;
    }

    container.innerHTML = items
        .map(item => renderNewsCard(item))
        .join("");
}

/* =========================================================
   BREAKING NEWS HISTORY
   ========================================================= */

function renderHistory(data) {
    const container = getElement("history-container");

    if (!container) return;

    const history = getArray(data.breakingHistory);

    if (!history.length) {
        container.innerHTML =
            "<p>No archived breaking news has been added yet.</p>";
        return;
    }

    container.innerHTML = history.map(item => {
        const title = getFirstValue(
            item,
            ["title", "headline"],
            "News update"
        );

        const date = getFirstValue(item, ["date"], "");

        const summary = getFirstValue(
            item,
            ["summary", "description"],
            ""
        );

        return `
            <article class="history-item">
                <h3>${escapeHTML(title)}</h3>
                ${date ? `<p>${escapeHTML(formatDate(date))}</p>` : ""}
                ${summary ? `<p>${escapeHTML(summary)}</p>` : ""}
            </article>
        `;
    }).join("");
}

/* =========================================================
   ARCHIVES
   ========================================================= */

function renderArchives(data) {
    const container = getElement("archive-container");

    if (!container) return;

    const archives = getArray(data.archives);

    if (!archives.length) {
        container.innerHTML =
            "<p>No previous editions have been added yet.</p>";
        return;
    }

    container.innerHTML = archives.map(archive => {
        const title = getFirstValue(
            archive,
            ["title", "edition"],
            "Previous edition"
        );

        const date = getFirstValue(archive, ["date"], "");

        const url = safeUrl(
            getFirstValue(archive, ["url", "link"], "")
        );

        return `
            <article class="archive-item">
                <h3>${escapeHTML(title)}</h3>
                ${date ? `<p>${escapeHTML(formatDate(date))}</p>` : ""}
                ${url ? `
                    <a href="${escapeHTML(url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        View edition
                    </a>
                ` : ""}
            </article>
        `;
    }).join("");
}

/* =========================================================
   THOUGHT FOR TODAY AND BIG QUESTION
   ========================================================= */

function renderQuestionAndQuote(data) {
    const question = getElement("big-question");
    const quote = getElement("quote-of-the-day");

    if (question) {
        const value = getFirstValue(
            data,
            ["todaysBigQuestion", "bigQuestion"],
            ""
        );

        question.textContent = value ||
            "What questions should the public be asking about today's news?";
    }

    if (quote) {
        const value = getFirstValue(
            data,
            ["thoughtForToday", "quoteOfTheDay"],
            ""
        );

        quote.textContent = value ||
            "A well-informed society is better equipped to question, understand and shape its future.";
    }
}

/* =========================================================
   SPONSORED ADVERTISEMENTS
   ========================================================= */

function renderAdverts(data) {
    const adverts = getArray(data.sponsoredAdverts);

    adverts.forEach((advert, index) => {
        const container = getElement("sponsored-ad-" + (index + 1));

        if (!container) return;

        const title = getFirstValue(
            advert,
            ["title", "name"],
            "Sponsored"
        );

        const description = getFirstValue(
            advert,
            ["description", "summary"],
            ""
        );

        const image = safeImage(advert.image);
        const url = safeUrl(advert.url);

        container.innerHTML = `
            <div class="advert-content">
                ${image ? `
                    <img src="${escapeHTML(image)}"
                         alt="${escapeHTML(title)}"
                         loading="lazy">
                ` : ""}

                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(description)}</p>

                ${url ? `
                    <a href="${escapeHTML(url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        Learn more
                    </a>
                ` : ""}
            </div>
        `;
    });
}

/* =========================================================
   CONTACT FORM
   ========================================================= */

function initialiseContactForm() {
    const form = getElement("contact-form");

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = cleanText(
            getElement("contact-name")?.value
        );

        const email = cleanText(
            getElement("contact-email")?.value
        );

        const subject = cleanText(
            getElement("contact-subject")?.value
        );

        const message = cleanText(
            getElement("contact-message")?.value
        );

        if (!name || !email || !message) {
            alert("Please complete your name, email and message.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        const mailSubject = encodeURIComponent(
            subject || "Website enquiry"
        );

        const mailBody = encodeURIComponent(
            "Name: " + name +
            "\nEmail: " + email +
            "\n\nMessage:\n" + message
        );

        const mailto =
            "mailto:" + CONFIG.CONTACT_EMAIL +
            "?subject=" + mailSubject +
            "&body=" + mailBody;

        window.location.href = mailto;
    });
}

/* =========================================================
   VIDEO CONTROLS
   ========================================================= */

function initialiseVideoControls() {
    const video = getElement("heroVideo");
    const soundButton = getElement("sound-button");

    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playVideo = () => {
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                // Autoplay may be restricted by the browser.
            });
        }
    };

    playVideo();

    if (soundButton) {
        soundButton.addEventListener("click", () => {
            video.muted = !video.muted;

            soundButton.textContent = video.muted
                ? "Turn sound on"
                : "Mute video";

            if (!video.paused) return;

            playVideo();
        });
    }

    document.querySelectorAll("[data-video]").forEach(button => {
        button.addEventListener("click", () => {
            const videoNumber = button.getAttribute("data-video");

            if (!["1", "2", "3"].includes(videoNumber)) return;

            const source = getElement("video-source");

            if (!source) return;

            source.src = `assets/video${videoNumber}.mp4`;

            video.load();
            playVideo();
        });
    });
}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function initialiseNavigation() {
    const toggle = getElement("nav-toggle");
    const navigation = getElement("main-nav");

    if (!toggle || !navigation) return;

    toggle.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("active");

        toggle.setAttribute("aria-expanded", String(isOpen));

        toggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    });

    navigation.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navigation.classList.remove("active");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation");
        });
    });
}

/* =========================================================
   READ FULL REPORT BUTTONS
   ========================================================= */

function initialiseReadMore() {
    document.addEventListener("click", event => {
        const button = event.target.closest(".read-more-button");

        if (!button) return;

        const targetId = button.getAttribute("aria-controls");
        const target = targetId ? getElement(targetId) : null;

        if (!target) return;

        const isExpanded =
            button.getAttribute("aria-expanded") === "true";

        button.setAttribute(
            "aria-expanded",
            String(!isExpanded)
        );

        target.classList.toggle("is-expanded", !isExpanded);

        button.textContent = isExpanded
            ? "Read full report"
            : "Show less";
    });
}

/* =========================================================
   COPYRIGHT YEAR
   ========================================================= */

function updateCopyrightYear() {
    const year = getElement("copyright-year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }
}

/* =========================================================
   MAIN NEWSROOM RENDERER
   ========================================================= */

function renderAll(data) {
    if (!data || typeof data !== "object") {
        throw new Error("The newsroom data is not valid.");
    }

    newsroomData = data;

    renderHero(data);
    renderBreaking(data);
    renderSummary(data);
    renderFeatured(data);
    renderTopStories(data);
    renderCategories(data);
    renderPublicInterestFeature(data);
    renderTechnologyInnovation(data);
    renderLeaders(data);
    renderElectionWatch(data);
    renderHistory(data);
    renderArchives(data);
    renderQuestionAndQuote(data);
    renderAdverts(data);
}

/* =========================================================
   LOAD NEWS.JSON
   ========================================================= */

async function loadNews() {
    const loading = getElement("news-loading");
    const errorBox = getElement("news-error");

    if (errorBox) errorBox.textContent = "";

    try {
        const response = await fetch(
            CONFIG.NEWS_FILE + "?v=" + Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load newsroom data. HTTP " +
                response.status
            );
        }

        const data = await response.json();

        renderAll(data);

        if (loading) loading.style.display = "none";

    } catch (error) {
        console.error("RadiantWaves newsroom error:", error);

        if (loading) {
            loading.textContent =
                "The latest newsroom edition could not be loaded.";
        }

        if (errorBox) {
            errorBox.textContent =
                "Please refresh the page later. The newsroom team is checking the update.";
        }
    }
}

/* =========================================================
   START WEBSITE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initialiseNavigation();
    initialiseVideoControls();
    initialiseContactForm();
    initialiseReadMore();
    updateCopyrightYear();

    loadNews();

    if (CONFIG.REFRESH_INTERVAL > 0) {
        setInterval(loadNews, CONFIG.REFRESH_INTERVAL);
    }
});

// ============================================================
// RADIANT WAVES MEDIA
// AUTOMATIC NEWS IMAGE SYSTEM
// ============================================================

// ============================================================
// NEWS JSON LOADER
// ============================================================

fetch("news.json?v=" + Date.now())

.then(response => {

    if (!response.ok) {
        throw new Error("Unable to load news.json");
    }

    return response.json();

})

.then(newsData => {

    // ========================================================
    // HERO
    // ========================================================

    const heroTitle =
        document.getElementById("hero-title");

    const heroDesc =
        document.getElementById("hero-desc");


    if (heroTitle && newsData.hero) {

        heroTitle.innerText =
            newsData.hero.title || "Radiant Waves Media";

    }


    if (heroDesc && newsData.hero) {

        heroDesc.innerText =
            newsData.hero.description || "";

    }


    // ========================================================
    // BREAKING NEWS TICKER
    // ========================================================

    const ticker =
        document.getElementById("breaking-ticker");


    if (ticker && Array.isArray(newsData.breaking)) {

        ticker.innerHTML =

            newsData.breaking
                .map(item => `🔴 ${escapeHTML(item)}`)
                .join(" &nbsp; • &nbsp; ");

    }


    // ========================================================
    // HERO MARQUEE
    // ========================================================

    const heroMarquee =
        document.getElementById("hero-marquee");


    if (heroMarquee && Array.isArray(newsData.breaking)) {

        heroMarquee.innerHTML =

            newsData.breaking
                .map(item => `🔴 ${escapeHTML(item)}`)
                .join(" &nbsp; • &nbsp; ");

    }


    // ========================================================
    // FEATURED NEWS
    // ========================================================

    loadFeaturedNews(newsData.featured);


    // ========================================================
    // NEWS CATEGORIES
    // ========================================================

    generateNews("world-news", "world", newsData.articles);

    generateNews("usa-news", "usa", newsData.articles);

    generateNews("europe-news", "europe", newsData.articles);

    generateNews("africa-news", "africa", newsData.articles);

    generateNews("business-news", "business", newsData.articles);

    generateNews("tech-news", "technology", newsData.articles);


    // ========================================================
    // SPONSORED ADVERTS
    // ========================================================

    loadSponsoredAdverts(newsData.sponsoredAdverts);


    // ========================================================
    // BREAKING HISTORY
    // ========================================================

    loadBreakingHistory(newsData.breakingHistory);


    // ========================================================
    // TOP STORIES
    // ========================================================

    loadTopStories(newsData.topStories);

})

.catch(error => {

    console.error(
        "Radiant Waves News Loading Error:",
        error
    );

});


// ============================================================
// AUTOMATIC IMAGE SEARCH
// WIKIMEDIA COMMONS
// ============================================================

async function getNewsImage(query) {

    const fallback =
        createFallbackImage(query);


    if (!query) {

        return fallback;

    }


    try {

        const url =

            "https://commons.wikimedia.org/w/api.php" +

            "?action=query" +

            "&generator=search" +

            "&gsrsearch=" +
            encodeURIComponent(query) +

            "&gsrnamespace=6" +

            "&gsrlimit=8" +

            "&prop=imageinfo" +

            "&iiprop=url" +

            "&iiurlwidth=900" +

            "&format=json" +

            "&origin=*";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Image search failed"
            );

        }


        const data =
            await response.json();


        const pages =
            data.query &&
            data.query.pages
                ? Object.values(data.query.pages)
                : [];


        // ----------------------------------------------------
        // Find an image with a usable thumbnail
        // ----------------------------------------------------

        for (const page of pages) {

            if (
                page.imageinfo &&
                page.imageinfo[0]
            ) {

                const info =
                    page.imageinfo[0];


                if (
                    info.thumburl ||
                    info.url
                ) {

                    return (
                        info.thumburl ||
                        info.url
                    );

                }

            }

        }


    }

    catch (error) {

        console.warn(
            "Automatic image search failed:",
            query,
            error
        );

    }


    return fallback;

}


// ============================================================
// FALLBACK IMAGE
// ============================================================

function createFallbackImage(query) {

    const text =
        encodeURIComponent(
            query || "Radiant Waves Media"
        );


    return (
        "https://placehold.co/900x600/111111/ffffff" +
        "?text=" +
        text
    );

}


// ============================================================
// FEATURED NEWS
// ============================================================

async function loadFeaturedNews(featured) {

    const container =
        document.getElementById(
            "featured-news"
        );


    if (
        !container ||
        !featured
    ) {

        return;

    }


    container.innerHTML = `

        <div class="featured-card">

            <div class="automatic-image-wrapper">

                <div class="image-loading">
                    Loading news image...
                </div>

                <img
                    class="automatic-news-image"
                    alt=""
                    loading="lazy"
                >

            </div>

            <div>

                <h2>
                    ${escapeHTML(featured.title)}
                </h2>

                <p>
                    ${escapeHTML(featured.content)}
                </p>

            </div>

        </div>

    `;


    const image =
        container.querySelector(
            ".automatic-news-image"
        );


    const loading =
        container.querySelector(
            ".image-loading"
        );


    const query =
        featured.imageQuery ||
        featured.title;


    const imageURL =
        await getNewsImage(query);


    if (image) {

        image.src = imageURL;

        image.alt =
            featured.title || "News";

        image.onload = () => {

            if (loading) {

                loading.style.display =
                    "none";

            }

            image.style.display =
                "block";

        };

        image.onerror = () => {

            image.src =
                createFallbackImage(
                    featured.title
                );

            if (loading) {

                loading.style.display =
                    "none";

            }

            image.style.display =
                "block";

        };

    }

}


// ============================================================
// GENERATE NEWS
// ============================================================

async function generateNews(
    sectionId,
    category,
    articles
) {

    const container =
        document.getElementById(
            sectionId
        );


    if (!container) {

        return;

    }


    if (!Array.isArray(articles)) {

        container.innerHTML = "";

        return;

    }


    const filtered =
        articles.filter(article =>

            article.category === category

        );


    if (filtered.length === 0) {

        container.innerHTML =
            "<p class='no-news'>No stories available.</p>";

        return;

    }


    // --------------------------------------------------------
    // Create cards first
    // --------------------------------------------------------

    container.innerHTML =

        filtered.map((article, index) => `

            <article
                class="card"
                data-news-index="${index}"
            >

                <div class="automatic-image-wrapper">

                    <div class="image-loading">
                        Loading image...
                    </div>

                    <img
                        class="automatic-news-image"
                        alt=""
                        loading="lazy"
                    >

                </div>

                <div class="card-content">

                    <div class="news-category">
                        ${escapeHTML(
                            article.category || "News"
                        )}
                    </div>

                    <h3>
                        ${escapeHTML(
                            article.title
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            article.description
                        )}
                    </p>

                </div>

            </article>

        `).join("");


    // --------------------------------------------------------
    // Load images
    // --------------------------------------------------------

    const cards =
        container.querySelectorAll(
            ".card"
        );


    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const card =
            cards[i];


        const article =
            filtered[i];


        const image =
            card.querySelector(
                ".automatic-news-image"
            );


        const loading =
            card.querySelector(
                ".image-loading"
            );


        const query =

            article.imageQuery ||

            article.title + " " +

            article.category;


        const imageURL =
            await getNewsImage(query);


        if (image) {

            image.src =
                imageURL;

            image.alt =
                article.title;


            image.onload = () => {

                if (loading) {

                    loading.style.display =
                        "none";

                }

                image.style.display =
                    "block";

            };


            image.onerror = () => {

                image.src =
                    createFallbackImage(
                        article.title
                    );


                if (loading) {

                    loading.style.display =
                        "none";

                }

                image.style.display =
                    "block";

            };

        }

    }

}


// ============================================================
// SPONSORED ADVERTS
// FIXED IMAGES — NEVER AUTOMATICALLY REPLACED
// ============================================================

function loadSponsoredAdverts(adverts) {

    const container =
        document.getElementById(
            "sponsored-adverts"
        );


    if (
        !container ||
        !Array.isArray(adverts)
    ) {

        return;

    }


    container.innerHTML =

        adverts.map(ad => `

            <div class="sponsored-ad">

                <div class="sponsored-label">
                    SPONSORED ADVERT
                </div>

                <div class="sponsored-content">

                    <img
                        src="${safeImage(
                            ad.image
                        )}"
                        alt="${escapeHTML(
                            ad.title
                        )}"
                        loading="lazy"
                    >

                    <div class="sponsored-text">

                        <h2>
                            ${escapeHTML(
                                ad.title
                            )}
                        </h2>

                        <h4>
                            ${escapeHTML(
                                ad.subtitle || ""
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                ad.description || ""
                            )}
                        </p>

                        ${
                            Array.isArray(
                                ad.products
                            )

                            ?

                            ad.products.map(
                                product => `

                                    <div
                                        class="product-line">

                                        <strong>
                                            ${escapeHTML(
                                                product.name
                                            )}
                                        </strong>

                                        <br>

                                        Big:
                                        ${escapeHTML(
                                            product.big
                                        )}

                                        |

                                        Small:
                                        ${escapeHTML(
                                            product.small
                                        )}

                                    </div>

                                `
                            ).join("")

                            :

                            ""
                        }

                    </div>

                </div>

            </div>

        `).join("");

}


// ============================================================
// BREAKING HISTORY
// ============================================================

function loadBreakingHistory(history) {

    const container =
        document.getElementById(
            "history-container"
        );


    if (
        !container ||
        !Array.isArray(history)
    ) {

        return;

    }


    container.innerHTML =

        history.map(item => `

            <div class="history-item">

                ${escapeHTML(item)}

            </div>

        `).join("");

}


// ============================================================
// TOP STORIES
// ============================================================

async function loadTopStories(stories) {

    const container =
        document.getElementById(
            "top-stories-container"
        );


    if (
        !container ||
        !Array.isArray(stories)
    ) {

        return;

    }


    container.innerHTML =

        stories.map((story, index) => `

            <article
                class="card"
                data-top-index="${index}"
            >

                <div class="automatic-image-wrapper">

                    <div class="image-loading">
                        Loading image...
                    </div>

                    <img
                        class="automatic-news-image"
                        alt=""
                        loading="lazy"
                    >

                </div>

                <div class="card-content">

                    <h3>
                        ${escapeHTML(
                            story.title
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            story.description
                        )}
                    </p>

                </div>

            </article>

        `).join("");


    const cards =
        container.querySelectorAll(
            ".card"
        );


    for (
        let i = 0;
        i < cards.length;
        i++
    ) {

        const story =
            stories[i];


        const image =
            cards[i].querySelector(
                ".automatic-news-image"
            );


        const loading =
            cards[i].querySelector(
                ".image-loading"
            );


        const imageURL =
            await getNewsImage(
                story.imageQuery ||
                story.title
            );


        if (image) {

            image.src =
                imageURL;

            image.alt =
                story.title;


            image.onload = () => {

                if (loading) {

                    loading.style.display =
                        "none";

                }

                image.style.display =
                    "block";

            };

        }

    }

}


// ============================================================
// SAFE IMAGE
// Used ONLY for fixed adverts
// ============================================================

function safeImage(image) {

    if (!image) {

        return "assets/logo.png";

    }

    return image;

}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHTML(value) {

    if (value === undefined ||
        value === null) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ============================================================
// VIDEO SYSTEM
// ============================================================

const video =
    document.getElementById(
        "heroVideo"
    );


const videoSource =
    document.getElementById(
        "video-source"
    );


if (video) {

    video.muted = true;

    video.volume = 1;

    video.play().catch(() => {

        console.log(
            "Autoplay waiting for interaction."
        );

    });

}


// ============================================================
// VIDEO SWITCHER
// ============================================================

function changeVideo(videoFile) {

    if (
        !video ||
        !videoSource
    ) {

        return;

    }


    video.pause();

    videoSource.src =
        videoFile;

    video.load();

    video.play().catch(() => {

        console.log(
            "Video play requires interaction."
        );

    });

}


// ============================================================
// AUTOMATIC VIDEO ROTATION
// ============================================================

const videos = [

    "assets/video1.mp4",

    "assets/video2.mp4",

    "assets/video3.mp4"

];


let currentVideo = 0;


setInterval(() => {

    if (!video) {

        return;

    }


    currentVideo++;


    if (
        currentVideo >=
        videos.length
    ) {

        currentVideo = 0;

    }


    changeVideo(
        videos[currentVideo]
    );

}, 30000);

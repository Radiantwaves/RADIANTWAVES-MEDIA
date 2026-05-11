fetch("news.json")

.then(res => res.json())

.then(data => {

  // BREAKING TICKER

  document.getElementById("breaking-ticker")
  .innerHTML =

  data.breaking && data.breaking.length > 0

  ? data.breaking.join(" 🔴 ")

  : "🔴 Live Breaking News Around The World";


  // HERO TITLE

  document.getElementById("hero-title")
  .innerText =

  data.articles[0]?.title ||

  "Global Breaking News";


  // HERO DESCRIPTION

  document.getElementById("hero-desc")
  .innerText =

  data.articles[0]?.description ||

  "Live updates from around the globe";


  // LIVE MARQUEE

  document.getElementById("hero-marquee")
  .innerHTML =

  data.breaking && data.breaking.length > 0

  ? data.breaking.join(" 🔴 ")

  : "🔴 Global Breaking News Updates Live Around The World";


  // FEATURED SECTION

  const featured =
  document.getElementById("featured-news");

  featured.innerHTML = `

    <div class="featured-card">

      <img src="${data.articles[0]?.image}">

      <div>

        <h2>

          ${data.articles[0]?.title}

        </h2>

        <p>

          ${data.articles[0]?.content}

        </p>

      </div>

    </div>

  `;


  // RENDER NEWS FUNCTION

  function render(category,id){

    const container =
    document.getElementById(id);

    if(!container) return;

    const filtered =
    data.articles.filter(

      a => a.category.toLowerCase() === category

    );

    container.innerHTML = "";

    filtered.forEach(news => {

      container.innerHTML += `

        <div class="card">

          <img src="${news.image}">

          <div class="card-content">

            <h3>

              ${news.title}

            </h3>

            <p>

              ${news.description}

            </p>

            <p>

              ${news.content.substring(0,250)}...

            </p>

          </div>

        </div>

      `;

    });

  }


  // LOAD ALL CATEGORIES

  render("world","world-news");

  render("usa","usa-news");

  render("europe","europe-news");

  render("africa","africa-news");

  render("business","business-news");

  render("technology","tech-news");


  // ROTATING STUDIO VIDEOS

  let videos = [

    "assets/video1.mp4",

    "assets/video2.mp4",

    "assets/video3.mp4"

  ];

  let current = 0;

  const heroVideo =
  document.getElementById("heroVideo");

  setInterval(() => {

    current++;

    if(current >= videos.length){

      current = 0;

    }

    heroVideo.src =
    videos[current];

  },15000);

})

.catch(error => {

  console.log("News loading error:", error);

});

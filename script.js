fetch("news.json")

.then(res => res.json())

.then(data => {

  // BREAKING

  document.getElementById("breaking-ticker")
  .innerHTML =
  data.breaking.join(" 🔴 ");

  // HERO

  document.getElementById("hero-title")
  .innerText =
  data.articles[0].title;

  document.getElementById("hero-desc")
  .innerText =
  data.articles[0].description;

  // HERO MARQUEE

  document.getElementById("hero-marquee")
  .innerHTML =
  data.breaking.join(" 🔴 ");

  // FEATURED

  const featured =
  document.getElementById("featured-news");

  featured.innerHTML = `

    <div class="featured-card">

      <img src="${data.articles[0].image}">

      <div>

        <h2>${data.articles[0].title}</h2>

        <p>${data.articles[0].content}</p>

      </div>

    </div>

  `;

  // RENDER NEWS

  function render(category,id){

    const container =
    document.getElementById(id);

    const filtered =
    data.articles.filter(
      a => a.category.toLowerCase() === category
    );

    filtered.forEach(news => {

      container.innerHTML += `

        <div class="card">

          <img src="${news.image}">

          <div class="card-content">

            <h3>${news.title}</h3>

            <p>${news.description}</p>

            <p>

              ${news.content.substring(0,250)}...

            </p>

          </div>

        </div>

      `;

    });

  }

  render("world","world-news");
  render("usa","usa-news");
  render("europe","europe-news");
  render("africa","africa-news");
  render("business","business-news");
  render("technology","tech-news");

  // ROTATING VIDEOS

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

});

fetch("news.json")
.then(res => res.json())
.then(data => {

  // BREAKING NEWS
  document.getElementById("breaking-ticker")
  .innerHTML = data.breaking.join(" 🔴 ");

  // HERO

  document.getElementById("hero-title")
  .innerText = data.articles[0].title;

  document.getElementById("hero-desc")
  .innerText = data.articles[0].description;

  // FEATURED LIVE STUDIO

const featured =
document.getElementById("featured-news");

featured.innerHTML = `

<div class="live-studio">

  <video autoplay muted loop playsinline>

    <source src="assets/video1.mp4" type="video/mp4">

  </video>

  <div class="live-overlay">

    <div class="live-tag">
      🔴 LIVE
    </div>

    <h2>
      ${data.articles[0].title}
    </h2>

    <p>
      ${data.articles[0].content}
    </p>

    <div class="live-scroll">

      <marquee behavior="scroll" direction="left">

        ${data.breaking.join(" 🔴 ")}

      </marquee>

    </div>

  </div>

</div>

`;

  // RENDER FUNCTION

  function render(category, id){

    const container =
    document.getElementById(id);

    const filtered =
    data.articles.filter(
      a => a.category.toLowerCase() === category
    );

    let videos = [
      "assets/video1.mp4",
      "assets/video2.mp4",
      "assets/video3.mp4"
    ];

    filtered.forEach((news, index) => {

      container.innerHTML += `

        <div class="card">

          <img src="${news.image}">

          <div class="card-content">

            <h3>${news.title}</h3>

            <p>${news.description}</p>

            <p>
              ${news.content.substring(0,200)}...
            </p>

          </div>

        </div>

      `;

      // VIDEO AFTER EVERY 3 NEWS

      if((index + 1) % 3 === 0){

        let videoIndex =
        Math.floor(index / 3) % videos.length;

        container.innerHTML += `

          <div class="video-card">

            <video autoplay muted loop controls>

              <source
              src="${videos[videoIndex]}"
              type="video/mp4">

            </video>

          </div>

        `;
      }

    });

  }

  render("world", "world-news");
  render("usa", "usa-news");
  render("europe", "europe-news");
  render("africa", "africa-news");
  render("business", "business-news");
  render("technology", "tech-news");

});

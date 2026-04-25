let newsData = JSON.parse(localStorage.getItem("news")) || {
  breaking: "Welcome to RadiantWavesMedia",
  main: {},
  topStories: [],
  videos: []
};

function addNews() {
  newsData.main = {
    title: document.getElementById("title").value,
    image: document.getElementById("image").value,
    description: document.getElementById("desc").value
  };

  newsData.breaking = newsData.main.title;

  save();
  alert("News published!");
}

function addTop() {
  const text = document.getElementById("topStory").value;
  newsData.topStories.push({ title: text });
  save();
  alert("Top story added!");
}

function save() {
  localStorage.setItem("news", JSON.stringify(newsData));
}

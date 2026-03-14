// generate-news.js
const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = '4183020c-43aa-40db-bebc-d1389f09d3cb'; // Your API key
const OUTPUT_FILE = 'news.json'; // File your site reads

// Example: articles you write manually (no image required)
const manualArticles = [
  {
    title: "U.S.–Iran Conflict Escalates After Two Weeks of Fighting",
    description: "Tensions in the Middle East remain high two weeks after the United States launched major military strikes against Iran, targeting key military infrastructure...",
    category: "world",
    date: new Date().toISOString().slice(0,10)
  },
  {
    title: "Michigan Synagogue Attack Sparks Security Alarm",
    description: "Authorities investigate a violent incident at Temple Israel synagogue where a man rammed a truck into the building before opening fire...",
    category: "united_states",
    date: new Date().toISOString().slice(0,10)
  }
  // Add more articles here
];

async function fetchNewsFromAPI() {
  try {
    // Example: fetch dynamic news from AI/news API (optional)
    const response = await fetch(`https://api.example.com/generate-news?key=${API_KEY}&date=${new Date().toISOString().slice(0,10)}`);
    const data = await response.json();
    
    return data.articles.map(a => ({
      title: a.title,
      description: a.description,
      category: a.category || 'world',
      image: a.image || 'images/icon-512.png',
      date: new Date().toISOString().slice(0,10)
    }));
  } catch (error) {
    console.error('❌ Error fetching API news, using manual articles:', error);
    return [];
  }
}

async function generateNewsJSON() {
  // Fetch AI/API articles
  const apiArticles = await fetchNewsFromAPI();

  // Combine manual articles with API-generated ones (manual articles take priority)
  const articles = [...manualArticles, ...apiArticles].map(a => ({
    ...a,
    image: a.image || 'images/icon-512.png' // ensure placeholder
  }));

  // Write JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ articles }, null, 2));
  console.log(`✅ news.json generated successfully with ${articles.length} articles!`);
}

// Run the function
generateNewsJSON();

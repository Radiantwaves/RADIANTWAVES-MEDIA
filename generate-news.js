// generate-news.js
const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = '4183020c-43aa-40db-bebc-d1389f09d3cb'; // your API key
const OUTPUT_FILE = 'news.json'; // the file your site reads

async function fetchNews() {
  try {
    // Replace the URL below with your AI/news API endpoint
    const response = await fetch(`https://api.example.com/generate-news?key=${API_KEY}&date=${new Date().toISOString().slice(0,10)}`);
    const data = await response.json();

    // Transform API response to Radiant Waves format
    const articles = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      category: a.category,
      image: a.image || 'images/icon-512.png', // fallback if no image
      date: new Date().toISOString().slice(0,10)
    }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ articles }, null, 2));
    console.log(`✅ news.json generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating news.json:', error);
  }
}

// Run the function
fetchNews();

const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = "4183020c-43aa-40db-bebc-d1389f09d3cb";

const categories = [
"world",
"politics",
"business",
"technology",
"science",
"sports",
"entertainment"
];

const defaultImages = {
world:"images/world-1.jpg",
politics:"images/politics-1.jpg",
business:"images/business-1.jpg",
technology:"images/tech-1.jpg",
science:"images/science-1.jpg",
sports:"images/sports-1.jpg",
entertainment:"images/entertainment-1.jpg"
};

function rewriteStory(title, description){

if(!description) description="Major developments continue to unfold around the world.";

const endings=[
"RadiantWaves newsroom continues monitoring the story.",
"Our correspondents are following developments closely.",
"More updates will follow as the situation evolves.",
"RadiantWaves will provide further analysis."
];

const ending=endings[Math.floor(Math.random()*endings.length)];

return description + " " + ending;

}

async function fetchNews(){

let articles=[];

for(const category of categories){

const url=`https://newsdata.io/api/1/news?apikey=${API_KEY}&language=en&category=${category}`;

try{

const res=await fetch(url);

const data=await res.json();

if(data.results){

data.results.slice(0,5).forEach(article=>{

articles.push({

title:article.title,

description:rewriteStory(article.title,article.description),

category:category,

image:article.image_url || defaultImages[category]

});

});

}

}catch(err){

console.log("Error loading",category);

}

}

fs.writeFileSync("news.json",JSON.stringify({articles:articles},null,2));

console.log("RadiantWaves news updated.");

}

fetchNews();

const fs = require("fs")

const today = new Date().toISOString().split("T")[0]

const titles = [
"United States Expands Artificial Intelligence Research Programs",
"European Leaders Discuss Economic Cooperation and Energy Stability",
"Nigeria Strengthens Infrastructure Projects to Support Economic Growth",
"Canada Announces New Technology Innovation Grants",
"Global Markets React to Economic Policy Developments",
"African Digital Economy Continues Rapid Expansion",
"Middle East Diplomatic Talks Focus on Regional Stability",
"Scientists Release New Climate Research Findings",
"International Sports Federations Prepare for Major Competitions",
"Streaming Platforms Expand Global Entertainment Partnerships"
]

const descriptions = [
"Government officials and economic analysts say the initiative reflects increasing global competition in technology and innovation. Experts believe the program could support research development and create new employment opportunities.",
"Policy discussions among international leaders are focusing on economic stability, trade cooperation and energy security as governments address global economic challenges.",
"Business analysts say infrastructure development remains critical for strengthening transportation networks, improving trade efficiency and supporting long-term economic growth.",
"Technology investors continue monitoring global innovation trends as governments and private companies increase funding for emerging technologies.",
"Financial markets remain sensitive to global economic data and policy announcements, with investors closely monitoring inflation indicators and interest rate decisions.",
"Digital startups across several regions are expanding rapidly as internet access, mobile payments and online services create new business opportunities.",
"Diplomatic representatives say continued dialogue remains important for maintaining political stability and encouraging cooperation between neighboring countries.",
"Environmental researchers emphasize the importance of international collaboration to address climate challenges and promote sustainable development.",
"Sports organizations are coordinating schedules, venues and logistics ahead of upcoming international competitions expected to attract global audiences.",
"Entertainment companies are expanding partnerships to distribute films and television content to audiences across multiple continents."
]

const categories = [
"world",
"business",
"politics",
"technology",
"science",
"sports",
"entertainment"
]

const images = [
"images/world-1.jpg",
"images/politics-1.jpg",
"images/business-1.jpg",
"images/business-2.jpg",
"images/tech-1.jpg",
"images/entertainment-1.jpg",
"icon-512.png"
]

let articles = []

for (let i = 0; i < 30; i++) {

let article = {
title: titles[Math.floor(Math.random() * titles.length)],
description: descriptions[Math.floor(Math.random() * descriptions.length)],
category: categories[Math.floor(Math.random() * categories.length)],
image: images[Math.floor(Math.random() * images.length)],
date: today
}

articles.push(article)

}

const newsData = { articles }

fs.writeFileSync("news.json", JSON.stringify(newsData, null, 2))

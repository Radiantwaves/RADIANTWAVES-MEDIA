const fs = require("fs")

function generateNews(){

const articles = [

{
title: "United States Expands Technology Investment to Strengthen AI Industry",
description: "Officials in Washington announced expanded funding initiatives designed to strengthen the country's artificial intelligence industry. The program focuses on research partnerships between universities, private technology companies and national laboratories. Policy experts say the initiative reflects growing global competition in advanced computing technologies.",
category: "technology",
image: "icon-512.png",
date: new Date().toISOString().split("T")[0]
},

{
title: "Nigeria Infrastructure Projects Expected to Boost Regional Trade",
description: "Economic analysts say Nigeria's planned expansion of highways and rail connections could significantly improve trade routes across West Africa. The projects aim to reduce transportation delays affecting agricultural exports and manufactured goods moving between major commercial centers.",
category: "business",
image: "images/business-1.jpg",
date: new Date().toISOString().split("T")[0]
},

{
title: "European Governments Strengthen Energy Cooperation",
description: "Several European governments are working on expanded energy cooperation programs designed to improve electricity stability and renewable energy development across the region. Officials say long-term collaboration could reduce supply risks and improve regional energy security.",
category: "world",
image: "images/world-1.jpg",
date: new Date().toISOString().split("T")[0]
},

{
title: "Global Financial Markets Monitor Inflation Trends",
description: "Investors across global financial markets are closely monitoring new inflation data released by several major economies. Analysts say interest rate decisions from central banks will likely shape global market conditions over the coming months.",
category: "business",
image: "images/business-2.jpg",
date: new Date().toISOString().split("T")[0]
},

{
title: "African Tech Startups Continue Rapid Growth",
description: "Technology startups across Africa continue to attract venture capital investment as mobile banking, digital commerce and software development expand across the continent. Entrepreneurs say increasing internet access is helping create new digital opportunities.",
category: "technology",
image: "images/tech-1.jpg",
date: new Date().toISOString().split("T")[0]
},

{
title: "Climate Researchers Warn of Rising Global Temperatures",
description: "International climate scientists say global temperature patterns continue to show long-term warming trends. Researchers emphasize the importance of global environmental policies designed to reduce emissions and support sustainable development strategies.",
category: "science",
image: "icon-512.png",
date: new Date().toISOString().split("T")[0]
},

{
title: "Middle East Diplomats Continue Regional Dialogue",
description: "Diplomatic representatives from several Middle Eastern countries are continuing negotiations aimed at strengthening political dialogue and improving regional stability. International observers say the discussions remain important for long-term security cooperation.",
category: "politics",
image: "icon-512.png",
date: new Date().toISOString().split("T")[0]
},

{
title: "Global Entertainment Industry Expands Streaming Partnerships",
description: "Film studios and streaming platforms are forming new international partnerships to distribute entertainment content across multiple regions. Industry analysts say digital streaming continues to reshape global media consumption.",
category: "entertainment",
image: "images/entertainment-1.jpg",
date: new Date().toISOString().split("T")[0]
}

]

const newsData = { articles }

fs.writeFileSync("news.json", JSON.stringify(newsData, null, 2))

}

generateNews()

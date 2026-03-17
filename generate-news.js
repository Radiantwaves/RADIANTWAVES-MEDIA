const fs = require('fs');

// AUTO-GENERATED NEWS (simulated AI for now)
const articles = [

{
title: "LIVE: Global tensions rise amid ongoing conflicts",
description: "World leaders continue to monitor rising geopolitical tensions affecting global security and economic stability.",
category: "World",
live: true
},

{
title: "LIVE: French elections enter critical phase",
description: "Political alliances strengthen ahead of the second round of municipal elections across France.",
category: "Politics",
live: true
},

{
title: "Oil prices fluctuate as global markets react",
description: "Energy markets remain unstable due to geopolitical uncertainty and supply concerns.",
category: "Business",
live: false
},

{
title: "Air travel disruptions affect global routes",
description: "Airlines continue to adjust routes causing delays and increased ticket costs.",
category: "World",
live: false
},

{
title: "Security concerns increase across Nigeria",
description: "Authorities respond to multiple incidents including crime and road accidents in major cities.",
category: "Africa",
live: false
},

{
title: "Scientists warn about climate risks",
description: "Environmental experts highlight increasing threats linked to climate change.",
category: "Science",
live: false
},

{
title: "Healthcare experts stress importance of rest",
description: "Medical professionals warn about long-term health risks of poor sleep.",
category: "Health",
live: false
},

{
title: "Entertainment industry adapts to digital trends",
description: "Streaming and social media continue to reshape global entertainment consumption.",
category: "Entertainment",
live: false
},

{
title: "Sports events impacted by global tensions",
description: "Several international sporting events face cancellations due to security concerns.",
category: "Sport",
live: false
}

];

// SAVE FILE
fs.writeFileSync('news.json', JSON.stringify({ articles }, null, 2));

console.log("✅ AUTO NEWS GENERATED!");

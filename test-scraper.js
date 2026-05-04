const cheerio = require('cheerio');

async function test() {
  const url = "https://www.cloudskillsboost.google/public_profiles/7976f6ba-c32e-47ea-ba20-843a1fb18097";
  const res = await fetch(url);
  const text = await res.text();
  const $ = cheerio.load(text);
  
  const name = $('h1').first().text().trim();
  const badges = $('.profile-badge').length; 
  console.log("Name:", name);
  
  let badgeTitles = [];
  $('.profile-badge').each((i, el) => {
     badgeTitles.push($(el).find('.ql-title-medium').text().trim());
  });

  if (badgeTitles.length === 0) {
     // try another selector
     $('.badge-title').each((i, el) => {
        badgeTitles.push($(el).text().trim());
     });
  }

  // Let's just dump all text inside elements that might be badges
  console.log("Found Badges using .profile-badge:", badgeTitles.length);

  // Maybe check .profile-badges class
  const totalBadges = $('.profile-badges .badge').length || $('.badge').length || $('profile-badge').length;
  console.log("Total badges using .badge:", totalBadges);

  const league = $('.ql-display-small').text().trim() || $('h2:contains("League")').text().trim();
  console.log("League:", league);

  // count number of elements with class starting with badge
  const allElements = $('*').map((i, el) => $(el).attr('class')).get().filter(c => c && c.includes('badge'));
  console.log("Classes with badge:", [...new Set(allElements)].slice(0, 5));
}

test();

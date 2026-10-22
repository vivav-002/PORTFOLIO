// Achievement records and supporting visuals are maintained here.
const achievementContent = [
  {
    title: 'Adobe AI-THON',
    summary: 'Top 5 · Inter-school hackathon',
    image: '../assets/achievement-award.svg',
    imageAlt: 'Monochrome award medallion illustration'
  },
  {
    title: '1M1B Global',
    summary: 'Top 50',
    image: '../assets/achievement-document.svg',
    imageAlt: 'Monochrome certificate and document illustration'
  },
  {
    title: 'Sustainable Innovation',
    summary: 'Competition winner; prototype selected for a UN Summit presentation',
    image: '../assets/achievement-innovation.svg',
    imageAlt: 'Monochrome sustainability and innovation illustration'
  },
  {
    title: 'Hackathon & Robotics',
    summary: 'Western Sydney AI Hackathon; AVISHKAR finalist; ISRO Hackathon participant',
    image: '../assets/achievement-engineering.svg',
    imageAlt: 'Monochrome robotics and engineering illustration'
  }
];

window.initAchievement = function (root = document.querySelector('#achievements')) {
  if (!root) return;
  const list = root.querySelector('#achievementList');

  achievementContent.forEach((record, index) => {
    const card = document.createElement('article');
    card.className = 'achievement';

    const number = document.createElement('span');
    number.className = 'achievement-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const visual = document.createElement('img');
    visual.className = 'achievement-visual';
    visual.src = record.image;
    visual.alt = record.imageAlt;
    visual.loading = 'lazy';

    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = record.title;
    const summary = document.createElement('p');
    summary.textContent = record.summary;

    if (record.date) {
      const date = document.createElement('time');
      date.textContent = record.date;
      copy.append(date);
    }
    copy.prepend(title, summary);
    card.append(number, visual, copy);
    list.append(card);
  });
};

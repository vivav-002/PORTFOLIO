# PORTFOLIA — My Personal Portfolio

Hey, I am VIVAC, and this is PORTFOLIA.

I wanted to make a portfolio, but I didn't really want to follow the usual format of putting everything on one page and calling it a day. I wanted to experiment with how a portfolio could actually feel when someone visits it. That's why I divided the website into five layers, each with its own design, background, and purpose.

The site is still a work in progress, but here's how it works and what I used to build it.

## How the website works

The website is divided into five main sections. Instead of making them all look alike, I gave each one a different visual style.

### 1. Home

This is the entry point to the website. It uses a YouTube video as the background, with an overlay so the text and navigation remain readable. There are links to the other sections, along with a sound control for the background experience.
<img width="1912" height="911" alt="Screenshot 2026-10-23 002343" src="https://github.com/user-attachments/assets/67ee15ad-a5d5-41b4-a4e4-a8487784f509" />


### 2. About

I wanted this section to feel different from a normal profile page. It uses a train-station-inspired visual theme to introduce me and give visitors a little context before they explore my work.

### 3. Projects

This is where I show the technical things I've worked on. The idea is to give each project its own space instead of squeezing everything into a long list. As I build more things, this section can grow with them.

### 4. Achievements & Skills

This section brings together my technical skills, interests, and achievements. It follows its own visual theme while keeping the information easy to explore.
<img width="1897" height="833" alt="Screenshot 2026-10-22 234807" src="https://github.com/user-attachments/assets/6ae22472-c1dc-4e83-b899-843278104f04" />

### 5. Diary

This is probably the most personal section. I designed it around a book that opens to reveal different kinds of content, including writing, art, music, and other things I want to share.
<img width="1917" height="916" alt="Screenshot 2026-10-23 002435" src="https://github.com/user-attachments/assets/bd163542-d0a6-49a4-af28-8f87bfae7721" />

The idea was to make it feel more like opening someone's notebook than browsing another portfolio page. ORV fans might notice a little inspiration here.

## How I built it

I used HTML, CSS, and JavaScript rather than building the site around a large frontend framework.

- **HTML5** handles the structure of the pages and their content.
- **CSS3** handles the layouts, backgrounds, animations, responsive styling, and the visual identity of each section.
- **JavaScript** handles interactive behaviour and helps connect the different parts of the website.
- **YouTube embeds** provide the background video on the home section.
- **Git and GitHub** are used to manage the project and track changes.

I also separated the website into folders for the individual layers, shared resources, and supporting functionality. That makes it easier to work on one section without having to keep everything in a single file.

## Project structure

The main files and folders are organised roughly like this:

```text
PORTFOLIA/
├── index.html
├── assets/
├── layer1-home/
├── layer2-about/
├── layer3-projects/
├── layer4-achievements/
├── layer5-diary/
├── shared/
└── supabase/
```

`index.html` is the main entry point. The layer folders contain the code for their respective sections, `assets/` holds media and other resources, and `shared/` contains resources used across multiple sections.

The project also has a `supabase/` area for the Diary's backend-related setup. The actual features available depend on the database configuration and deployment, so that part is still something I'm developing and refining.

## Running it locally

If you want to explore the code on your own machine, you'll need Git and a local development server. I use VS Code with Live Server.

Clone the repository:

```bash
git clone https://github.com/vivav-002/PORTFOLIO.git
cd PORTFOLIO
```

Open the folder in VS Code and launch `index.html` using Live Server.

Using a local server is recommended because some parts of the site load content dynamically and may not behave correctly when opened directly as a file.

## What's next?

I'm still improving the site as I learn more. I want to add better project explanations, keep refining the interactions, and continue developing the Diary so it can become a useful space for sharing creative work.

I built PORTFOLIA to bring together two sides of what I enjoy: building things with technology and expressing ideas in a more creative way. It probably won't stay exactly like this forever, and I'm fine with that. I'll keep changing it as I build more, learn more, and come up with new ideas.

Thanks for checking it out.

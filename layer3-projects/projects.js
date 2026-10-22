// Edit this collection to update project cards, walkthroughs, images, and links.
const projectContent = {
  campus: {
    title: 'Campus Sentinel AI',
    image: '../assets/project-campus-sentinel.svg',
    cardDescription: 'A campus-safety concept exploring video-based anomaly detection and a future Wi-Fi signal mapping workflow.',
    overview: 'Campus Sentinel AI explores how a computer-vision pipeline could help surface unusual events in campus video for human review. A separate research direction considers whether measured Wi-Fi signals could contribute to an environment map; a simulated coverage map illustrates hypothetical signal strength, not a reconstruction from measured signals.',
    technologies: ['AI concept', 'Computer vision', 'Video analysis'],
    sections: [
      { title: 'Objective', body: 'Explore a safety-oriented way to review campus video while keeping the system framed as decision support, not an automatic substitute for people.' },
      { title: 'Proposed vision pipeline', body: 'The concept follows a clear sequence: video input, frame preparation, model inference, review of candidate anomalies, and a visual output for an operator. It is framed as decision support for human review.' },
      { title: 'Wi-Fi environment mapping', body: 'A simulated wireless coverage map can illustrate hypothetical signal strength. Reconstructing an environment from Wi-Fi would instead depend on measured signals and a separately validated mapping method.' },
      { title: 'Responsible use', body: 'A campus-safety tool should support human judgment and be designed around privacy, transparency, and careful evaluation.' }
    ]
  },
  kala: {
    title: 'KALA HEERA',
    image: '../assets/project-kala-heera.svg',
    cardDescription: 'A mine-safety engineering concept bringing a digital-twin interface together with clearly labeled simulated telemetry.',
    overview: 'KALA HEERA is a mine-safety concept combining a digital twin with simulated telemetry. Its focus is making safety-oriented information easier to inspect by placing changing readings alongside a modeled environment.',
    technologies: ['Three.js', 'Flask', 'Simulated telemetry'],
    sections: [
      { title: 'Problem & objective', body: 'Explore how a digital representation of a mine environment could make safety-related information easier to inspect.' },
      { title: 'Interface & data flow', body: 'The concept pairs a Three.js visualization with a Flask application and simulated telemetry. The readings are illustrative rather than live sensor data.' },
      { title: 'Engineering direction', body: 'The project focuses on representing a modeled environment and presenting changing readings in context. Its showcase is a software visualization, not a claim of a manufactured system or live mine integration.' }
    ]
  },
  motion: {
    title: 'Project Limitless Motion',
    image: '../assets/project-limitless-motion.svg',
    cardDescription: 'A proposed wearable assistance system for para-athletes, combining trunk support ideas with adaptive vibrotactile feedback.',
    overview: 'Project Limitless Motion explores a modular wearable concept intended to support para-athletes during movement. Its design direction brings together a pelvic anchor, dynamic trunk assistance, sensors, and adaptive vibrotactile cues. These are proposed design features; the available portfolio material does not establish that the system has been built or validated.',
    technologies: ['Autodesk Fusion', 'Wearable design', 'Assistive technology'],
    sections: [
      { title: 'Design objective', body: 'Investigate how a wearable system might provide adjustable trunk support while preserving an athlete’s freedom of movement and ability to tailor assistance.' },
      { title: 'Proposed system', body: 'The concept includes a pelvic anchor as a stable interface, a dynamic trunk-assistance element, and sensors intended to inform adaptive vibrotactile feedback.' },
      { title: 'Modularity & manufacturing', body: 'A modular approach could make fit adjustment, component replacement, and maintenance easier to explore. Sizing, comfort, weight, material selection, cleaning, safe load paths, and fabrication methods require design work and testing.' },
      { title: 'Validation boundary', body: 'This is a concept description, not evidence of clinical effectiveness, athletic performance gains, or safety validation. Any future evaluation would need appropriate user-centered and technical testing.' }
    ]
  },
  yolo: {
    title: 'YOLO Object Detection',
    image: '../assets/project-yolo-detection.svg',
    cardDescription: 'A computer-vision walkthrough for detecting objects in image or video inputs and displaying labeled bounding boxes.',
    overview: 'This project explores the core flow of object detection: provide an image or video frame, run a detector, and visualize candidate objects with bounding boxes and class labels. It is a practical way to make model inference visible and inspectable.',
    technologies: ['Python', 'YOLO', 'Computer vision'],
    sections: [
      { title: 'How it works', body: 'An image or video frame is prepared for inference. The detector returns candidate locations and class predictions, which can be drawn over the source as bounding boxes and labels.' },
      { title: 'Inputs & outputs', body: 'Image and video inputs make it possible to inspect detections in a still scene or watch them change across frames.' },
      { title: 'Possible applications', body: 'Object detection can support experiments in scene understanding, inventory, and visual assistance. Results depend on image quality and the conditions in which a model is used.' }
    ]
  },
  autoguard: {
    title: 'AutoGuard',
    image: '../assets/project-autoguard.svg',
    cardDescription: 'An Arduino-based sensor and alert-system project, presented around a clear input → processing → notification workflow.',
    technologies: ['Arduino', 'Embedded systems', 'Sensors'],
    overview: 'AutoGuard is an Arduino-based sensor and alert-system project. Its central idea is an embedded workflow: a sensor supplies an input, a microcontroller processes the reading according to programmed logic, and an alert output communicates a condition.',
    sections: [
      { title: 'System workflow', body: 'Sensor input → Arduino processing → alert output. The controller applies programmed logic to the input and signals when a condition is met.' },
      { title: 'Embedded approach', body: 'The project centers on bringing sensing, microcontroller processing, and notification together in a compact system.' }
    ]
  },
  other: {
    title: 'Other Builds',
    image: '../assets/project-other-builds.svg',
    cardDescription: 'A selection of experiments across Unity game development, Flutter apps, robotics, and creative software.',
    technologies: ['Unity', 'Flutter', 'Python', 'Creative code'],
    overview: 'A selection of smaller builds across software, media, analysis, and physical computing. The collection reflects a broad interest in making and exploring ideas across different tools.',
    sections: [
      { title: 'Creative software', body: 'The collection spans Unity game development and Flutter mobile-app experiments, alongside smaller software and creative-code explorations.' },
      { title: 'Analysis & experiments', body: 'Other interests represented here include sentiment analysis, video analysis, and robotics—small investigations across software and physical computing.' },
      { title: 'A changing collection', body: 'These builds reflect a broad practice of learning by making: exploring an idea, testing an approach, and discovering what to improve next.' }
    ]
  }
};

window.initProjects = function (root = document.querySelector('#projects')) {
  if (!root) return;

  const grid = root.querySelector('#projectGrid');
  const modal = root.querySelector('#projectModal');
  const closeButton = root.querySelector('#modalClose');
  const modalImage = root.querySelector('#modalImage');
  const modalCaption = root.querySelector('#modalImageCaption');
  let previouslyFocused;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  Object.entries(projectContent).forEach(([id, project]) => {
    const card = make('button', 'project-card glass');
    card.type = 'button';
    card.dataset.project = id;
    card.setAttribute('aria-haspopup', 'dialog');

    const image = make('img', 'project-art');
    image.src = project.image;
    image.alt = '';
    image.loading = 'lazy';
    image.setAttribute('aria-hidden', 'true');

    const info = make('span', 'project-info');
    info.append(make('span', 'project-card-kicker', 'Selected work'));
    info.append(make('span', 'project-card-title', project.title));
    info.append(make('span', 'project-card-description', project.cardDescription));

    const tags = make('span', 'tags');
    project.technologies.slice(0, 3).forEach(technology => tags.append(make('span', 'tag', technology)));
    info.append(tags);
    card.append(image, info);
    card.addEventListener('click', () => openProject(id, card));
    grid.append(card);
  });

  function openProject(id, card) {
    const project = projectContent[id];
    if (!project) return;

    previouslyFocused = card;
    root.querySelector('#modalTitle').textContent = project.title;
    root.querySelector('#modalDescription').textContent = project.overview;
    modalImage.src = project.image;
    modalImage.alt = `${project.title} concept illustration`;
    modalCaption.textContent = 'Original concept illustration; not a photograph of a physical prototype.';

    const sections = root.querySelector('#modalSections');
    sections.replaceChildren();
    project.sections.forEach(section => {
      const block = make('section', 'detail-section');
      block.append(make('h3', '', section.title), make('p', '', section.body));
      sections.append(block);
    });

    const technologies = root.querySelector('#modalTech');
    technologies.replaceChildren();
    project.technologies.forEach(technology => technologies.append(make('li', 'tag', technology)));

    const links = root.querySelector('#modalLinks');
    links.replaceChildren();
    modal.hidden = false;
    modal.classList.add('open');
    root.classList.add('project-modal-active');
    document.body.classList.add('project-modal-open');
    closeButton.focus();
  }

  function closeProject() {
    modal.classList.remove('open');
    modal.hidden = true;
    root.classList.remove('project-modal-active');
    document.body.classList.remove('project-modal-open');
    previouslyFocused?.focus();
  }

  closeButton.addEventListener('click', closeProject);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeProject();
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeProject();
  });
};

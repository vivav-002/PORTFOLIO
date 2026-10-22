// Edit this collection to update project cards, walkthroughs, images, and links.
const projectContent = {
  campus: {
    title: 'Campus Sentinel AI',
    image: '../assets/project-campus-sentinel.svg',
    cardDescription: 'A campus-safety concept exploring video-based anomaly detection and a future Wi-Fi signal mapping workflow.',
    overview: 'Campus Sentinel AI explores how a computer-vision pipeline could help surface unusual events in campus video for human review. The project also considers whether measured Wi-Fi signals could contribute to an environment map; that is a separate, planned research direction rather than a capability demonstrated by a simulated coverage map.',
    technologies: ['AI concept', 'Computer vision', 'Video analysis'],
    sections: [
      { title: 'Objective', body: 'Explore a safety-oriented way to review campus video while keeping the system framed as decision support, not an automatic substitute for people.' },
      { title: 'Proposed vision pipeline', body: 'The concept follows a familiar sequence: video input, frame preparation, model inference, candidate anomaly review, and a visual output for an operator. The exact model, libraries, and deployment setup are not documented yet.' },
      { title: 'Wi-Fi environment mapping', body: 'A simulated wireless coverage map can illustrate hypothetical signal strength. Actual environment reconstruction would require measured Wi-Fi observations and a separately validated mapping method; the two should not be presented as equivalent.' },
      { title: 'Next steps', body: 'Document the data sources, privacy safeguards, model choice, evaluation approach, and which parts are implemented before presenting a working-system claim.' }
    ]
  },
  kala: {
    title: 'KALA HEERA',
    image: '../assets/project-kala-heera.svg',
    cardDescription: 'A mine-safety engineering concept bringing a digital-twin interface together with clearly labeled simulated telemetry.',
    overview: 'KALA HEERA is described in the current portfolio as a mine-safety prototype direction with a digital twin and simulated telemetry. The focus is on making a safety-oriented system legible: representing a modeled environment, surfacing changing readings, and showing how an operator might inspect them.',
    technologies: ['Three.js', 'Flask', 'Simulated telemetry'],
    sections: [
      { title: 'Problem & objective', body: 'Explore how a visual representation of a mine environment could make safety-related information easier to understand. Specific hazards, sensors, and operational requirements still need to be documented.' },
      { title: 'Interface & data flow', body: 'The portfolio identifies Three.js and Flask alongside simulated telemetry. This supports describing a web-based visualization direction, but does not establish a particular production architecture or live hardware integration.' },
      { title: 'Engineering & manufacturing', body: 'The available project material does not identify a CAD package, finalized geometry, manufacturing process, or physical build. Add those design decisions and constraints here when confirmed; do not infer them from the digital-twin concept.' },
      { title: 'Next steps', body: 'Separate simulated values from measured inputs, document the modeled components and scenario logic, and add verified CAD or interface captures when available.' }
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
      { title: 'Proposed system', body: 'The concept includes a pelvic anchor as a stable interface, a dynamic trunk-assistance element, and sensors intended to inform adaptive vibrotactile feedback. Sensor types, control logic, and force-transfer details remain to be confirmed.' },
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
      { title: 'How it works', body: 'An image or video frame is prepared for inference. The model returns candidate locations and class predictions, which can then be drawn over the original frame as boxes and labels.' },
      { title: 'Inputs & outputs', body: 'The portfolio describes image and video use. A clear walkthrough can compare the input with annotated output and explain how detections change from frame to frame.' },
      { title: 'Applications & limits', body: 'Object detection can support experiments in scene understanding, inventory, or visual assistance. Results depend on model choice, image quality, and the evaluation conditions; no version, dataset, benchmark, or accuracy figure is specified in the available material.' }
    ]
  },
  autoguard: {
    title: 'AutoGuard',
    image: '../assets/project-autoguard.svg',
    cardDescription: 'An Arduino-based sensor and alert-system project, presented around a clear input → processing → notification workflow.',
    technologies: ['Arduino', 'Embedded systems', 'Sensors'],
    overview: 'AutoGuard is documented in the portfolio as an Arduino-based sensor and alert system. Its central idea is an embedded workflow: a sensor supplies an input, a microcontroller processes the reading according to programmed logic, and an alert output communicates a condition.',
    sections: [
      { title: 'System workflow', body: 'Sensor input → Arduino processing → alert output. The exact trigger behavior and alert mechanism should be described from the real build rather than assumed.' },
      { title: 'Hardware details', body: 'The available project notes do not name the sensor, alert component, wiring, or thresholds. Add those confirmed parts and explain each role here when the source material is available.' },
      { title: 'Next steps', body: 'Add a wiring diagram or build photo, document the processing logic, and distinguish bench testing from any real-world validation.' }
    ]
  },
  other: {
    title: 'Other Builds',
    image: '../assets/project-other-builds.svg',
    cardDescription: 'A changing collection spanning a Unity game, Flutter app experiments, analysis tools, and smaller creative builds.',
    technologies: ['Unity', 'Flutter', 'Python', 'Creative code'],
    overview: 'A home for smaller experiments that do not yet need a standalone project page. The current portfolio mentions a Unity game, Flutter/mobile-app work, analysis tools, sentiment analysis, video work, and robotics among its interests and skills.',
    sections: [
      { title: 'Creative software', body: 'Game development and mobile-app prototyping are represented by Unity and Flutter in the existing portfolio. Individual project names, screenshots, and implementation details can be added as they are ready to share.' },
      { title: 'Analysis & experiments', body: 'The portfolio also lists sentiment analysis and video-analysis interests. These entries should be expanded with their actual inputs, methods, and outputs before making claims about results.' },
      { title: 'A growing collection', body: 'This card is intentionally a collection rather than a claim that every listed experiment is a finished product. Split out projects when a verified description and visual are available.' }
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

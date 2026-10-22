(() => {
  const nav = document.querySelector('#nav');
  const menuBtn = document.querySelector('#menuBtn');
  const soundBtn = document.querySelector('#soundBtn');
  const soundLabel = document.querySelector('#soundLabel');
  const toast = document.querySelector('#toast');
  let soundOn = true;
  let toastTimer;

  window.portfolioNotify = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
  };

  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '×' : '☰';
  });
  nav?.addEventListener('click', event => {
    if (!event.target.matches('a')) return;
    nav.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    if (menuBtn) menuBtn.textContent = '☰';
  });

  function sendYouTubeCommand(func, args = []) {
    const frame = document.querySelector('#bgVideo');
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube-nocookie.com');
  }
  function enableSound() {
    sendYouTubeCommand('unMute');
    sendYouTubeCommand('setVolume', [18]);
    sendYouTubeCommand('playVideo');
  }
  document.addEventListener('load', event => {
    if (event.target?.id === 'bgVideo' && soundOn) enableSound();
  }, true);
  enableSound();

  soundBtn?.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) enableSound();
    else sendYouTubeCommand('mute');
    soundLabel.textContent = soundOn ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  });

  function showLayerError(section, url, status, error) {
    const detail = status ? `HTTP ${status}` : (error?.message || 'Network request failed');
    section.innerHTML = `<div class="layer-error">Could not load ${section.id}.<br><code>${url}</code><br>${detail}${location.protocol === 'file:' ? '<br>Open the workspace through an HTTP server such as VS Code Live Server.' : ''}</div>`;
    console.error('Portfolio layer failed to load', { section: section.id, url, status, error });
  }

  async function loadLayer(section) {
    const url = new URL(section.dataset.layer, document.baseURI).href;
    if (location.protocol === 'file:') {
      showLayerError(section, url, null, new Error('Fetch is blocked for file:// pages by browser security'));
      return;
    }
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) {
        showLayerError(section, url, response.status, new Error(response.statusText));
        return;
      }
      section.innerHTML = await response.text();
      const initializerNames = {
        home: 'initHome',
        about: 'initAbout',
        projects: 'initProjects',
        achievements: 'initAchievement',
        diary: 'initDiary'
      };
      const initializer = window[initializerNames[section.id]];
      if (typeof initializer === 'function') initializer(section);
      section.classList.add('visible');
      console.info(`Portfolio layer loaded: ${section.id}`, { url, status: response.status });
    } catch (error) {
      showLayerError(section, url, null, error);
    }
  }

  const sections = [...document.querySelectorAll('main .page[data-layer]')];
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    nav?.querySelectorAll('a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  }), { threshold: .35 });
  sections.forEach(section => observer.observe(section));
  Promise.all(sections.map(loadLayer)).then(() => console.info('Portfolio layer loading complete.'));
})();

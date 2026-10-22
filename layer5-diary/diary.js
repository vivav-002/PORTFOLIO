/**
 * PORTFOLIA — Layer 5: Diary Collaborative Space
 * 
 * Implements public collaboration without login:
 * - Public viewing of all shared community contributions
 * - Non-authenticated writing, image uploading, playlist sharing, and guestbook
 * - Anonymous ownership via unguessable cryptographic device tokens (SHA-256 vault)
 * - Safe text rendering (strict XSS prevention)
 * - Community safety & reporting with automatic 3-report threshold hiding
 * - Honeypot traps & rate limiting
 * - Live real-time & multi-tab synchronization
 */

window.initDiary = function (sectionEl) {
    const root = sectionEl || document.querySelector('#diary');
    if (!root) return;

    // Avoid double initialization
    if (root.dataset.diaryInitialized === 'true') return;
    root.dataset.diaryInitialized = 'true';

    const inside = root.querySelector('#diaryInside');
    const openBookBtn = root.querySelector('#openBook');
    const closeBookBtn = root.querySelector('#closeBook');

    // Modals
    const modalWriteBlog = root.querySelector('#modalWriteBlog');
    const modalShareArt = root.querySelector('#modalShareArt');
    const modalAddMusic = root.querySelector('#modalAddMusic');
    const modalReadBlog = root.querySelector('#modalReadBlog');
    const modalArtLightbox = root.querySelector('#modalArtLightbox');
    const modalReport = root.querySelector('#modalReport');
    const modalVaultInfo = root.querySelector('#modalVaultInfo');
    const modalCloudInfo = root.querySelector('#modalCloudInfo');

    // Forms
    const formWriteBlog = root.querySelector('#formWriteBlog');
    const formShareArt = root.querySelector('#formShareArt');
    const formAddMusic = root.querySelector('#formAddMusic');
    const guestForm = root.querySelector('#guestForm');
    const formReport = root.querySelector('#formReport');

    // Feeds
    const blogsFeed = root.querySelector('#blogsFeed');
    const artGallery = root.querySelector('#artGallery');
    const musicFeed = root.querySelector('#musicFeed');
    const guestbookFeed = root.querySelector('#guestbookFeed');
    const vaultSummaryCount = root.querySelector('#vaultSummary .vault-count-text');

    // Active state
    let activeBlogFilter = 'all';
    let activeMusicFilter = 'all';
    let lastSubmissionTime = 0;
    const SUBMISSION_COOLDOWN_MS = 12000; // 12 seconds anti-flood cooldown
    let currentReadingEntry = null;
    let currentLightboxEntry = null;

    // Helper: Toast notification
    function notify(msg) {
        if (typeof window.portfolioNotify === 'function') {
            window.portfolioNotify(msg);
        } else {
            console.log('Portfolio notification:', msg);
        }
    }

    // Helper: Sanitize & parse external URLs
    function parseSpotifyEmbed(url) {
        try {
            const u = new URL(url);
            if (!u.hostname.includes('spotify.com')) return null;
            // Examples: /playlist/ID, /track/ID, /album/ID
            const pathParts = u.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
                const type = pathParts[0]; // playlist, track, album
                const id = pathParts[1].split('?')[0];
                return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
            }
        } catch (e) {}
        return null;
    }

    function parseYouTubeEmbed(url) {
        try {
            const u = new URL(url);
            let videoId = null;
            if (u.hostname === 'youtu.be') {
                videoId = u.pathname.slice(1).split('?')[0];
            } else if (u.hostname.includes('youtube.com')) {
                videoId = u.searchParams.get('v');
            }
            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
            }
        } catch (e) {}
        return null;
    }

    // Helper: Format Date
    function formatDate(isoString) {
        if (!isoString) return 'Just now';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Recent';
        }
    }

    // =========================================================================
    // 1. BOOK OPEN / CLOSE INTERACTIONS
    // =========================================================================
    function openDiary() {
        root.classList.add('diary-open');
        inside.classList.add('open');
        inside.scrollTop = 0;
        inside.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        updateVaultCountUI();
        updateCloudStatusUI();
        loadAllFeeds();
    }

    function closeDiary() {
        closeAllModals();
        inside.classList.remove('open');
        root.classList.remove('diary-open');
        inside.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openBookBtn?.addEventListener('click', openDiary);
    closeBookBtn?.addEventListener('click', closeDiary);

    // =========================================================================
    // 2. MODAL CONTROLS
    // =========================================================================
    function openModal(modalEl) {
        if (!modalEl) {
            console.warn('Target modal element not found');
            return;
        }
        modalEl.classList.add('open');
        modalEl.setAttribute('aria-hidden', 'false');
        const firstInput = modalEl.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 80);
        }
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        modalEl.setAttribute('aria-hidden', 'true');
    }

    function closeAllModals() {
        root.querySelectorAll('.diary-modal-backdrop').forEach(modal => {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    // Delegated click listeners for modal open buttons
    root.addEventListener('click', (e) => {
        const writeBlogBtn = e.target.closest('#btnOpenWriteBlog');
        if (writeBlogBtn) {
            e.preventDefault();
            e.stopPropagation();
            openModal(modalWriteBlog || root.querySelector('#modalWriteBlog'));
            return;
        }

        const shareArtBtn = e.target.closest('#btnOpenShareArt');
        if (shareArtBtn) {
            e.preventDefault();
            e.stopPropagation();
            openModal(modalShareArt || root.querySelector('#modalShareArt'));
            return;
        }

        const addMusicBtn = e.target.closest('#btnOpenAddMusic');
        if (addMusicBtn) {
            e.preventDefault();
            e.stopPropagation();
            openModal(modalAddMusic || root.querySelector('#modalAddMusic'));
            return;
        }

        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            const backdrop = closeBtn.closest('.diary-modal-backdrop');
            closeModal(backdrop);
            return;
        }
    });

    root.querySelectorAll('.diary-modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal(backdrop);
        });
    });

    // Escape Key Handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModalEl = root.querySelector('.diary-modal-backdrop.open');
            if (openModalEl) {
                closeModal(openModalEl);
            } else if (inside.classList.contains('open')) {
                closeDiary();
            }
        }
    });

    // =========================================================================
    // 3. TAB NAVIGATION
    // =========================================================================
    root.querySelectorAll('[data-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const targetTab = tabBtn.dataset.tab;
            root.querySelectorAll('[data-tab]').forEach(btn => btn.classList.toggle('active', btn === tabBtn));
            root.querySelectorAll('.diary-content').forEach(panel => {
                panel.classList.toggle('active', panel.id === `tab-${targetTab}`);
            });
        });
    });

    // =========================================================================
    // 4. CLOUD & VAULT STATUS UI
    // =========================================================================
    function updateVaultCountUI() {
        if (!window.DiaryBackend) return;
        const vault = window.DiaryBackend.vault.getVault();
        const count = Object.keys(vault).length;
        if (vaultSummaryCount) {
            vaultSummaryCount.textContent = count === 1
                ? '1 contribution owned on this device'
                : `${count} contributions owned on this device`;
        }
    }

    function updateCloudStatusUI() {
        const badge = root.querySelector('#cloudStatusBadge');
        const desc = root.querySelector('#cloudStatusDescription');
        const storageNote = root.querySelector('#diaryStorageNote');
        if (!window.DiaryBackend) {
            if (storageNote) {
                storageNote.textContent = 'The diary is temporarily unavailable.';
                storageNote.hidden = false;
            }
            return;
        }

        if (window.DiaryBackend.isRealCloud) {
            if (storageNote) {
                storageNote.textContent = '';
                storageNote.hidden = true;
            }
            if (badge) {
                badge.textContent = '● Shared Supabase DB Active';
                badge.classList.remove('demo-mode');
            }
            if (desc) {
                desc.textContent = 'Contributions are stored in the shared online archive.';
            }
        } else {
            if (storageNote) {
                storageNote.textContent = 'Preview mode: contributions are saved only in this browser and are not shared online.';
                storageNote.hidden = false;
            }
            if (badge) {
                badge.textContent = '○ Browser-only preview';
                badge.classList.add('demo-mode');
            }
            if (desc) {
                desc.textContent = 'Contributions are saved only in this browser and are not shared online.';
            }
        }
    }

    root.querySelector('#btnOpenCloudInfo')?.addEventListener('click', () => {
        updateCloudStatusUI();
        openModal(modalCloudInfo);
    });

    root.querySelector('#btnOpenVault')?.addEventListener('click', () => {
        if (!window.DiaryBackend) return;
        const jsonArea = root.querySelector('#vaultJsonArea');
        if (jsonArea) {
            jsonArea.value = window.DiaryBackend.vault.exportVaultJson();
        }
        openModal(modalVaultInfo);
    });

    root.querySelector('#btnCopyVaultKeys')?.addEventListener('click', async () => {
        const jsonArea = root.querySelector('#vaultJsonArea');
        if (jsonArea) {
            try {
                await navigator.clipboard.writeText(jsonArea.value);
                notify('Cryptographic keys copied to clipboard!');
            } catch (e) {
                jsonArea.select();
                document.execCommand('copy');
                notify('Keys copied to clipboard.');
            }
        }
    });

    root.querySelector('#btnImportVaultKeys')?.addEventListener('click', () => {
        const input = prompt('Paste your exported device vault JSON here:');
        if (!input) return;
        const success = window.DiaryBackend.vault.importVaultJson(input);
        if (success) {
            notify('Vault imported successfully!');
            updateVaultCountUI();
            loadAllFeeds();
            closeModal(modalVaultInfo);
        } else {
            alert('Invalid JSON format. Please ensure you paste valid exported keys.');
        }
    });

    // =========================================================================
    // 5. DATA RENDERING (Strict Safe Text DOM Nodes)
    // =========================================================================

    // 5A. Render Blogs & Thoughts
    async function loadBlogs() {
        if (!blogsFeed) return;
        try {
            const entries = await window.DiaryBackend.fetchEntries('blog');
            renderBlogsList(entries);
        } catch (err) {
            console.error('Error fetching blogs:', err);
            blogsFeed.innerHTML = '<div class="diary-empty-state">Thoughts could not be loaded right now. Please try again later.</div>';
        }
    }

    function renderBlogsList(entries) {
        blogsFeed.innerHTML = '';
        const filtered = entries.filter(e => {
            if (activeBlogFilter === 'all') return true;
            return Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase() === activeBlogFilter.toLowerCase());
        });

        if (filtered.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-empty-state';
            emptyEl.textContent = activeBlogFilter === 'all'
                ? 'No thoughts yet. Be the first to share one.'
                : 'No thoughts in this theme yet.';
            blogsFeed.appendChild(emptyEl);
            return;
        }

        filtered.forEach(entry => {
            const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
            const card = document.createElement('article');
            card.className = 'blog-card';
            card.dataset.id = entry.id;

            // Meta row
            const meta = document.createElement('div');
            meta.className = 'blog-card-meta';

            const authorSpan = document.createElement('span');
            authorSpan.className = 'blog-author-badge';
            authorSpan.textContent = entry.author || 'Anonymous Traveler';
            meta.appendChild(authorSpan);

            if (isOwned) {
                const ownedBadge = document.createElement('span');
                ownedBadge.className = 'badge-author-owned';
                ownedBadge.textContent = '✦ Created by you';
                meta.appendChild(ownedBadge);
            }

            const dot = document.createElement('span');
            dot.textContent = '•';
            meta.appendChild(dot);

            const dateSpan = document.createElement('span');
            dateSpan.textContent = formatDate(entry.created_at);
            meta.appendChild(dateSpan);

            card.appendChild(meta);

            // Title
            const titleEl = document.createElement('h3');
            titleEl.className = 'blog-card-title';
            titleEl.textContent = entry.title || 'Untitled Thought';
            titleEl.addEventListener('click', () => openReadBlogModal(entry));
            card.appendChild(titleEl);

            // Excerpt
            const excerptEl = document.createElement('p');
            excerptEl.className = 'blog-card-excerpt';
            const rawContent = entry.content || '';
            excerptEl.textContent = rawContent.length > 210 ? rawContent.substring(0, 205) + '…' : rawContent;
            card.appendChild(excerptEl);

            // Footer
            const footer = document.createElement('div');
            footer.className = 'blog-card-footer';

            // Tags
            const tagsWrap = document.createElement('div');
            tagsWrap.className = 'blog-tags';
            if (Array.isArray(entry.tags) && entry.tags.length > 0) {
                entry.tags.forEach(tag => {
                    const pill = document.createElement('span');
                    pill.className = 'blog-tag-pill';
                    pill.textContent = `#${tag}`;
                    tagsWrap.appendChild(pill);
                });
            }
            footer.appendChild(tagsWrap);

            // Actions
            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'blog-card-actions';

            const readBtn = document.createElement('button');
            readBtn.className = 'btn-read-full';
            readBtn.type = 'button';
            readBtn.textContent = 'Read Full Thought ↗';
            readBtn.addEventListener('click', () => openReadBlogModal(entry));
            actionsWrap.appendChild(readBtn);

            if (isOwned) {
                const delBtn = document.createElement('button');
                delBtn.className = 'btn-action-delete';
                delBtn.type = 'button';
                delBtn.textContent = 'Delete';
                delBtn.addEventListener('click', () => handleDeleteEntry(entry.id, 'thought'));
                actionsWrap.appendChild(delBtn);
            }

            const reportBtn = document.createElement('button');
            reportBtn.className = 'btn-report-flag';
            reportBtn.type = 'button';
            reportBtn.textContent = '🚩 Report';
            reportBtn.addEventListener('click', () => openReportDialog(entry.id));
            actionsWrap.appendChild(reportBtn);

            footer.appendChild(actionsWrap);
            card.appendChild(footer);

            blogsFeed.appendChild(card);
        });
    }

    // Blog Category filter buttons
    root.querySelectorAll('#blogFilters .cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            root.querySelectorAll('#blogFilters .cat-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeBlogFilter = btn.dataset.filter || 'all';
            loadBlogs();
        });
    });

    // 5B. Render Art Gallery
    async function loadArt() {
        if (!artGallery) return;
        try {
            const entries = await window.DiaryBackend.fetchEntries('art');
            renderArtGallery(entries);
        } catch (err) {
            console.error('Error fetching art:', err);
            artGallery.innerHTML = '<div class="diary-empty-state">The gallery could not be loaded right now. Please try again later.</div>';
        }
    }

    function renderArtGallery(entries) {
        artGallery.innerHTML = '';
        if (entries.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-empty-state';
            emptyEl.textContent = 'No artwork here yet. The gallery is ready for its first piece.';
            artGallery.appendChild(emptyEl);
            return;
        }

        entries.forEach(entry => {
            const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
            const card = document.createElement('div');
            card.className = 'art-card';
            card.dataset.id = entry.id;

            const thumbWrap = document.createElement('div');
            thumbWrap.className = 'art-thumbnail-wrap';

            const img = document.createElement('img');
            img.className = 'art-img';
            img.src = entry.media_url || 'assets/Diary image.jpg';
            img.alt = entry.title || 'Exhibited Artwork';
            img.loading = 'lazy';
            thumbWrap.appendChild(img);

            card.appendChild(thumbWrap);

            const info = document.createElement('div');
            info.className = 'art-card-info';

            const title = document.createElement('h4');
            title.className = 'art-card-title';
            title.textContent = entry.title || 'Untitled Artwork';
            info.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'art-card-meta';

            const artist = document.createElement('span');
            artist.textContent = `by ${entry.author || 'Anonymous Artist'}`;
            meta.appendChild(artist);

            if (isOwned) {
                const owned = document.createElement('span');
                owned.className = 'badge-author-owned';
                owned.textContent = 'Owned';
                meta.appendChild(owned);
            }

            info.appendChild(meta);
            card.appendChild(info);

            card.addEventListener('click', () => openLightbox(entry));
            artGallery.appendChild(card);
        });
    }

    // 5C. Render Soundtrack
    async function loadMusic() {
        if (!musicFeed) return;
        try {
            const entries = await window.DiaryBackend.fetchEntries('music');
            renderMusicFeed(entries);
        } catch (err) {
            console.error('Error fetching music:', err);
            musicFeed.innerHTML = '<div class="diary-empty-state">The soundtrack could not be loaded right now. Please try again later.</div>';
        }
    }

    function renderMusicFeed(entries) {
        musicFeed.innerHTML = '';
        const filtered = entries.filter(e => {
            if (activeMusicFilter === 'all') return true;
            return (e.platform || '').toLowerCase() === activeMusicFilter.toLowerCase();
        });

        if (filtered.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-empty-state';
            emptyEl.textContent = activeMusicFilter === 'all'
                ? 'No music here yet. Add a playlist to start the collection.'
                : `No ${activeMusicFilter} playlists in the collection yet.`;
            musicFeed.appendChild(emptyEl);
            return;
        }

        filtered.forEach(entry => {
            const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
            const card = document.createElement('div');
            card.className = 'music-card';
            card.dataset.id = entry.id;

            // Header
            const header = document.createElement('div');
            header.className = 'music-card-header';

            const titleWrap = document.createElement('div');
            const title = document.createElement('h3');
            title.className = 'music-card-title';
            title.textContent = entry.title || 'Untitled Soundtrack';
            titleWrap.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'music-card-meta';
            const metaItems = [];
            if (entry.author) metaItems.push(`Shared by ${entry.author}`);
            if (entry.created_at) metaItems.push(formatDate(entry.created_at));
            if (metaItems.length) {
                meta.textContent = metaItems.join(' • ');
                titleWrap.appendChild(meta);
            }

            header.appendChild(titleWrap);

            const platformBadge = document.createElement('span');
            platformBadge.className = `music-platform-badge ${entry.platform || 'other'}`;
            platformBadge.textContent = entry.platform || 'Link';
            header.appendChild(platformBadge);

            card.appendChild(header);

            // Embed player or fallback
            let embedUrl = entry.embed_url;
            if (!embedUrl && entry.external_url) {
                if (entry.platform === 'spotify') embedUrl = parseSpotifyEmbed(entry.external_url);
                if (entry.platform === 'youtube') embedUrl = parseYouTubeEmbed(entry.external_url);
            }

            if (embedUrl) {
                const embedWrap = document.createElement('div');
                embedWrap.className = 'music-embed-container';

                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '100%';
                iframe.height = entry.platform === 'spotify' ? '152' : '280';
                iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
                iframe.loading = 'lazy';
                iframe.title = entry.title || 'Music Player';
                embedWrap.appendChild(iframe);

                card.appendChild(embedWrap);
            }

            // Description
            if (entry.content) {
                const desc = document.createElement('p');
                desc.className = 'music-card-desc';
                desc.textContent = entry.content;
                card.appendChild(desc);
            }

            // External Link & Actions
            const footer = document.createElement('div');
            footer.className = 'blog-card-footer';

            if (entry.external_url) {
                const link = document.createElement('a');
                link.className = 'music-card-link-fallback';
                link.href = entry.external_url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Listen directly on provider site ↗';
                footer.appendChild(link);
            } else {
                footer.appendChild(document.createElement('span'));
            }

            const actions = document.createElement('div');
            actions.className = 'blog-card-actions';

            if (isOwned) {
                const delBtn = document.createElement('button');
                delBtn.className = 'btn-action-delete';
                delBtn.type = 'button';
                delBtn.textContent = 'Delete';
                delBtn.addEventListener('click', () => handleDeleteEntry(entry.id, 'playlist'));
                actions.appendChild(delBtn);
            }

            const repBtn = document.createElement('button');
            repBtn.className = 'btn-report-flag';
            repBtn.type = 'button';
            repBtn.textContent = '🚩 Report';
            repBtn.addEventListener('click', () => openReportDialog(entry.id));
            actions.appendChild(repBtn);

            footer.appendChild(actions);
            card.appendChild(footer);

            musicFeed.appendChild(card);
        });
    }

    root.querySelectorAll('#musicFilters .cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            root.querySelectorAll('#musicFilters .cat-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeMusicFilter = btn.dataset.filter || 'all';
            loadMusic();
        });
    });

    // 5D. Render Guestbook
    async function loadGuestbook() {
        if (!guestbookFeed) return;
        try {
            const entries = await window.DiaryBackend.fetchEntries('guestbook');
            renderGuestbookFeed(entries);
        } catch (err) {
            console.error('Error fetching guestbook:', err);
            guestbookFeed.innerHTML = '<div class="diary-empty-state">The logbook could not be loaded right now. Please try again later.</div>';
        }
    }

    function renderGuestbookFeed(entries) {
        guestbookFeed.innerHTML = '';
        if (entries.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-empty-state';
            emptyEl.textContent = 'No messages yet. The logbook is ready for its first note.';
            guestbookFeed.appendChild(emptyEl);
            return;
        }

        entries.forEach(entry => {
            const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
            const card = document.createElement('div');
            card.className = 'guest-card';
            card.dataset.id = entry.id;

            const header = document.createElement('div');
            header.className = 'guest-card-header';

            const authorSpan = document.createElement('span');
            authorSpan.className = 'guest-card-author';
            authorSpan.textContent = `✦ ${entry.author || 'Anonymous Traveler'}`;
            header.appendChild(authorSpan);

            if (isOwned) {
                const owned = document.createElement('span');
                owned.className = 'badge-author-owned';
                owned.textContent = 'You';
                header.appendChild(owned);
            }

            const dateSpan = document.createElement('span');
            dateSpan.className = 'guest-card-date';
            dateSpan.textContent = formatDate(entry.created_at);
            header.appendChild(dateSpan);

            card.appendChild(header);

            const msgEl = document.createElement('p');
            msgEl.className = 'guest-card-message';
            msgEl.textContent = entry.content || '';
            card.appendChild(msgEl);

            const footer = document.createElement('div');
            footer.className = 'guest-card-footer';

            if (isOwned) {
                const delBtn = document.createElement('button');
                delBtn.className = 'btn-action-delete';
                delBtn.type = 'button';
                delBtn.textContent = 'Delete';
                delBtn.addEventListener('click', () => handleDeleteEntry(entry.id, 'message'));
                footer.appendChild(delBtn);
            }

            const repBtn = document.createElement('button');
            repBtn.className = 'btn-report-flag';
            repBtn.type = 'button';
            repBtn.textContent = '🚩 Report';
            repBtn.addEventListener('click', () => openReportDialog(entry.id));
            footer.appendChild(repBtn);

            card.appendChild(footer);
            guestbookFeed.appendChild(card);
        });
    }

    function loadAllFeeds() {
        loadBlogs();
        loadArt();
        loadMusic();
        loadGuestbook();
    }

    // Subscribe to backend realtime updates
    if (window.DiaryBackend && typeof window.DiaryBackend.subscribe === 'function') {
        window.DiaryBackend.subscribe(() => {
            console.info('✦ Shared cloud update received, refreshing feeds.');
            loadAllFeeds();
            updateVaultCountUI();
        });
    }

    // =========================================================================
    // 6. READING MODAL (Full Blog Article View)
    // =========================================================================
    function openReadBlogModal(entry) {
        currentReadingEntry = entry;
        const tagEl = root.querySelector('#readBlogTag');
        const dateEl = root.querySelector('#readBlogDate');
        const authorEl = root.querySelector('#readBlogAuthor');
        const titleEl = root.querySelector('#readBlogModalTitle');
        const bodyEl = root.querySelector('#readBlogBody');
        const authorActions = root.querySelector('#readBlogAuthorActions');

        if (tagEl) tagEl.textContent = (entry.tags && entry.tags[0]) || 'Reflection';
        if (dateEl) dateEl.textContent = formatDate(entry.created_at);
        if (authorEl) authorEl.textContent = `Written by ${entry.author || 'Anonymous Traveler'}`;
        if (titleEl) titleEl.textContent = entry.title || 'Untitled Thought';
        if (bodyEl) bodyEl.textContent = entry.content || '';

        const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
        if (authorActions) {
            authorActions.style.display = isOwned ? 'flex' : 'none';
        }

        openModal(modalReadBlog);
    }

    root.querySelector('#btnDeleteOwnedBlog')?.addEventListener('click', async () => {
        if (!currentReadingEntry) return;
        const deleted = await handleDeleteEntry(currentReadingEntry.id, 'thought');
        if (deleted) closeModal(modalReadBlog);
    });

    root.querySelector('#btnEditOwnedBlog')?.addEventListener('click', async () => {
        if (!currentReadingEntry) return;
        const newTitle = prompt('Edit title:', currentReadingEntry.title || '');
        if (newTitle === null) return;
        const newContent = prompt('Edit content:', currentReadingEntry.content || '');
        if (newContent === null) return;

        const token = window.DiaryBackend.vault.getToken(currentReadingEntry.id);
        const res = await window.DiaryBackend.editEntry(currentReadingEntry.id, token, {
            title: newTitle,
            content: newContent
        });

        if (res.success) {
            notify('Thought updated successfully!');
            currentReadingEntry.title = newTitle;
            currentReadingEntry.content = newContent;
            openReadBlogModal(currentReadingEntry);
            loadBlogs();
        } else {
            alert(res.error || 'Could not update entry.');
        }
    });

    root.querySelector('#btnReportCurrentBlog')?.addEventListener('click', () => {
        if (!currentReadingEntry) return;
        closeModal(modalReadBlog);
        openReportDialog(currentReadingEntry.id);
    });

    // =========================================================================
    // 7. ART LIGHTBOX MODAL
    // =========================================================================
    function openLightbox(entry) {
        currentLightboxEntry = entry;
        const img = root.querySelector('#lightboxImg');
        const title = root.querySelector('#lightboxTitle');
        const author = root.querySelector('#lightboxAuthor');
        const date = root.querySelector('#lightboxDate');
        const caption = root.querySelector('#lightboxCaption');
        const authorActions = root.querySelector('#lightboxAuthorActions');

        if (img) img.src = entry.media_url || 'assets/Diary image.jpg';
        if (title) title.textContent = entry.title || 'Untitled Artwork';
        if (author) author.textContent = `Artist: ${entry.author || 'Anonymous Creator'}`;
        if (date) date.textContent = formatDate(entry.created_at);
        if (caption) caption.textContent = entry.content || '';

        const isOwned = window.DiaryBackend.vault.hasOwnership(entry.id);
        if (authorActions) {
            authorActions.style.display = isOwned ? 'block' : 'none';
        }

        openModal(modalArtLightbox);
    }

    root.querySelector('#btnDeleteOwnedArt')?.addEventListener('click', async () => {
        if (!currentLightboxEntry) return;
        const deleted = await handleDeleteEntry(currentLightboxEntry.id, 'artwork');
        if (deleted) closeModal(modalArtLightbox);
    });

    root.querySelector('#btnReportCurrentArt')?.addEventListener('click', () => {
        if (!currentLightboxEntry) return;
        closeModal(modalArtLightbox);
        openReportDialog(currentLightboxEntry.id);
    });

    // =========================================================================
    // 8. REPORTING WORKFLOW
    // =========================================================================
    function openReportDialog(entryId) {
        const idInput = root.querySelector('#reportTargetId');
        if (idInput) idInput.value = entryId;
        const feedback = root.querySelector('#reportModalStatus');
        if (feedback) feedback.style.display = 'none';
        openModal(modalReport);
    }

    formReport?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const entryId = root.querySelector('#reportTargetId').value;
        const reasonInput = formReport.querySelector('input[name="reportReason"]:checked');
        const detailsInput = formReport.querySelector('#reportDetails');
        const feedback = root.querySelector('#reportModalStatus');

        if (!entryId || !reasonInput) return;

        try {
            const result = await window.DiaryBackend.reportEntry(entryId, reasonInput.value, detailsInput.value);
            if (feedback) {
                feedback.className = 'modal-feedback success';
                feedback.textContent = result.message || 'Report received. Thank you!';
                feedback.style.display = 'block';
            }

            setTimeout(() => {
                closeModal(modalReport);
                formReport.reset();
                loadAllFeeds();
            }, 1400);
        } catch (err) {
            if (feedback) {
                feedback.className = 'modal-feedback error';
                feedback.textContent = err.message || 'Could not submit report.';
                feedback.style.display = 'block';
            }
        }
    });

    // =========================================================================
    // 9. DELETE ENTRY HANDLER
    // =========================================================================
    async function handleDeleteEntry(entryId, label) {
        const confirmMsg = `Remove your ${label} from the shared space? This action is permanent.`;
        if (!confirm(confirmMsg)) return false;

        const token = window.DiaryBackend.vault.getToken(entryId);
        if (!token) {
            alert('Ownership token not found on this device.');
            return false;
        }

        try {
            const res = await window.DiaryBackend.deleteEntry(entryId, token);
            if (res.success) {
                notify('Contribution removed successfully.');
                updateVaultCountUI();
                loadAllFeeds();
                return true;
            } else {
                alert(res.error || 'Could not delete entry.');
                return false;
            }
        } catch (err) {
            alert(err.message || 'Error communicating with backend.');
            return false;
        }
    }

    // =========================================================================
    // 10. SUBMISSION HANDLERS WITH SPAM & RATE LIMITING
    // =========================================================================

    function checkRateLimit() {
        const now = Date.now();
        if (now - lastSubmissionTime < SUBMISSION_COOLDOWN_MS) {
            const waitSec = Math.ceil((SUBMISSION_COOLDOWN_MS - (now - lastSubmissionTime)) / 1000);
            notify(`Please wait ${waitSec}s before publishing another entry.`);
            return false;
        }
        return true;
    }

    function checkHoneypot(form) {
        const hp = form.querySelector('input[name="website_url"]');
        if (hp && hp.value.trim().length > 0) {
            console.warn('Bot submission blocked by honeypot.');
            return false;
        }
        return true;
    }

    // 10A. Submit Blog Form
    root.querySelector('#btnOpenWriteBlog')?.addEventListener('click', () => openModal(modalWriteBlog));

    const blogContentInput = root.querySelector('#blogContent');
    const blogCharCount = root.querySelector('#blogCharCount');
    blogContentInput?.addEventListener('input', () => {
        if (blogCharCount) {
            const left = 4000 - blogContentInput.value.length;
            blogCharCount.textContent = Math.max(0, left);
        }
    });

    formWriteBlog?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!checkHoneypot(formWriteBlog)) return;
        if (!checkRateLimit()) return;

        const title = formWriteBlog.title.value.trim();
        const author = formWriteBlog.author.value.trim() || 'Anonymous Traveler';
        const category = formWriteBlog.category.value;
        const content = formWriteBlog.content.value.trim();
        const feedback = root.querySelector('#blogModalStatus');
        const submitBtn = root.querySelector('#btnSubmitBlog');

        if (title.length < 2) {
            alert('Please provide a title with at least 2 characters.');
            return;
        }
        if (content.length < 10) {
            alert('Your thought must be at least 10 characters long.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing…';

        try {
            const rawToken = window.DiaryBackend.vault.generateToken();
            const res = await window.DiaryBackend.createEntry({
                type: 'blog',
                title,
                author,
                content,
                tags: [category]
            }, rawToken);

            if (res.success) {
                lastSubmissionTime = Date.now();
                feedback.className = 'modal-feedback success';
                feedback.textContent = '✦ Your thought has been published.';
                feedback.style.display = 'block';

                setTimeout(() => {
                    closeModal(modalWriteBlog);
                    formWriteBlog.reset();
                    feedback.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '✦ Publish Thought';
                    updateVaultCountUI();
                    loadBlogs();
                    notify('Thought published.');
                }, 1200);
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✦ Publish Thought';
            feedback.className = 'modal-feedback error';
            feedback.textContent = err.message || 'Failed to publish entry.';
            feedback.style.display = 'block';
        }
    });

    // 10B. Submit Art Form (Image Upload)
    root.querySelector('#btnOpenShareArt')?.addEventListener('click', () => openModal(modalShareArt));

    const artDropZone = root.querySelector('#artDropZone');
    const artFileInput = root.querySelector('#artFileInput');
    const dropPrompt = root.querySelector('#dropPrompt');
    const dropPreview = root.querySelector('#dropPreview');
    const previewImg = root.querySelector('#previewImg');
    const btnClearArtPreview = root.querySelector('#btnClearArtPreview');
    let selectedArtFile = null;

    artDropZone?.addEventListener('click', (e) => {
        if (e.target !== btnClearArtPreview) {
            artFileInput.click();
        }
    });

    artDropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        artDropZone.classList.add('dragover');
    });

    artDropZone?.addEventListener('dragleave', () => artDropZone.classList.remove('dragover'));

    artDropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        artDropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleArtFileSelection(e.dataTransfer.files[0]);
        }
    });

    artFileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleArtFileSelection(e.target.files[0]);
        }
    });

    function handleArtFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG, WebP, GIF).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File exceeds 5MB size limit. Please choose a smaller image.');
            return;
        }
        selectedArtFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            dropPrompt.style.display = 'none';
            dropPreview.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }

    btnClearArtPreview?.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedArtFile = null;
        artFileInput.value = '';
        previewImg.removeAttribute('src');
        dropPreview.style.display = 'none';
        dropPrompt.style.display = 'flex';
    });

    formShareArt?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!checkHoneypot(formShareArt)) return;
        if (!checkRateLimit()) return;

        if (!selectedArtFile) {
            alert('Please select an image file to upload.');
            return;
        }

        const title = formShareArt.title.value.trim();
        const author = formShareArt.author.value.trim() || 'Anonymous Artist';
        const caption = formShareArt.caption.value.trim();
        const feedback = root.querySelector('#artModalStatus');
        const submitBtn = root.querySelector('#btnSubmitArt');
        const progressWrapper = root.querySelector('#artUploadProgress');
        const progressBar = root.querySelector('#artProgressBar');
        const progressLabel = root.querySelector('#artProgressLabel');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading…';
        progressWrapper.style.display = 'block';

        try {
            // Upload image
            const uploadResult = await window.DiaryBackend.uploadImage(selectedArtFile, (pct) => {
                progressBar.style.width = `${pct}%`;
                progressLabel.textContent = `Uploading artwork: ${pct}%`;
            });

            // Create record
            const rawToken = window.DiaryBackend.vault.generateToken();
            const res = await window.DiaryBackend.createEntry({
                type: 'art',
                title,
                author,
                content: caption,
                media_url: uploadResult.url
            }, rawToken);

            if (res.success) {
                lastSubmissionTime = Date.now();
                feedback.className = 'modal-feedback success';
                feedback.textContent = '✦ Your artwork has been added to the gallery.';
                feedback.style.display = 'block';

                setTimeout(() => {
                    closeModal(modalShareArt);
                    formShareArt.reset();
                    selectedArtFile = null;
                    dropPreview.style.display = 'none';
                    dropPrompt.style.display = 'flex';
                    progressWrapper.style.display = 'none';
                    feedback.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '✦ Exhibit Artwork';
                    updateVaultCountUI();
                    loadArt();
                    notify('Artwork added to the gallery.');
                }, 1200);
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✦ Exhibit Artwork';
            progressWrapper.style.display = 'none';
            feedback.className = 'modal-feedback error';
            feedback.textContent = err.message || 'Image upload failed.';
            feedback.style.display = 'block';
        }
    });

    // 10C. Submit Music Form
    root.querySelector('#btnOpenAddMusic')?.addEventListener('click', () => openModal(modalAddMusic));

    formAddMusic?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!checkHoneypot(formAddMusic)) return;
        if (!checkRateLimit()) return;

        const platform = formAddMusic.platform.value;
        const author = formAddMusic.author.value.trim() || 'Anonymous listener';
        const title = formAddMusic.title.value.trim();
        const url = formAddMusic.url.value.trim();
        const desc = formAddMusic.desc.value.trim();
        const feedback = root.querySelector('#musicModalStatus');
        const submitBtn = root.querySelector('#btnSubmitMusic');

        // URL validation
        try {
            new URL(url);
        } catch (err) {
            alert('Please provide a valid, complete web URL (e.g. https://open.spotify.com/...)');
            return;
        }

        let embedUrl = null;
        if (platform === 'spotify') embedUrl = parseSpotifyEmbed(url);
        if (platform === 'youtube') embedUrl = parseYouTubeEmbed(url);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Connecting…';

        try {
            const rawToken = window.DiaryBackend.vault.generateToken();
            const res = await window.DiaryBackend.createEntry({
                type: 'music',
                title,
                author,
                platform,
                external_url: url,
                embed_url: embedUrl,
                content: desc
            }, rawToken);

            if (res.success) {
                lastSubmissionTime = Date.now();
                feedback.className = 'modal-feedback success';
                feedback.textContent = '✦ The soundtrack has been added.';
                feedback.style.display = 'block';

                setTimeout(() => {
                    closeModal(modalAddMusic);
                    formAddMusic.reset();
                    feedback.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '✦ Add to Soundtrack';
                    updateVaultCountUI();
                    loadMusic();
                    notify('Playlist added to the soundtrack.');
                }, 1200);
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✦ Add to Soundtrack';
            feedback.className = 'modal-feedback error';
            feedback.textContent = err.message || 'Failed to submit soundtrack.';
            feedback.style.display = 'block';
        }
    });

    // 10D. Submit Guestbook Message Form
    const guestMessageInput = root.querySelector('#guestMessage');
    const guestCharCount = root.querySelector('#guestCharCount');
    guestMessageInput?.addEventListener('input', () => {
        if (guestCharCount) {
            const left = 600 - guestMessageInput.value.length;
            guestCharCount.textContent = Math.max(0, left);
        }
    });

    guestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!checkHoneypot(guestForm)) return;
        if (!checkRateLimit()) return;

        const name = guestForm.name.value.trim() || 'A Traveler Under the Stars';
        const message = guestForm.message.value.trim();
        const statusEl = root.querySelector('#formStatus');
        const submitBtn = root.querySelector('#guestSubmitBtn');

        if (message.length < 2) {
            alert('Please write a message before submitting.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Leaving your mark…';
        if (statusEl) statusEl.textContent = '';

        try {
            const rawToken = window.DiaryBackend.vault.generateToken();
            const res = await window.DiaryBackend.createEntry({
                type: 'guestbook',
                title: null,
                author: name,
                content: message
            }, rawToken);

            if (res.success) {
                lastSubmissionTime = Date.now();
                guestForm.reset();
                if (guestCharCount) guestCharCount.textContent = '600';
                if (statusEl) {
                    statusEl.style.color = '#155724';
                    statusEl.textContent = '✦ Your message has been added.';
                }

                submitBtn.disabled = false;
                submitBtn.textContent = '✦ Leave a Mark';
                updateVaultCountUI();
                loadGuestbook();
                notify('Guestbook message added.');

                setTimeout(() => {
                    if (statusEl) statusEl.textContent = '';
                }, 4000);
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✦ Leave a Mark';
            if (statusEl) {
                statusEl.style.color = '#721c24';
                statusEl.textContent = err.message || 'Could not save message.';
            }
        }
    });

    // Initial check and feeds loading
    updateVaultCountUI();
    updateCloudStatusUI();
    loadAllFeeds();
};

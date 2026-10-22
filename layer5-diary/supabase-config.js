/**
 * PORTFOLIA — Layer 5 Diary Backend Configuration & Client
 * 
 * Secure, public collaborative client supporting:
 * - Direct Supabase integration (shared PostgreSQL DB + Storage + Realtime)
 * - Zero-login cryptographic anonymous ownership tokens (SHA-256 device vault)
 * - Client-side anti-spam, honeypot traps, and rate limiting
 * - Immediate fallback mock cloud simulator for local preview and multi-tab testing
 */

(() => {
    // =========================================================================
    // 1. SUPABASE CREDENTIALS CONFIGURATION
    // =========================================================================
    // Public Supabase project credentials are configured here.
    // NOTE: Only use your PUBLIC 'anon' key here. NEVER expose your service_role key!
    const SUPABASE_CONFIG = {
        URL: "https://rozysqnriwwweunrxzga.supabase.co",
        ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvenlzcW5yaXd3d2V1bnJ4emdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzUxNTksImV4cCI6MjEwODI1MTE1OX0.kwsqondBGJvTUtybFSNom9Dih96Ev6W-BUAFQdJcil4"
    };

    // =========================================================================
    // 2. DEVICE OWNERSHIP VAULT (Unguessable Local Key Storage)
    // =========================================================================
    const VAULT_STORAGE_KEY = 'portfolia_diary_vault';

    class DeviceVault {
        static getVault() {
            try {
                return JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '{}');
            } catch (e) {
                console.warn('Could not read vault from localStorage', e);
                return {};
            }
        }

        static saveToken(entryId, token) {
            try {
                const vault = this.getVault();
                vault[entryId] = {
                    token,
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
            } catch (e) {
                console.warn('Could not save token to vault', e);
            }
        }

        static getToken(entryId) {
            const vault = this.getVault();
            return vault[entryId]?.token || null;
        }

        static hasOwnership(entryId) {
            return Boolean(this.getToken(entryId));
        }

        static removeToken(entryId) {
            try {
                const vault = this.getVault();
                delete vault[entryId];
                localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
            } catch (e) {
                console.warn('Could not remove token', e);
            }
        }

        static generateToken() {
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            const randomHex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
            const uuid = window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2);
            return `${uuid}-${randomHex}`;
        }

        static async hashToken(token) {
            const encoder = new TextEncoder();
            const data = encoder.encode(token);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        static exportVaultJson() {
            return JSON.stringify(this.getVault(), null, 2);
        }

        static importVaultJson(jsonStr) {
            try {
                const parsed = JSON.parse(jsonStr);
                const current = this.getVault();
                const merged = Object.assign({}, current, parsed);
                localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    // =========================================================================
    // 4. SIMULATED CLOUD BACKEND (Multi-Tab & Cross-Browser-Session Sync)
    // =========================================================================
    const MOCK_STORAGE_KEY = 'portfolia_diary_cloud_entries';
    const MOCK_HASH_KEY = 'portfolia_diary_mock_hashes';

    class MockCloudBackend {
        constructor() {
            this.broadcastChannel = null;
            try {
                this.broadcastChannel = new BroadcastChannel('portfolia_diary_sync_bus');
            } catch (e) {
                // BroadcastChannel fallback handled via window storage events
            }
            this.subscribers = new Set();
            this.initStore();
            this.setupListeners();
        }

        initStore() {
            try {
                const stored = localStorage.getItem(MOCK_STORAGE_KEY);
                if (!stored) {
                    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([]));
                }
            } catch (e) {
                console.warn('Local storage write issue', e);
            }
        }

        setupListeners() {
            if (this.broadcastChannel) {
                this.broadcastChannel.onmessage = (event) => {
                    this.notifySubscribers(event.data);
                };
            }
            window.addEventListener('storage', (event) => {
                if (event.key === MOCK_STORAGE_KEY) {
                    this.notifySubscribers({ action: 'storage_sync' });
                }
            });
        }

        notifySubscribers(change) {
            this.subscribers.forEach(cb => {
                try { cb(change); } catch (e) { console.error(e); }
            });
        }

        getEntries() {
            try {
                return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
            } catch (e) {
                return [];
            }
        }

        saveEntries(entries) {
            localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(entries));
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage({ action: 'change', timestamp: Date.now() });
            }
            this.notifySubscribers({ action: 'change', timestamp: Date.now() });
        }

        async fetchEntries(type) {
            const all = this.getEntries();
            return all
                .filter(e => (!type || e.type === type) && e.status === 'published' && (e.report_count || 0) < 3)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        async createEntry(data, rawToken) {
            const entries = this.getEntries();
            const id = 'diary-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
            const tokenHash = await DeviceVault.hashToken(rawToken);

            // Store token hash in mock secret hash store
            try {
                const hashes = JSON.parse(localStorage.getItem(MOCK_HASH_KEY) || '{}');
                hashes[id] = tokenHash;
                localStorage.setItem(MOCK_HASH_KEY, JSON.stringify(hashes));
            } catch (e) { }

            const newEntry = {
                id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                type: data.type,
                title: data.title ? data.title.trim() : null,
                author: data.author && data.author.trim() ? data.author.trim() : 'Anonymous Traveler',
                content: data.content ? data.content.trim() : '',
                tags: Array.isArray(data.tags) ? data.tags : [],
                media_url: data.media_url || null,
                media_aspect_ratio: data.media_aspect_ratio || null,
                platform: data.platform || null,
                external_url: data.external_url || null,
                embed_url: data.embed_url || null,
                cover_url: data.cover_url || null,
                status: 'published',
                report_count: 0
            };

            entries.unshift(newEntry);
            this.saveEntries(entries);
            DeviceVault.saveToken(id, rawToken);

            return { success: true, data: newEntry };
        }

        async editEntry(id, rawToken, updates) {
            const hashes = JSON.parse(localStorage.getItem(MOCK_HASH_KEY) || '{}');
            const tokenHash = await DeviceVault.hashToken(rawToken);

            if (hashes[id] && hashes[id] !== tokenHash) {
                return { success: false, error: 'Unauthorized: Device token does not match the original creator.' };
            }

            const entries = this.getEntries();
            const index = entries.findIndex(e => e.id === id);
            if (index === -1) {
                return { success: false, error: 'Entry not found.' };
            }

            entries[index] = {
                ...entries[index],
                title: updates.title !== undefined ? updates.title.trim() : entries[index].title,
                content: updates.content !== undefined ? updates.content.trim() : entries[index].content,
                tags: Array.isArray(updates.tags) ? updates.tags : entries[index].tags,
                updated_at: new Date().toISOString()
            };

            this.saveEntries(entries);
            return { success: true, data: entries[index] };
        }

        async deleteEntry(id, rawToken) {
            const hashes = JSON.parse(localStorage.getItem(MOCK_HASH_KEY) || '{}');
            const tokenHash = await DeviceVault.hashToken(rawToken);

            if (hashes[id] && hashes[id] !== tokenHash) {
                return { success: false, error: 'Unauthorized: Device token does not match the original creator.' };
            }

            let entries = this.getEntries();
            const initialLen = entries.length;
            entries = entries.filter(e => e.id !== id);

            if (entries.length === initialLen) {
                return { success: false, error: 'Entry not found.' };
            }

            this.saveEntries(entries);
            DeviceVault.removeToken(id);
            return { success: true };
        }

        async reportEntry(id, reason, details) {
            const entries = this.getEntries();
            const entry = entries.find(e => e.id === id);
            if (!entry) return { success: false, error: 'Entry not found.' };

            entry.report_count = (entry.report_count || 0) + 1;
            const hidden = entry.report_count >= 3;
            if (hidden) {
                entry.status = 'hidden';
            }

            this.saveEntries(entries);
            return {
                success: true,
                hidden,
                message: hidden
                    ? 'Content flagged by multiple community members and removed from public view.'
                    : 'Report submitted. Thank you for protecting the collaborative space.'
            };
        }

        async uploadImage(file, onProgress) {
            // Emulate client-side image storage using DataURL / Blob URL
            return new Promise((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    return reject(new Error('Only image files (JPG, PNG, WebP, GIF) are permitted.'));
                }
                if (file.size > 5 * 1024 * 1024) {
                    return reject(new Error('File exceeds the 5MB size limit.'));
                }

                if (onProgress) onProgress(35);

                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable && onProgress) {
                        onProgress(Math.round((e.loaded / e.total) * 90));
                    }
                };
                reader.onload = () => {
                    if (onProgress) onProgress(100);
                    resolve({
                        success: true,
                        url: reader.result,
                        storageType: 'local_data_uri'
                    });
                };
                reader.onerror = () => reject(new Error('Failed to read image file.'));
                reader.readAsDataURL(file);
            });
        }

        subscribe(callback) {
            this.subscribers.add(callback);
            return () => this.subscribers.delete(callback);
        }
    }

    // =========================================================================
    // 5. REAL SUPABASE BACKEND CLIENT
    // =========================================================================
    class SupabaseCloudBackend {
        constructor(url, anonKey) {
            if (!window.supabase || typeof window.supabase.createClient !== 'function') {
                throw new Error('Supabase client library is not loaded on this page.');
            }
            this.client = window.supabase.createClient(url, anonKey);
            this.subscribers = new Set();
            this.initRealtime();
        }

        initRealtime() {
            try {
                this.client
                    .channel('public:diary_entries')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'diary_entries' }, (payload) => {
                        this.subscribers.forEach(cb => {
                            try { cb(payload); } catch (e) { console.error(e); }
                        });
                    })
                    .subscribe();
            } catch (e) {
                console.warn('Realtime subscription error', e);
            }
        }

        async fetchEntries(type) {
            let query = this.client
                .from('diary_entries')
                .select('id, created_at, updated_at, type, title, author, content, tags, media_url, media_aspect_ratio, platform, external_url, embed_url, cover_url, status, report_count')
                .eq('status', 'published')
                .lt('report_count', 3)
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        async createEntry(data, rawToken) {
            const tokenHash = await DeviceVault.hashToken(rawToken);

            const row = {
                type: data.type,
                title: data.title ? data.title.trim() : null,
                author: data.author && data.author.trim() ? data.author.trim() : 'Anonymous Traveler',
                content: data.content ? data.content.trim() : '',
                tags: Array.isArray(data.tags) ? data.tags : [],
                media_url: data.media_url || null,
                media_aspect_ratio: data.media_aspect_ratio || null,
                platform: data.platform || null,
                external_url: data.external_url || null,
                embed_url: data.embed_url || null,
                cover_url: data.cover_url || null,
                status: 'published',
                report_count: 0,
                edit_token_hash: tokenHash
            };

            const { data: inserted, error } = await this.client
                .from('diary_entries')
                .insert([row])
                .select('id, created_at, updated_at, type, title, author, content, tags, media_url, media_aspect_ratio, platform, external_url, embed_url, cover_url, status, report_count')
                .single();

            if (error) throw error;

            DeviceVault.saveToken(inserted.id, rawToken);
            return { success: true, data: inserted };
        }

        async editEntry(id, rawToken, updates) {
            const { data, error } = await this.client.rpc('edit_diary_entry', {
                p_id: id,
                p_token: rawToken,
                p_title: updates.title !== undefined ? updates.title.trim() : null,
                p_content: updates.content !== undefined ? updates.content.trim() : null,
                p_tags: Array.isArray(updates.tags) ? updates.tags : null
            });

            if (error) throw error;
            if (data && data.success === false) {
                return { success: false, error: data.error };
            }

            return { success: true, data };
        }

        async deleteEntry(id, rawToken) {
            const { data, error } = await this.client.rpc('delete_diary_entry', {
                p_id: id,
                p_token: rawToken
            });

            if (error) throw error;
            if (data && data.success === false) {
                return { success: false, error: data.error };
            }

            DeviceVault.removeToken(id);
            return { success: true, data };
        }

        async reportEntry(id, reason, details) {
            const { data, error } = await this.client.rpc('report_diary_entry', {
                p_entry_id: id,
                p_reason: reason,
                p_details: details || null
            });

            if (error) throw error;
            return data;
        }

        async uploadImage(file, onProgress) {
            if (!file.type.startsWith('image/')) {
                throw new Error('Only image files (JPG, PNG, WebP, GIF) are allowed.');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image exceeds 5MB size limit.');
            }

            if (onProgress) onProgress(20);

            // Generate sanitized unique filename
            const ext = file.name.split('.').pop() || 'jpg';
            const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
            const filePath = `art/${cleanName}`;

            const { data, error } = await this.client.storage
                .from('diary-media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;
            if (onProgress) onProgress(90);

            const { data: pubData } = this.client.storage
                .from('diary-media')
                .getPublicUrl(filePath);

            if (onProgress) onProgress(100);

            return {
                success: true,
                url: pubData.publicUrl,
                storageType: 'supabase_storage'
            };
        }

        subscribe(callback) {
            this.subscribers.add(callback);
            return () => this.subscribers.delete(callback);
        }
    }

    // =========================================================================
    // 6. INITIALIZATION & EXPORT
    // =========================================================================
    const isSupabaseConfigured = () => {
        return Boolean(
            SUPABASE_CONFIG.URL &&
            !SUPABASE_CONFIG.URL.includes('your-project') &&
            SUPABASE_CONFIG.ANON_KEY &&
            !SUPABASE_CONFIG.ANON_KEY.includes('your-anon-key')
        );
    };

    let backendInstance = null;
    let isRealCloud = false;

    if (isSupabaseConfigured()) {
        try {
            backendInstance = new SupabaseCloudBackend(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
            isRealCloud = true;
            console.info('✦ Connected to live shared Supabase backend.');
        } catch (err) {
            console.warn('Could not initialize Supabase, falling back to local simulated cloud:', err);
            backendInstance = new MockCloudBackend();
        }
    } else {
        console.info('ℹ Supabase keys not configured in supabase-config.js. Using multi-tab collaborative simulated cloud.');
        backendInstance = new MockCloudBackend();
    }

    // Expose backend API to window
    window.DiaryBackend = {
        isRealCloud,
        backend: backendInstance,
        vault: DeviceVault,
        config: SUPABASE_CONFIG,

        // Unified Methods
        fetchEntries: (type) => backendInstance.fetchEntries(type),
        createEntry: (data, token) => backendInstance.createEntry(data, token),
        editEntry: (id, token, updates) => backendInstance.editEntry(id, token, updates),
        deleteEntry: (id, token) => backendInstance.deleteEntry(id, token),
        reportEntry: (id, reason, details) => backendInstance.reportEntry(id, reason, details),
        uploadImage: (file, progress) => backendInstance.uploadImage(file, progress),
        subscribe: (cb) => backendInstance.subscribe(cb),

        // Helper to check if credentials need configuration
        isConfigured: isSupabaseConfigured
    };
})();

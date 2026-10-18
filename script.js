document.addEventListener('DOMContentLoaded', () => {
    if (window._appInitDone || window._isInitRunning) return;
    window._isInitRunning = true;
    
    if (typeof CONFIG === 'undefined') {
        console.error('Config mati. Pastiin config.js ke-load sebelum script.js.');
        window._isInitRunning = false;
        return;
    }

    const el = id => document.getElementById(id);
    const els = sel => document.querySelectorAll(sel);

    const safeConfig = (path, fallback = '') => {
        const val = path.split('.').reduce((acc, part) => 
            (acc !== undefined && acc !== null) ? acc[part] : undefined, 
        CONFIG);
        return (val !== undefined && val !== null) ? val : fallback;
    };

    const setText = (id, text) => {
        const element = el(id);
        if (element && text !== undefined && text !== null) {
            element.textContent = String(text);
        }
    };

    const initTexts = () => {
        setText('page-title', safeConfig('page_title', 'Happy Birthday!'));
        setText('welcome-text', safeConfig('texts.welcome_text'));
        setText('welcome-name', safeConfig('recipient.name'));
        setText('btn-open', safeConfig('texts.welcome_prompt', 'OPEN'));
        setText('reveal-title', safeConfig('texts.reveal_title'));
        
        const ageEl = el('reveal-age');
        if (ageEl) {
            const tmpl = String(safeConfig('texts.reveal_age', ''));
            ageEl.textContent = tmpl.replace('{age}', String(safeConfig('recipient.age', '')));
        }
        
        setText('reveal-subtitle', safeConfig('texts.reveal_subtitle'));
        setText('main-media-caption', safeConfig('texts.main_media_caption'));
        setText('message-title', safeConfig('texts.message_title'));
        setText('memories-title', safeConfig('texts.memories_title'));
        setText('memory-1-caption', safeConfig('texts.memory_1_caption'));
        setText('memory-2-caption', safeConfig('texts.memory_2_caption'));
        setText('closing-text', safeConfig('texts.closing_text'));
        setText('sender-name', safeConfig('sender.name'));
        setText('btn-whatsapp', safeConfig('texts.whatsapp_button'));

        const nextTxt = safeConfig('texts.btn_next', 'NEXT');
        els('.btn-next').forEach(b => b.textContent = String(nextTxt));

        const prevTxt = safeConfig('texts.btn_prev', 'BACK');
        els('.btn-prev').forEach(b => b.textContent = String(prevTxt));

        setText('btn-start', safeConfig('texts.btn_start', 'BACK TO START'));

        const msgBody = el('message-body');
        const paragraphs = safeConfig('texts.message_body', []);
        if (msgBody && Array.isArray(paragraphs)) {
            msgBody.innerHTML = '';
            paragraphs.forEach(txt => {
                if (txt !== undefined && txt !== null) {
                    const p = document.createElement('p');
                    p.textContent = String(txt);
                    msgBody.appendChild(p);
                }
            });
        }
    };

    const initImages = () => {
        const setImg = (id, path) => {
            const img = el(id);
            const src = safeConfig(path, '');
            if (!img) return;

            if (src) {
                img.style.display = ''; 
                img.onerror = () => {
                    img.style.display = 'none';
                    console.warn(`Gambar pecah/hilang: ${src}`);
                };
                img.onload = () => { img.style.display = ''; };
                img.src = String(src);
            } else {
                img.style.display = 'none';
            }
        };

        setImg('main-photo', 'media.images.main_photo');
        setImg('memory-1-img', 'media.images.memory_1');
        setImg('memory-2-img', 'media.images.memory_2');
    };

    const initVideo = () => {
        const vid = el('background-video');
        if (!vid) return;

        const on = Boolean(safeConfig('media.video.enabled', false));
        const src = safeConfig('media.video.source', '');

        if (on && src) {
            vid.src = String(src);
            vid.classList.remove('hidden');
            
            const p = vid.play();
            if (p !== undefined) p.catch(e => console.warn('Autoplay video ditahan browser:', e.message));

            vid.onerror = () => {
                vid.classList.add('hidden');
                console.error('Video background gagal load.');
            };
        } else {
            vid.classList.add('hidden');
        }
    };

    const initMusic = () => {
        const aud = el('bg-music');
        const btn = el('music-toggle');
        const icn = el('music-icon');
        
        const on = Boolean(safeConfig('music.enabled', false));
        const src = safeConfig('music.source', '');

        if (!aud || !btn || !on || !src) {
            if (btn) btn.classList.add('hidden');
            return;
        }

        aud.src = String(src);
        
        const vol = safeConfig('music.volume');
        aud.volume = (typeof vol === 'number') ? Math.max(0, Math.min(1, vol)) : 0.5;
        aud.loop = Boolean(safeConfig('music.loop', true));
        
        btn.classList.remove('hidden');

        const syncIcon = () => {
            if (icn) icn.textContent = aud.paused ? '🔇' : '🎵';
            if (btn) btn.setAttribute('aria-pressed', aud.paused ? 'false' : 'true');
        };

        if (!aud.dataset.hasListener) {
            aud.addEventListener('play', syncIcon);
            aud.addEventListener('pause', syncIcon);
            aud.addEventListener('ended', syncIcon);
            aud.addEventListener('error', () => {
                console.warn('Audio gagal load.');
                syncIcon();
            });
            aud.dataset.hasListener = 'true';
        }

        if (!btn.dataset.hasListener) {
            btn.addEventListener('click', e => {
                e.preventDefault();
                if (aud.paused) {
                    const p = aud.play();
                    if (p !== undefined) p.catch(err => console.warn('Gagal play audio:', err.message));
                } else {
                    aud.pause();
                }
            });
            btn.dataset.hasListener = 'true';
        }

        if (safeConfig('music.autoplay_on_start', false) === true) {
            const p = aud.play();
            if (p !== undefined) p.catch(() => {
                console.warn('Autoplay diblok. Nunggu klik user.');
                syncIcon();
            });
        } else {
            syncIcon();
        }
    };

    const initWA = () => {
        const btn = el('btn-whatsapp');
        if (!btn) return;

        const num = String(safeConfig('whatsapp.number', '')).replace(/\D/g, ''); 
        if (num.length >= 8) { 
            const msg = String(safeConfig('whatsapp.message', ''));
            btn.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
            btn.removeAttribute('aria-disabled');
            btn.removeAttribute('tabindex');
            btn.style.pointerEvents = '';
            btn.style.opacity = '1';
        } else {
            btn.removeAttribute('href');
            btn.setAttribute('aria-disabled', 'true');
            btn.setAttribute('tabindex', '-1'); 
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        }
    };

    const initNav = () => {
        const scenes = Array.from(els('.scene'));
        if (!scenes.length) return;

        let curr = scenes.findIndex(s => s.classList.contains('active'));
        if (curr < 0) curr = 0;

        scenes.forEach((s, i) => {
            if (i === curr) {
                s.classList.add('active');
                s.classList.remove('hidden');
            } else {
                s.classList.remove('active');
                s.classList.add('hidden');
            }
        });

        let isNav = false;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const lockDur = reduced ? 450 : 850; 

        const goTo = (target) => {
            if (isNav || target < 0 || target >= scenes.length || target === curr) return;
            
            isNav = true;
            const oldS = scenes[curr];
            const newS = scenes[target];

            newS.classList.remove('hidden'); 
            oldS.classList.remove('active');
            newS.classList.add('active');
            curr = target;

            setTimeout(() => {
                oldS.classList.add('hidden');
                isNav = false;
            }, lockDur);
        };

        const openBtn = el('btn-open');
        if (openBtn && !openBtn.dataset.hasListener) {
            openBtn.addEventListener('click', e => {
                e.preventDefault();
                goTo(1);
                
                const aud = el('bg-music');
                if (aud && aud.paused && safeConfig('music.autoplay_on_start', false) === true) {
                    const p = aud.play();
                    if (p !== undefined) p.catch(() => {});
                }
            });
            openBtn.dataset.hasListener = 'true';
        }

        els('.btn-next').forEach(b => {
            if (b.dataset.hasListener) return;
            b.addEventListener('click', e => {
                e.preventDefault();
                goTo(curr + 1);
            });
            b.dataset.hasListener = 'true';
        });

        els('.btn-prev').forEach(b => {
            if (b.dataset.hasListener) return;
            b.addEventListener('click', e => {
                e.preventDefault();
                goTo(curr - 1);
            });
            b.dataset.hasListener = 'true';
        });

        const startBtn = el('btn-start');
        if (startBtn && !startBtn.dataset.hasListener) {
            startBtn.addEventListener('click', e => {
                e.preventDefault();
                goTo(0);
            });
            startBtn.dataset.hasListener = 'true';
        }
    };

    const initDeco = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; 
        if (window._decoIv) clearInterval(window._decoIv);

        const maxElems = 40; 
        const spawnInterval = 400; 

        window._decoIv = setInterval(() => {
            if (els('.falling-petal, .falling-leaf').length >= maxElems) return;

            const isPetal = Math.random() > 0.35;
            const d = document.createElement('div');
            d.className = isPetal ? 'falling-petal' : 'falling-leaf';

            const fall = 7 + Math.random() * 8; 
            d.style.setProperty('--start-x', Math.random() * 100 + '%');
            d.style.setProperty('--fall-dur', fall + 's');
            d.style.setProperty('--sway-dur', (2 + Math.random() * 3) + 's');
            d.style.setProperty('--sway-amt', (15 + Math.random() * 30) + 'px');
            d.style.setProperty('--sway-rot', ((20 + Math.random() * 50) * (Math.random() > 0.5 ? 1 : -1)) + 'deg');

            document.body.appendChild(d);

            let backupTimer;
            let removed = false;
            
            const wipe = () => {
                if (removed) return;
                removed = true;
                if (backupTimer) clearTimeout(backupTimer);
                if (d.parentNode) d.parentNode.removeChild(d);
            };

            d.addEventListener('animationend', e => {
                if (e.animationName === 'fall') wipe();
            });
            
            backupTimer = setTimeout(wipe, (fall + 2) * 1000);
        }, spawnInterval);
    };

    try {
        initTexts();
        initImages();
        initVideo();
        initMusic();
        initWA();
        initNav();
        initDeco();
        window._appInitDone = true; 
    } catch (err) {
        console.error('Fatal error pas inisialisasi:', err);
    } finally {
        window._isInitRunning = false;
    }
});
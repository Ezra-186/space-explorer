


function rand(min, max) { return Math.random() * (max - min) + min; }

// timings
const BURST_FOR = 3500;
const BURST_EVERY = 30000;
const RATE_MS = 140;

export function initStarfall() {
    // respect motion setting
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const saved = localStorage.getItem('anim:stars');
    const enabled = saved !== 'off';

    // layer + toggle
    const layer = document.createElement('div');
    layer.id = 'starfall';
    layer.hidden = !enabled;
    document.body.append(layer);

    const btn = document.createElement('button');
    btn.id = 'toggle-stars';
    btn.type = 'button';
    btn.title = 'Toggle stars';
    btn.setAttribute('aria-label', 'Toggle decorative falling stars');
    btn.textContent = '✦';
    document.body.append(btn);

    // star factory
    function makeStar() {
        const wrap = document.createElement('div');
        wrap.className = 'starwrap';
        wrap.style.setProperty('--x', `${rand(0, 100)}vw`);
        wrap.style.setProperty('--delay', `${rand(0, 0.6)}s`);
        wrap.style.setProperty('--sway-dur', `${rand(5, 9)}s`);
        wrap.style.setProperty('--amp', `${rand(-30, 30)}px`);

        const fall = document.createElement('div');
        fall.className = 'starfall';
        fall.style.setProperty('--dur', `${rand(10, 18)}s`);

        const star = document.createElement('span');
        star.className = 'star';
        star.style.setProperty('--size', `${rand(6, 12)}px`);
        star.style.setProperty('--spin', `${rand(4, 10)}s`);
        star.style.setProperty('--hue', `${rand(50, 65)}`);

        fall.append(star);
        wrap.append(fall);
        layer.append(wrap);

        fall.addEventListener('animationend', () => wrap.remove(), { once: true });
    }

    // burst engine
    let spawnTimer = null;
    let burstTimer = null; 

    function clearTimers() {
        if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
        if (burstTimer) { clearTimeout(burstTimer); burstTimer = null; }
    }

    function startBurst() {
        if (layer.hidden) return;
        const endAt = performance.now() + BURST_FOR;

        const tick = () => {
            if (layer.hidden) return;
            const count = Math.round(rand(1, 2));
            for (let i = 0; i < count; i++) makeStar();

            if (performance.now() < endAt) {
                spawnTimer = setTimeout(tick, RATE_MS);
            } else {
                scheduleNextBurst();
            }
        };
        for (let i = 0; i < 6; i++) makeStar();
        tick();
    }

    function scheduleNextBurst() {
        if (layer.hidden) return;
        burstTimer = setTimeout(startBurst, BURST_EVERY);
    }

    // toggle
    btn.addEventListener('click', () => {
        const on = layer.hidden;
        layer.hidden = !on;
        localStorage.setItem('anim:stars', on ? 'on' : 'off');
        clearTimers();
        if (on) startBurst();
    });

    // pause when tab hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearTimers();
        } else if (!layer.hidden) {
            scheduleNextBurst();
        }
    });

    // start
    if (enabled) startBurst();
}

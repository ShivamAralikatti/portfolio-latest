const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const body = document.body;
const modeButton = document.getElementById('mode-toggle');
const logo = document.getElementById('logo-img');
const loaderLogo = document.getElementById('loader-logo');

const logoSources = {
  dark: 'img/logo-dark.png',
  light: 'img/logo-light.png'
};

function readSavedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // The visible theme still works when storage is unavailable.
  }
}

function setTheme(light) {
  body.classList.toggle('light-mode', light);
  logo.src = light ? logoSources.light : logoSources.dark;
  if (loaderLogo) loaderLogo.src = light ? logoSources.light : logoSources.dark;
  modeButton.setAttribute('aria-pressed', String(light));
  modeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} mode`);
  modeButton.innerHTML = `<span class="iconify" data-icon="ph:${light ? 'moon' : 'sun'}" aria-hidden="true"></span>`;
  window.Iconify?.scan(modeButton);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { light } }));
}

setTheme(readSavedTheme() === 'light');

modeButton.addEventListener('click', () => {
  const light = !body.classList.contains('light-mode');
  setTheme(light);
  saveTheme(light ? 'light' : 'dark');
  if (!reducedMotion.matches) {
    modeButton.animate([
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(16deg) scale(0.86)', offset: 0.45 },
      { transform: 'rotate(0deg) scale(1)' }
    ], { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }
});

function pause(duration) {
  return new Promise(resolve => window.setTimeout(resolve, duration));
}

function animateLoaderProgress(start, end, duration, update) {
  return new Promise(resolve => {
    const startedAt = performance.now();

    function frame(now) {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      update(start + (end - start) * eased);
      if (elapsed < 1) requestAnimationFrame(frame);
      else resolve();
    }

    requestAnimationFrame(frame);
  });
}

async function setupLoader() {
  const loader = document.getElementById('site-loader');
  const progress = document.getElementById('loader-progress');
  const percent = document.getElementById('loader-percent');
  const stage = document.getElementById('loader-stage');
  if (!loader || !progress || !percent || !stage) return;
  if (reducedMotion.matches) {
    loader.remove();
    return;
  }

  const milestones = [
    { value: 35, duration: 550, hold: 300, stage: 'Structuring projects' },
    { value: 57, duration: 350, hold: 350, stage: 'Connecting research' },
    { value: 100, duration: 700, hold: 400, stage: 'Portfolio ready' }
  ];
  let current = 0;

  function update(value) {
    const rounded = Math.round(value);
    loader.style.setProperty('--loader-progress', String(value / 100));
    progress.setAttribute('aria-valuenow', String(rounded));
    percent.textContent = `${rounded}%`;
  }

  for (const milestone of milestones) {
    await animateLoaderProgress(current, milestone.value, milestone.duration, update);
    current = milestone.value;
    update(current);
    stage.textContent = milestone.stage;
    await pause(milestone.hold);
  }

  loader.classList.add('is-complete');
  await pause(300);
  loader.remove();
}

const loaderFinished = setupLoader();

function setupDisclosures() {
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    const bodyContent = details.querySelector(':scope > .disclosure-body');
    if (!summary || !bodyContent) return;

    summary.addEventListener('click', event => {
      if (reducedMotion.matches) return;
      if (details.dataset.animating === 'true') {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const opening = !details.open;
      if (opening) details.open = true;
      details.dataset.animating = 'true';

      const fullHeight = bodyContent.scrollHeight;
      const animation = bodyContent.animate([
        {
          height: `${opening ? 0 : fullHeight}px`,
          opacity: opening ? 0 : 1,
          filter: opening ? 'blur(5px)' : 'blur(0)'
        },
        {
          height: `${opening ? fullHeight : 0}px`,
          opacity: opening ? 1 : 0,
          filter: opening ? 'blur(0)' : 'blur(5px)'
        }
      ], {
        duration: 240,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });

      animation.addEventListener('finish', () => {
        if (!opening) details.open = false;
        delete details.dataset.animating;
      });
      animation.addEventListener('cancel', () => {
        delete details.dataset.animating;
      });
    });
  });
}

setupDisclosures();

function setupGreetings() {
  const container = document.querySelector('.greeting');
  if (!container || reducedMotion.matches) return;

  const greetings = ['Hi', 'Namaste', 'Ciao', 'Hola', 'Bonjour', 'Hallo', 'Konnichiwa'];
  greetings.slice(1).forEach(text => {
    const span = document.createElement('span');
    span.textContent = text;
    container.appendChild(span);
  });

  const spans = [...container.querySelectorAll('span')];
  let index = 0;
  let timer;

  function rotateGreeting() {
    const previous = index;
    index = (index + 1) % spans.length;
    spans[previous].classList.remove('active');
    spans[previous].classList.add('exit');
    spans[index].classList.add('active');
    window.setTimeout(() => spans[previous].classList.remove('exit'), 450);
  }

  function syncGreetingTimer() {
    window.clearInterval(timer);
    if (!document.hidden) timer = window.setInterval(rotateGreeting, 3200);
  }

  document.addEventListener('visibilitychange', syncGreetingTimer);
  syncGreetingTimer();
}

loaderFinished.finally(setupGreetings);

const NOISE_3D = `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0,1.0/3.0);
  const vec4 D = vec4(0.0,0.5,1.0,2.0);
  vec3 i = floor(v + dot(v,C.yyy));
  vec3 x0 = v - i + dot(i,C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0,i1.z,i2.z,1.0))
      + i.y + vec4(0.0,i1.y,i2.y,1.0))
    + i.x + vec4(0.0,i1.x,i2.x,1.0)
  );
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z), y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy, y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0, s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.x, a0.y, h.x);
  vec3 p1 = vec3(a0.z, a0.w, h.y);
  vec3 p2 = vec3(a1.x, a1.y, h.z);
  vec3 p3 = vec3(a1.z, a1.w, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m = m*m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

async function setupBackground() {
  const canvas = document.getElementById('bg');

  try {
    const THREE = await import('https://unpkg.com/three@0.152.2/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const darkColors = { first: [10, 15, 40], second: [240, 240, 255] };
    const lightColors = { first: [255, 0, 150], second: [100, 0, 255] };
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uPoint: { value: new THREE.Vector2(0.5, 0.5) },
      uRatio: { value: window.innerWidth / window.innerHeight },
      uInteraction: { value: reducedMotion.matches ? 0.55 : 0 },
      uColor1: { value: new THREE.Vector3(...darkColors.first) },
      uColor2: { value: new THREE.Vector3(...darkColors.second) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec2 uResolution, uPoint;
        uniform float uRatio, uTime, uInteraction;
        uniform vec3 uColor1, uColor2;
        ${NOISE_3D}
        float circle(vec2 distanceFromPoint, float radius){
          return smoothstep(0.0, radius, pow(dot(distanceFromPoint, distanceFromPoint), 0.6) * 0.1);
        }
        void main(){
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 uv = vUv * aspect;
          vec2 mouse = vUv - uPoint;
          mouse.y /= uRatio;
          float time = uTime * 0.3;
          float noise = (
            snoise(vec3(uv, time)) +
            snoise(vec3(uv + 0.1, time)) +
            snoise(vec3(uv - 0.1, time))
          ) / 3.0;
          float alpha = noise * circle(mouse, 0.015 * uInteraction);
          float blend = smoothstep(0.1, 1.0, 1.0 - noise);
          vec3 color = mix(uColor1 / 255.0, uColor2 / 255.0, blend);
          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    const clock = new THREE.Clock();

    function resize() {
      const width = document.documentElement.clientWidth;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, window.innerHeight);
      uniforms.uResolution.value.set(width, window.innerHeight);
      uniforms.uRatio.value = width / window.innerHeight;
    }

    function render() {
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    }

    function syncAnimation() {
      renderer.setAnimationLoop(!reducedMotion.matches && !document.hidden ? render : null);
      if (reducedMotion.matches || document.hidden) render();
    }

    function updateColors(light) {
      const colors = light ? lightColors : darkColors;
      uniforms.uColor1.value.set(...colors.first);
      uniforms.uColor2.value.set(...colors.second);
      render();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('themechange', event => updateColors(event.detail.light));
    document.addEventListener('visibilitychange', syncAnimation);
    reducedMotion.addEventListener('change', syncAnimation);

    if (!reducedMotion.matches) {
      window.addEventListener('pointermove', event => {
        uniforms.uPoint.value.set(
          event.clientX / document.documentElement.clientWidth,
          1 - event.clientY / window.innerHeight
        );
        uniforms.uInteraction.value = 1.5;
      }, { passive: true });
      window.addEventListener('pointerleave', () => {
        uniforms.uInteraction.value = 0;
      });
    }

    resize();
    updateColors(body.classList.contains('light-mode'));
    syncAnimation();
  } catch {
    canvas.hidden = true;
  }
}

setupBackground();

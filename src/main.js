const defaults = {
  theme: 'void',
  font: 'Space Grotesk',
  textLength: 'full',
  textBox: true,
  textBoxOpacity: 35,
  hd: false,
  dateMode: 'today',
  customDate: '',
  resolvedDate: null,
  weather: false,
  city: '',
  customAccent: '',
  blur: 14,
  clock: false,
  greeting: false,
  greetingName: '',
  engine: 'google',
  customEngines: []
};

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('obscure_settings')) };
  } catch {
    return { ...defaults };
  }
}

function saveSettings(s) {
  localStorage.setItem('obscure_settings', JSON.stringify(s));
}

let settings = loadSettings();
settings.customEngines = Array.isArray(settings.customEngines) ? [...settings.customEngines] : [];

function persist() {
  saveSettings(settings);
}

const form = document.getElementById('search-form');
const input = document.getElementById('query');
const enginePicker = document.getElementById('engine-picker');
const engineTrigger = document.getElementById('engine-trigger');
const engineMenu = document.getElementById('engine-menu');
const engineList = document.getElementById('engine-list');
const newEngineName = document.getElementById('new-engine-name');
const newEngineUrl = document.getElementById('new-engine-url');
const newEngineAdd = document.getElementById('new-engine-add');

const engines = {
  general: {
    label: 'general',
    items: {
      google: ['Google', 'https://www.google.com/search?q='],
      bing: ['Bing', 'https://www.bing.com/search?q='],
      ecosia: ['Ecosia', 'https://www.ecosia.org/search?q=']
    }
  },
  privacy: {
    label: 'privacy',
    items: {
      duckduckgo: ['DuckDuckGo', 'https://duckduckgo.com/?q='],
      brave: ['Brave', 'https://search.brave.com/search?q='],
      startpage: ['Startpage', 'https://www.startpage.com/sp/search?query='],
      mojeek: ['Mojeek', 'https://www.mojeek.com/search?q=']
    }
  },
  independent: {
    label: 'independent / obscure',
    items: {
      marginalia: ['Marginalia', 'https://search.marginalia.nu/search?query='],
      wiby: ['Wiby', 'https://wiby.me/?q='],
      vyntr: ['Vyntr', 'https://vyntr.com/search?q='],
      stract: ['Stract', 'https://stract.com/search?q=']
    }
  },
  reference: {
    label: 'reference',
    items: {
      wikipedia: ['Wikipedia', 'https://en.wikipedia.org/w/index.php?search='],
      wiktionary: ['Wiktionary', 'https://en.wiktionary.org/w/index.php?search=']
    }
  },
  dev: {
    label: 'dev',
    items: {
      mdn: ['MDN', 'https://developer.mozilla.org/en-US/search?q='],
      github: ['GitHub', 'https://github.com/search?q='],
      stackoverflow: ['Stack Overflow', 'https://stackoverflow.com/search?q=']
    }
  }
};

function slugify(name) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return base || 'engine';
}

function findEngine(key) {
  for (const group of Object.values(engines)) {
    if (group.items[key]) return { label: group.items[key][0], url: group.items[key][1] };
  }
  const custom = settings.customEngines.find((e) => e.key === key);
  if (custom) return { label: custom.label, url: custom.url };
  return null;
}

function urlFor(key) {
  const found = findEngine(key);
  return found ? found.url : engines.general.items.google[1];
}

function updateEngineTrigger() {
  const found = findEngine(settings.engine) || { label: 'Google' };
  engineTrigger.textContent = found.label;
}

function makeOption(key, name, removable) {
  const row = document.createElement('div');
  row.className = 'engine-option' + (key === settings.engine ? ' active' : '');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'engine-option-name';
  btn.textContent = name;
  btn.addEventListener('click', () => selectEngine(key));
  row.appendChild(btn);

  if (removable) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'engine-remove';
    remove.textContent = '×';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.customEngines = settings.customEngines.filter((e2) => e2.key !== key);
      if (settings.engine === key) settings.engine = 'google';
      persist();
      buildEngineList();
      updateEngineTrigger();
    });
    row.appendChild(remove);
  }

  return row;
}

function buildEngineList() {
  engineList.innerHTML = '';

  for (const group of Object.values(engines)) {
    const label = document.createElement('div');
    label.className = 'engine-group-label';
    label.textContent = group.label;
    engineList.appendChild(label);

    for (const [key, [name]] of Object.entries(group.items)) {
      engineList.appendChild(makeOption(key, name, false));
    }
  }

  if (settings.customEngines.length) {
    const label = document.createElement('div');
    label.className = 'engine-group-label';
    label.textContent = 'custom';
    engineList.appendChild(label);

    for (const ce of settings.customEngines) {
      engineList.appendChild(makeOption(ce.key, ce.label, true));
    }
  }
}

function selectEngine(key) {
  settings.engine = key;
  updateEngineTrigger();
  buildEngineList();
  persist();
  closeEngineMenu();
}

function openEngineMenu() {
  engineMenu.hidden = false;
  engineTrigger.setAttribute('aria-expanded', 'true');
}

function closeEngineMenu() {
  engineMenu.hidden = true;
  engineTrigger.setAttribute('aria-expanded', 'false');
}

engineTrigger.addEventListener('click', () => {
  if (engineMenu.hidden) openEngineMenu();
  else closeEngineMenu();
});

document.addEventListener('click', (e) => {
  if (!enginePicker.contains(e.target)) closeEngineMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEngineMenu();
});

newEngineAdd.addEventListener('click', () => {
  const name = newEngineName.value.trim();
  const url = newEngineUrl.value.trim();
  if (!name || !url) return;

  let key = slugify(name);
  const taken = new Set([
    ...Object.values(engines).flatMap((g) => Object.keys(g.items)),
    ...settings.customEngines.map((e) => e.key)
  ]);
  if (taken.has(key)) {
    let i = 2;
    while (taken.has(`${key}-${i}`)) i++;
    key = `${key}-${i}`;
  }

  settings.customEngines.push({ key, label: name, url });
  settings.engine = key;
  persist();
  buildEngineList();
  updateEngineTrigger();
  newEngineName.value = '';
  newEngineUrl.value = '';
  closeEngineMenu();
});

buildEngineList();
updateEngineTrigger();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value !== '') {
    window.location.href = urlFor(settings.engine) + encodeURIComponent(input.value);
  }
});

function createDropdown(prefix, options, get, set, onChange) {
  const root = document.getElementById(`${prefix}-dropdown`);
  const trigger = document.getElementById(`${prefix}-trigger`);
  const menu = document.getElementById(`${prefix}-menu`);
  const list = document.getElementById(`${prefix}-list`);

  function render() {
    list.innerHTML = '';
    for (const opt of options) {
      const row = document.createElement('div');
      row.className = 'dropdown-option' + (opt.value === get() ? ' active' : '');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dropdown-option-name';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        set(opt.value);
        onChange();
        updateTrigger();
        render();
        close();
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
  }

  function updateTrigger() {
    const found = options.find((o) => o.value === get());
    trigger.textContent = found ? found.label : '';
  }

  function open() {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.hidden) open(); else close();
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  render();
  updateTrigger();

  return { render, updateTrigger };
}

const fontDropdown = createDropdown(
  'font',
  [
    { value: 'Space Grotesk', label: 'Space Grotesk' },
    { value: 'Inter', label: 'Inter' },
    { value: 'IBM Plex Sans', label: 'IBM Plex Sans' },
    { value: 'Work Sans', label: 'Work Sans' },
    { value: 'Fraunces', label: 'Fraunces' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono' }
  ],
  () => settings.font,
  (v) => { settings.font = v; },
  () => { applySettings(); persist(); }
);

const dateModeDropdown = createDropdown(
  'date-mode',
  [
    { value: 'today', label: 'today' },
    { value: 'random', label: 'random past date' },
    { value: 'custom', label: 'custom date' }
  ],
  () => settings.dateMode,
  (v) => { settings.dateMode = v; },
  () => {
    if (settings.dateMode === 'random') settings.resolvedDate = randomPastDate();
    applySettings();
    persist();
    loadApod();
  }
);

const textLengthDropdown = createDropdown(
  'text-length',
  [
    { value: 'full', label: 'full' },
    { value: 'short', label: 'short' },
    { value: 'off', label: 'hidden' }
  ],
  () => settings.textLength,
  (v) => { settings.textLength = v; },
  () => { renderApod(); persist(); }
);

const themes = ['void', 'paper', 'dusk', 'pine', 'slate', 'mist', 'ember'];
const themeAccents = {
  void: '#5eead4',
  paper: '#3a6b64',
  dusk: '#d46ebd',
  pine: '#c9a24b',
  slate: '#5aa9e6',
  mist: '#d97757',
  ember: '#ff6b4a'
};

const els = {
  toggle: document.getElementById('settings-toggle'),
  panel: document.getElementById('settings-panel'),
  close: document.getElementById('settings-close'),
  swatches: document.getElementById('theme-swatches'),
  textBox: document.getElementById('toggle-textbox'),
  textBoxOpacity: document.getElementById('textbox-opacity'),
  hd: document.getElementById('toggle-hd'),
  customDate: document.getElementById('date-custom'),
  weather: document.getElementById('toggle-weather'),
  city: document.getElementById('weather-city-input'),
  reset: document.getElementById('settings-reset'),
  accentCustom: document.getElementById('accent-custom'),
  blurRange: document.getElementById('blur-range'),
  clock: document.getElementById('toggle-clock'),
  greeting: document.getElementById('toggle-greeting'),
  greetingName: document.getElementById('greeting-name'),
  clockDisplay: document.getElementById('clock'),
  greetingDisplay: document.getElementById('greeting')
};

function buildSwatches() {
  els.swatches.innerHTML = '';
  for (const t of themes) {
    const s = document.createElement('button');
    s.className = 'swatch' + (t === settings.theme ? ' active' : '');
    s.style.background = themeAccents[t];
    s.title = t;
    s.addEventListener('click', () => {
      settings.theme = t;
      settings.customAccent = '';
      applySettings();
      persist();
    });
    els.swatches.appendChild(s);
  }
}

function loadGoogleFont(family) {
  const id = 'google-font-link';
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  document.documentElement.style.setProperty('--font-body', `'${family}', sans-serif`);
}

function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function applyTextBox() {
  const box = document.getElementById('nasa-box');
  if (!settings.textBox) {
    box.classList.remove('boxed');
    box.style.background = 'none';
    return;
  }
  box.classList.add('boxed');
  const bgVar = getComputedStyle(document.body).getPropertyValue('--bg').trim();
  const [r, g, b] = hexToRgb(bgVar);
  box.style.background = `rgba(${r}, ${g}, ${b}, ${settings.textBoxOpacity / 100})`;
}

function updateFavicon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="35" stroke="${color}" stroke-width="20" fill="none" />
  </svg>`;
  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = dataUrl;
}

function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
  loadGoogleFont(settings.font);

  document.getElementById('weather-box').hidden = !settings.weather;

  fontDropdown.updateTrigger();
  fontDropdown.render();
  textLengthDropdown.updateTrigger();
  textLengthDropdown.render();
  els.textBox.checked = settings.textBox;
  els.textBoxOpacity.hidden = !settings.textBox;
  els.textBoxOpacity.value = settings.textBoxOpacity;
  els.hd.checked = settings.hd;
  dateModeDropdown.updateTrigger();
  dateModeDropdown.render();
  els.customDate.hidden = settings.dateMode !== 'custom';
  els.customDate.value = settings.customDate;
  els.weather.checked = settings.weather;
  els.city.hidden = !settings.weather;
  els.city.value = settings.city;

  if (settings.customAccent) {
    document.body.style.setProperty('--accent', settings.customAccent);
  } else {
    document.body.style.removeProperty('--accent');
  }
  els.accentCustom.value = settings.customAccent || themeAccents[settings.theme] || '#5eead4';

  const currentAccent = settings.customAccent || themeAccents[settings.theme] || '#5eead4';
  updateFavicon(currentAccent);

  document.documentElement.style.setProperty('--panel-blur', `${settings.blur}px`);
  els.blurRange.value = settings.blur;

  els.clock.checked = settings.clock;
  els.clockDisplay.hidden = !settings.clock;
  startClock();

  els.greeting.checked = settings.greeting;
  els.greetingName.hidden = !settings.greeting;
  els.greetingName.value = settings.greetingName;
  els.greetingDisplay.hidden = !settings.greeting;
  updateGreeting();

  applyTextBox();
  renderApod();
  buildSwatches();
}

let clockInterval = null;

function updateClock() {
  els.clockDisplay.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function startClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  if (settings.clock) {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }
}

function updateGreeting() {
  if (!settings.greeting) return;
  const hour = new Date().getHours();
  let base = 'good evening';
  if (hour < 12) base = 'good morning';
  else if (hour < 18) base = 'good afternoon';
  const name = settings.greetingName.trim();
  els.greetingDisplay.textContent = name ? `${base}, ${name}` : base;
}

els.toggle.addEventListener('click', () => {
  const open = els.panel.classList.toggle('open');
  els.toggle.setAttribute('aria-expanded', String(open));
  els.panel.setAttribute('aria-hidden', String(!open));
});

els.close.addEventListener('click', () => {
  els.panel.classList.remove('open');
  els.toggle.setAttribute('aria-expanded', 'false');
  els.panel.setAttribute('aria-hidden', 'true');
});

els.textBox.addEventListener('change', () => {
  settings.textBox = els.textBox.checked;
  els.textBoxOpacity.hidden = !settings.textBox;
  applyTextBox();
  persist();
});

els.textBoxOpacity.addEventListener('input', () => {
  settings.textBoxOpacity = Number(els.textBoxOpacity.value);
  applyTextBox();
  persist();
});

els.hd.addEventListener('change', () => {
  settings.hd = els.hd.checked;
  persist();
  loadApod();
});

els.customDate.addEventListener('change', () => {
  settings.customDate = els.customDate.value;
  persist();
  loadApod();
});

els.weather.addEventListener('change', () => {
  settings.weather = els.weather.checked;
  applySettings();
  persist();
  if (settings.weather) loadWeather();
});

els.city.addEventListener('change', () => {
  settings.city = els.city.value;
  persist();
  loadWeather();
});

els.accentCustom.addEventListener('input', () => {
  settings.customAccent = els.accentCustom.value;
  document.body.style.setProperty('--accent', settings.customAccent);
  persist();
});

els.blurRange.addEventListener('input', () => {
  settings.blur = Number(els.blurRange.value);
  document.documentElement.style.setProperty('--panel-blur', `${settings.blur}px`);
  persist();
});

els.clock.addEventListener('change', () => {
  settings.clock = els.clock.checked;
  els.clockDisplay.hidden = !settings.clock;
  startClock();
  persist();
});

els.greeting.addEventListener('change', () => {
  settings.greeting = els.greeting.checked;
  els.greetingName.hidden = !settings.greeting;
  els.greetingDisplay.hidden = !settings.greeting;
  updateGreeting();
  persist();
});

els.greetingName.addEventListener('change', () => {
  settings.greetingName = els.greetingName.value;
  updateGreeting();
  persist();
});

els.reset.addEventListener('click', () => {
  settings = { ...defaults, customEngines: [] };
  applySettings();
  buildEngineList();
  updateEngineTrigger();
  persist();
  loadApod();
  if (settings.weather) loadWeather();
});

applySettings();

let lastApod = null;

function randomPastDate() {
  const start = new Date(1995, 5, 16);
  const end = new Date();
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
}

function apodDateParam() {
  if (settings.dateMode === 'custom' && settings.customDate) return settings.customDate;
  if (settings.dateMode === 'random') {
    if (!settings.resolvedDate) {
      settings.resolvedDate = randomPastDate();
      persist();
    }
    return settings.resolvedDate;
  }
  return null;
}

function formatDesc(text) {
  if (!text) return '';
  if (settings.textLength !== 'short') return text;
  if (text.length <= 160) return text;
  return text.slice(0, 160).replace(/\s+\S*$/, '') + '…';
}

function renderApod() {
  const box = document.getElementById('nasa-box');
  if (!lastApod) return;

  if (settings.textLength === 'off') {
    box.style.display = 'none';
    return;
  }

  box.style.display = '';
  document.getElementById('title').textContent = lastApod.title;
  document.getElementById('desc').textContent = formatDesc(lastApod.explanation);
}

function apodCacheKey() {
  const date = apodDateParam();
  return date || new Date().toISOString().slice(0, 10);
}

function readApodCache() {
  try {
    return JSON.parse(localStorage.getItem('obscure_apod_cache'));
  } catch {
    return null;
  }
}

function writeApodCache(key, data) {
  try {
    localStorage.setItem('obscure_apod_cache', JSON.stringify({ key, data }));
  } catch {
    console.log('Could not cache apod response');
  }
}

function applyApodBackground(data) {
  if (data.media_type === 'image') {
    const imgUrl = settings.hd && data.hdurl ? data.hdurl : data.url;
    document.body.style.backgroundImage = `url('${imgUrl}')`;
  } else if (data.media_type === 'video' && data.thumbnail_url) {
    document.body.style.backgroundImage = `url('${data.thumbnail_url}')`;
  } else {
    document.body.style.backgroundImage = '';
  }
}

function loadApod() {
  const key = apodCacheKey();
  const cached = readApodCache();

  if (cached && cached.key === key && cached.data) {
    lastApod = cached.data;
    renderApod();
    applyApodBackground(cached.data);
    return;
  }

  const apiKey = import.meta.env.VITE_NASA_API_KEY;
  const date = apodDateParam();
  let url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
  if (date) url += `&date=${date}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      lastApod = data;
      renderApod();
      applyApodBackground(data);
      writeApodCache(key, data);
    })
    .catch((err) => {
      console.log('Fetch failed:', err);
      lastApod = { title: "couldn't load image today.", explanation: '' };
      renderApod();
    });
}

loadApod();

function renderWeather(data) {
  document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('weather-desc').textContent = data.weather[0].description;
  document.getElementById('weather-city').textContent = data.name;
}

function fetchWeatherByCity(city) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
  fetch(url).then((res) => res.json()).then((data) => {
    if (data.cod === 200) renderWeather(data);
  }).catch((err) => console.log('Weather fetch failed:', err));
}

function fetchWeatherByCoords(lat, lon) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  fetch(url).then((res) => res.json()).then((data) => {
    if (data.cod === 200) renderWeather(data);
  }).catch((err) => console.log('Weather fetch failed:', err));
}

function loadWeather() {
  if (!settings.weather) return;
  if (settings.city) {
    fetchWeatherByCity(settings.city);
    return;
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeatherByCity('London')
    );
  }
}

if (settings.weather) loadWeather();

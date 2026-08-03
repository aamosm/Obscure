const form = document.getElementById('search-form');
const input = document.getElementById('query');
const engineSelect = document.getElementById('engine');

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

function buildEngineSelect() {
  for (const group of Object.values(engines)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    for (const [value, [name]] of Object.entries(group.items)) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = name;
      optgroup.appendChild(opt);
    }
    engineSelect.appendChild(optgroup);
  }
}

function urlFor(engineKey) {
  for (const group of Object.values(engines)) {
    if (group.items[engineKey]) return group.items[engineKey][1];
  }
  return engines.general.items.google[1];
}

buildEngineSelect();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value !== '') {
    window.location.href = urlFor(engineSelect.value) + encodeURIComponent(input.value);
  }
});

// settings

const defaults = {
  theme: 'void',
  font: 'Space Grotesk',
  showText: true,
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
  greetingName: ''
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
  font: document.getElementById('font-select'),
  showText: document.getElementById('toggle-text'),
  hd: document.getElementById('toggle-hd'),
  dateMode: document.getElementById('date-mode'),
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

function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
  loadGoogleFont(settings.font);

  document.getElementById('nasa-box').style.display = settings.showText ? '' : 'none';
  document.getElementById('weather-box').hidden = !settings.weather;

  els.font.value = settings.font;
  els.showText.checked = settings.showText;
  els.hd.checked = settings.hd;
  els.dateMode.value = settings.dateMode;
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

  // panel blur
  document.documentElement.style.setProperty('--panel-blur', `${settings.blur}px`);
  els.blurRange.value = settings.blur;

  // clock
  els.clock.checked = settings.clock;
  els.clockDisplay.hidden = !settings.clock;
  startClock();

  // greeting
  els.greeting.checked = settings.greeting;
  els.greetingName.hidden = !settings.greeting;
  els.greetingName.value = settings.greetingName;
  els.greetingDisplay.hidden = !settings.greeting;
  updateGreeting();

  buildSwatches();
}

function persist() {
  saveSettings(settings);
}

// clock

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

// greeting

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

els.font.addEventListener('change', () => {
  settings.font = els.font.value;
  applySettings();
  persist();
});

els.showText.addEventListener('change', () => {
  settings.showText = els.showText.checked;
  applySettings();
  persist();
});

els.hd.addEventListener('change', () => {
  settings.hd = els.hd.checked;
  persist();
  loadApod();
});

els.dateMode.addEventListener('change', () => {
  settings.dateMode = els.dateMode.value;
  if (settings.dateMode === 'random') {
    settings.resolvedDate = randomPastDate();
  }
  applySettings();
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
  settings = { ...defaults };
  applySettings();
  persist();
  loadApod();
  if (settings.weather) loadWeather();
});

applySettings();

// NASA APOD

function randomPastDate() {
  const start = new Date(1995, 5, 16); // Damn this is old
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
  return null; // today
}

function loadApod() {
  const apiKey = import.meta.env.VITE_NASA_API_KEY;
  const date = apodDateParam();
  let url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
  if (date) url += `&date=${date}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('title').textContent = data.title;
      document.getElementById('desc').textContent = data.explanation;

      if (data.media_type === 'image') {
        const imgUrl = settings.hd && data.hdurl ? data.hdurl : data.url;
        document.body.style.backgroundImage = `url('${imgUrl}')`;
      } else if (data.media_type === 'video' && data.thumbnail_url) {
        document.body.style.backgroundImage = `url('${data.thumbnail_url}')`;
      } else {
        document.body.style.backgroundImage = '';
      }
    })
    .catch((err) => {
      console.log('Fetch failed:', err);
      document.getElementById('title').textContent = "couldn't load image today.";
      document.getElementById('desc').textContent = '';
    });
}

loadApod();

//weather (OpenWeatherMap)

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
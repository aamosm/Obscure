const form = document.getElementById('search-form');
const input = document.getElementById('query');
const engine = document.getElementById('engine');

// search engines
const engines = {
  google: 'https://www.google.com/search?q=',
  vyntr: 'https://vyntr.com/search?q=',
  marginalia: 'https://search.marginalia.nu/search?query=',
  wiby: 'https://wiby.me/?q='
};

// Search routing
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (input.value !== '') {
    const targetUrl = engines[engine.value] + encodeURIComponent(input.value);
    window.location.href = targetUrl;
  }
});


const apiKey = import.meta.env.VITE_NASA_API_KEY;

fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById('title').textContent = data.title;
    document.getElementById('desc').textContent = data.explanation;
    
    // Only set background if it's an image
    if (data.media_type === 'image') {
      document.body.style.backgroundImage = `url('${data.url}')`;
    }
  })
  .catch(err => {
    console.log("Fetch failed:", err);
    document.getElementById('title').textContent = "Couldn't load image today.";
  });
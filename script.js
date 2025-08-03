const apiKey = '3d813c826b5d0a4d7260afd14e7e7462';
const baseURL = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p/w500';
let currentResults = [];
let trailerAudio = null;

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  if (document.getElementById('trending')) fetchTrending();
  if (document.getElementById('genreDropdown')) fetchGenres();
  if (document.getElementById('favoritesContainer')) loadFavorites();
  if (document.getElementById('watchlistContainer')) loadWatchlist();
});

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function fetchTrending() {
  fetch(`${baseURL}/trending/movie/day?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      currentResults = data.results;
      displayMovies(data.results, 'trending');
    });
}

function fetchGenres() {
  fetch(`${baseURL}/genre/movie/list?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById('genreDropdown');
      dropdown.innerHTML = '<option value="">All Genres</option>';
      data.genres.forEach(g => {
        dropdown.innerHTML += `<option value="${g.id}">${g.name}</option>`;
      });
    });
}

function searchMovies() {
  const query = document.getElementById('search').value.trim();
  if (!query) return;
  document.getElementById('trending').innerHTML = '';
  fetch(`${baseURL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      currentResults = data.results;
      displayMovies(data.results, 'results');
    });
}

function filterByGenre() {
  const genre = document.getElementById('genreDropdown').value;
  const filtered = genre ? currentResults.filter(m => m.genre_ids.includes(parseInt(genre))) : currentResults;
  displayMovies(filtered, 'results');
}

function sortResults() {
  const sort = document.getElementById('sortDropdown').value;
  const [key, order] = sort.split('.');
  
  currentResults.sort((a, b) => {
    // Handle date sorting properly
    if (key === 'release_date') {
      let dateA = new Date(a.release_date);
      let dateB = new Date(b.release_date);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      // Numeric sort (popularity, vote_average, etc.)
      return order === 'desc' ? b[key] - a[key] : a[key] - b[key];
    }
  });
  
  displayMovies(currentResults, 'results');
}

function displayMovies(movies, sectionId) {
  const container = document.getElementById(sectionId);
  container.innerHTML = '';
  if (!movies || movies.length === 0) {
    container.innerHTML = '<p>No movies found.</p>';
    return;
  }
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'card';
    card.tabIndex = 0; // Make keyboard-focusable
    card.innerHTML = `
      <img src="${movie.poster_path ? imageBase + movie.poster_path : 'placeholder.png'}" alt="${movie.title}" onclick="showDetails(${movie.id})" />
      <h3>${movie.title}</h3>
      <p>⭐ ${movie.vote_average.toFixed(1)}</p>
      <button onclick="event.stopPropagation(); addToFavorites(${movie.id})" aria-label="Add to favorites">💖</button>
      <button onclick="event.stopPropagation(); addToWatchlist(${movie.id})" aria-label="Add to watchlist">📺</button>
      <button onclick="event.stopPropagation(); viewTrailer(${movie.id})" aria-label="View trailer">🎬</button>
    `;
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter') showDetails(movie.id);
    });
    container.appendChild(card);
  });
}

function addToFavorites(id) {
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favs.includes(id)) {
    favs.push(id);
    localStorage.setItem('favorites', JSON.stringify(favs));
    showToast('✅ Added to favorites!');
  } else {
    showToast('❗ Already in favorites');
  }
}

function addToWatchlist(id) {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem('watchlist', JSON.stringify(list));
    showToast('🎉 Added to watchlist!');
  } else {
    showToast('⚠️ Already in watchlist');
  }
}

function loadFavorites() {
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  const container = document.getElementById('favoritesContainer');
  container.innerHTML = '';
  if (favs.length === 0) {
    container.innerHTML = '<p>No favorites added yet.</p>';
    return;
  }
  favs.forEach(id =>
    fetch(`${baseURL}/movie/${id}?api_key=${apiKey}`)
      .then(res => res.json())
      .then(movie => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <img src="${movie.poster_path ? imageBase + movie.poster_path : 'placeholder.png'}" alt="${movie.title}" onclick="showDetails(${movie.id})"/>
          <h3>${movie.title}</h3>
          <p>⭐ ${movie.vote_average.toFixed(1)}</p>
          <button onclick="event.stopPropagation(); removeFavorite(${movie.id})">❌ Remove</button>
          <button onclick="event.stopPropagation(); viewTrailer(${movie.id})">🎬 Trailer</button>
        `;
        container.appendChild(div);
      })
  );
}

function loadWatchlist() {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const container = document.getElementById('watchlistContainer');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p>No movies in watchlist yet.</p>';
    return;
  }
  list.forEach(id =>
    fetch(`${baseURL}/movie/${id}?api_key=${apiKey}`)
      .then(res => res.json())
      .then(movie => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <img src="${movie.poster_path ? imageBase + movie.poster_path : 'placeholder.png'}" alt="${movie.title}" onclick="showDetails(${movie.id})"/>
          <h3>${movie.title}</h3>
          <p>⭐ ${movie.vote_average.toFixed(1)}</p>
          <button onclick="event.stopPropagation(); removeWatchlist(${movie.id})">❌ Remove</button>
          <button onclick="event.stopPropagation(); viewTrailer(${movie.id})">🎬 Trailer</button>
        `;
        container.appendChild(div);
      })
  );
}

function removeFavorite(id) {
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  favs = favs.filter(f => f !== id);
  localStorage.setItem('favorites', JSON.stringify(favs));
  showToast('❌ Removed from favorites');
  location.reload();
}

function removeWatchlist(id) {
  let list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  list = list.filter(f => f !== id);
  localStorage.setItem('watchlist', JSON.stringify(list));
  showToast('❌ Removed from watchlist');
  location.reload();
}

function viewTrailer(id) {
  fetch(`${baseURL}/movie/${id}/videos?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        window.open(`https://youtube.com/watch?v=${trailer.key}`, '_blank');
      } else {
        showToast('🚫 Trailer not available');
      }
    });
}

function showDetails(id) {
  fetch(`${baseURL}/movie/${id}?api_key=${apiKey}&append_to_response=credits`)
    .then(res => res.json())
    .then(movie => {
      const modal = document.createElement('div');
      modal.className = 'modal';

      const overview = movie.overview || "No overview available.";
      const castList = movie.credits?.cast?.length
        ? movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ')
        : "Cast info not available.";

      modal.innerHTML = `
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <button class="close-modal" aria-label="Close modal" onclick="closeModal()">✖</button>
          <h2 id="modalTitle">${movie.title}</h2>
          <p><strong>Overview:</strong> ${overview}</p>
          <p><strong>Cast:</strong> ${castList}</p>
        </div>
      `;
      const container = document.getElementById('modalContainer');
      container.innerHTML = '';
      container.appendChild(modal);
    });
}

function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
  if (trailerAudio) {
    trailerAudio.pause();
    trailerAudio = null;
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


import axios from 'axios';

const API_URL = 'http://localhost:5000/routes';

export const register = (email, password) => {
  return axios.post(`${API_URL}/auth/register`, { email, password });
};

export const login = (email, password) => {
  return axios.post(`${API_URL}/auth/login`, { email, password });
};

export const searchMovies = (query) => {
  return axios.get(`${API_URL}/movies/search?query=${query}`);
};

export const getFavorites = (token) => {
  return axios.get(`${API_URL}/favourite`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const addFavorite = (movie, token) => {
    return axios.post(`${API_URL}/favourite`, {
      tmdb_id: movie.id,
      title: movie.title,
      release_date: movie.release_date,
      poster_path: movie.poster_path
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };
  
  export const removeFavorite = (tmdb_id, token) => {
    return axios.delete(`${API_URL}/favourite/${tmdb_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };
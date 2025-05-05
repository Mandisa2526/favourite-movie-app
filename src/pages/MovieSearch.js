import { useState, useContext } from 'react';
import { searchMovies, addFavorite } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const MovieSearch = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await searchMovies(query);
      setMovies(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (movie) => {
    try {
      await addFavorite({
        tmdb_id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        poster_path: movie.poster_path
      }, token);
      alert('Added to favorites!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="movie-search">
      <h1>Movie Search</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="movie-results">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card">
            {movie.poster_path && (
              <img 
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                alt={movie.title}
              />
            )}
            <h3>{movie.title}</h3>
            <p>{movie.release_date}</p>
            <button onClick={() => handleAddFavorite(movie)}>
              Add to Favorites
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieSearch;
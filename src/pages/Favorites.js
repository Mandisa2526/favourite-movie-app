import { useState, useEffect, useContext } from 'react';
import { getFavorites, removeFavorite } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await getFavorites(token);
        setFavorites(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  const handleRemoveFavorite = async (tmdbId) => {
    try {
      await removeFavorite(tmdbId, token);
      setFavorites(favorites.filter(fav => fav.tmdb_id !== tmdbId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading favorites...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="favorites-page">
      <h1>Your Favorite Movies</h1>
      
      {favorites.length === 0 ? (
        <p>You haven't added any favorites yet.</p>
      ) : (
        <div className="favorites-list">
          {favorites.map(movie => (
            <div key={movie.tmdb_id} className="favorite-item">
              {movie.poster_path && (
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                  alt={movie.title}
                />
              )}
              <h3>{movie.title}</h3>
              <p>Released: {movie.release_date}</p>
              <button onClick={() => handleRemoveFavorite(movie.tmdb_id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
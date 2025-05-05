require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/routes/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { rows } = await pool.query(
        'INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, hashedPassword]
      );
      
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/routes/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
      
      if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
      
      const validPassword = await bcrypt.compare(password, rows[0].password_hash);
      if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
      
      const token = jwt.sign({ id: rows[0].id }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

app.get('/routes/movies/search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${query}`
    );
    res.json(response.data.results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to favorites
app.post('/routes/favourite', authenticateToken, async (req, res) => {
    try {
      const { tmdb_id, title, release_date, poster_path } = req.body;
      
      // First find or create the movie
      const movieRes = await pool.query(
        `INSERT INTO Movies (tmdb_id, title, release_date, poster_path)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tmdb_id) DO UPDATE SET title = EXCLUDED.title
         RETURNING id`,
        [tmdb_id, title, release_date, poster_path]
      );
      
      // Then create the favorite relationship
      const favoriteRes = await pool.query(
        `INSERT INTO Favorites (user_id, movie_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING
         RETURNING *`,
        [req.user.id, movieRes.rows[0].id]
      );
      
      res.status(201).json(favoriteRes.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Get favorites
app.get('/routes/favourite', authenticateToken, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT m.* FROM Favorites f
         JOIN Movies m ON f.movie_id = m.id
         WHERE f.user_id = $1`,
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// Remove favorite
app.delete('/routes/favourite/:tmdb_id', authenticateToken, async (req, res) => {
    try {
      const { tmdb_id } = req.params;
      
      await pool.query(
        `DELETE FROM Favorites f
         USING Movies m
         WHERE f.movie_id = m.id
         AND f.user_id = $1
         AND m.tmdb_id = $2`,
        [req.user.id, tmdb_id]
      );
      
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// CORS configuration (Frontend URL from env)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,   // Railway gives a port (important!)
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        return;
    }
    console.log("✅ Connected to MySQL Database");
});

// -------------------------------
//        ROUTES
// -------------------------------

// Get all posts
app.get('/api/posts', (req, res) => {
    db.query('SELECT * FROM posts', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Create post
app.post('/api/posts', (req, res) => {
    const { title, body } = req.body;

    db.query(
        'INSERT INTO posts (title, body) VALUES (?, ?)',
        [title, body],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                id: results.insertId,
                title,
                body
            });
        }
    );
});

// Get a single post
app.get('/api/posts/:id', (req, res) => {
    db.query(
        'SELECT * FROM posts WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0]);
        }
    );
});

// Update post
app.put('/api/posts/:id', (req, res) => {
    const { title, body } = req.body;

    db.query(
        'UPDATE posts SET title=?, body=? WHERE id=?',
        [title, body, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                id: req.params.id,
                title,
                body
            });
        }
    );
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
    db.query(
        'DELETE FROM posts WHERE id=?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: 'Post deleted successfully!' });
        }
    );
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

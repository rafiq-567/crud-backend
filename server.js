// require('dotenv').config();
// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');

// const app = express();

// // CORS configuration (Frontend URL from env)
// app.use(cors({
//     origin: process.env.FRONTEND_URL,
//     methods: ["GET", "POST", "PUT", "DELETE"],
// }));

// app.use(express.json());

// // MySQL connection
// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,   // Railway gives a port (important!)
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME
// });

// // Connect to MySQL
// db.connect((err) => {
//     if (err) {
//         console.error("❌ Database connection failed:", err.message);
//         return;
//     }
//     console.log("✅ Connected to MySQL Database");
// });

// // -------------------------------
// //        ROUTES
// // -------------------------------

// // Get all posts
// app.get('/api/posts', (req, res) => {
//     db.query('SELECT * FROM posts', (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json(results);
//     });
// });

// // Create post
// app.post('/api/posts', (req, res) => {
//     const { title, body } = req.body;

//     db.query(
//         'INSERT INTO posts (title, body) VALUES (?, ?)',
//         [title, body],
//         (err, results) => {
//             if (err) return res.status(500).json({ error: err.message });

//             res.json({
//                 id: results.insertId,
//                 title,
//                 body
//             });
//         }
//     );
// });

// // Get a single post
// app.get('/api/posts/:id', (req, res) => {
//     db.query(
//         'SELECT * FROM posts WHERE id = ?',
//         [req.params.id],
//         (err, results) => {
//             if (err) return res.status(500).json({ error: err.message });
//             res.json(results[0]);
//         }
//     );
// });

// // Update post
// app.put('/api/posts/:id', (req, res) => {
//     const { title, body } = req.body;

//     db.query(
//         'UPDATE posts SET title=?, body=? WHERE id=?',
//         [title, body, req.params.id],
//         (err) => {
//             if (err) return res.status(500).json({ error: err.message });

//             res.json({
//                 id: req.params.id,
//                 title,
//                 body
//             });
//         }
//     );
// });

// // Delete post
// app.delete('/api/posts/:id', (req, res) => {
//     db.query(
//         'DELETE FROM posts WHERE id=?',
//         [req.params.id],
//         (err) => {
//             if (err) return res.status(500).json({ error: err.message });

//             res.json({ message: 'Post deleted successfully!' });
//         }
//     );
// });

// // Start server
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


require('dotenv').config();
const express = require('express');
// CRITICAL: Use the promise-based version of mysql2 for async/await
const mysql = require('mysql2/promise'); 
const cors = require('cors');

const app = express();

// --- Middleware ---
// CORS configuration
app.use(cors({
    // IMPORTANT: Ensure FRONTEND_URL is set correctly in Railway Variables
    origin: process.env.FRONTEND_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json()); // Body parser

// --- Database Connection Pool Setup ---
// Using a connection pool for better performance and resource management
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ------------------------------------
//        ROUTES (Refactored to use async/await with pool)
// ------------------------------------

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        // [results] is the data; the second element [fields] is metadata, which we ignore
        const [results] = await pool.query('SELECT * FROM posts'); 
        res.json(results);
    } catch (err) {
        console.error("Error fetching posts:", err.message);
        res.status(500).json({ error: 'Failed to fetch posts', detail: err.message });
    }
});

// Create post
app.post('/api/posts', async (req, res) => {
    try {
        const { title, body } = req.body;
        
        const query = 'INSERT INTO posts (title, body) VALUES (?, ?)';
        const [results] = await pool.query(query, [title, body]);

        res.status(201).json({
            id: results.insertId,
            title,
            body
        });
    } catch (err) {
        console.error("Error creating post:", err.message);
        res.status(500).json({ error: 'Failed to create post', detail: err.message });
    }
});

// Get a single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM posts WHERE id = ?';
        const [results] = await pool.query(query, [req.params.id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(`Error fetching post ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to fetch post', detail: err.message });
    }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { title, body } = req.body;
        const query = 'UPDATE posts SET title=?, body=? WHERE id=?';
        const [results] = await pool.query(query, [title, body, req.params.id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ id: req.params.id, title, body, message: 'Post updated' });
    } catch (err) {
        console.error(`Error updating post ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to update post', detail: err.message });
    }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const query = 'DELETE FROM posts WHERE id=?';
        const [results] = await pool.query(query, [req.params.id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({ message: 'Post deleted successfully!' });
    } catch (err) {
        console.error(`Error deleting post ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to delete post', detail: err.message });
    }
});


// Fallback for unhandled routes (404 API Not Found)
app.use((req, res, next) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}. Route not found.` });
});


// --- Server Startup Sequence ---
const startServer = async () => {
    const PORT = process.env.PORT || 8000;
    const HOST = '0.0.0.0'; // CRITICAL: Ensure binding to all interfaces for container networking

    try {
        // 1. Check Database Connection Health
        const connection = await pool.getConnection();
        connection.release(); // Release the acquired connection
        console.log("✅ Successfully connected to MySQL Database");

        // 2. Start Express Server
        // We explicitly pass HOST to ensure it binds correctly inside the container
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
        });

    } catch (err) {
        // 3. Fail Loudly and Exit if DB or Server Fails
        console.error("❌ Fatal Startup Error:", err.message);
        console.error("Reason: Failed to connect to MySQL or start server.");
        // CRITICAL: Terminate the process to let Railway know it failed
        process.exit(1); 
    }
};

startServer();
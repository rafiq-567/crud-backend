const express = require('express');
const mysql = require('mysql2');
const cors = require('cors')

const app = express();
const PORT = 8000;

app.use(cors())
app.use(express.json())

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'node_crud'
})

//list post
app.get('/api/posts', (req, res) => {
    db.query('SELECT * FROM posts', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json(results);
    });
});

//post create
app.post('/api/posts', (req, res) => {

    const { title, body } = req.body;

    db.query('INSERT INTO posts (title, body) values (?,?)', [title, body], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({ id: results.insertId, title: title, body: body });
    });
});

//get post detail
app.get('/api/posts/:id', (req, res) => {

    db.query('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json(results[0]);
    });
});

//post update
app.put('/api/posts/:id', (req, res) => {
    const { title, body } = req.body;
    db.query('UPDATE posts SET title=? , body=? WHERE id=?', [title, body, req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({ id: req.params.id, title: title, body: body })
    });
});

//delete post
app.delete('/api/posts/:id', (req, res) => {

    db.query('DELETE from posts where id=?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message })
        }
        res.json({message: 'post deleted successfully!'});
    });
});


app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})
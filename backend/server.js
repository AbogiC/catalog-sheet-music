const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
require('dotenv').config()

const app = express()
const port = 3000

// Middleware
app.use(cors())
app.use(express.json())

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sheet_music_db',
})

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err)
    process.exit(1)
  }
  console.log('Connected to MySQL database')
})

// Create table if not exists
const createTableSQL = `
CREATE TABLE IF NOT EXISTS sheet_music (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  composer VARCHAR(255),
  composer_dates VARCHAR(50),
  opus VARCHAR(100),
  arranger VARCHAR(255),
  instrumentation VARCHAR(255),
  \`key\` VARCHAR(50),
  tempo VARCHAR(100),
  difficulty VARCHAR(50),
  duration DECIMAL(5,2),
  publisher VARCHAR(255),
  year_published INT,
  location VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`

db.query(createTableSQL, (err) => {
  if (err) {
    console.error('Error creating table:', err)
  } else {
    console.log('Table sheet_music ready')
  }
})

// API Routes

// Get all sheet music with search
app.get('/api/sheet-music', (req, res) => {
  let sql = 'SELECT * FROM sheet_music'
  const params = []
  const conditions = []

  if (req.query.q) {
    conditions.push(`(title LIKE ? OR composer LIKE ? OR instrumentation LIKE ?)`)
    const searchTerm = `%${req.query.q}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (req.query.difficulty) {
    conditions.push('difficulty = ?')
    params.push(req.query.difficulty)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY created_at DESC'

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    res.json(results)
  })
})

// Get single sheet music
app.get('/api/sheet-music/:id', (req, res) => {
  const sql = 'SELECT * FROM sheet_music WHERE id = ?'
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(results[0])
  })
})

// Create new sheet music
app.post('/api/sheet-music', (req, res) => {
  const {
    title,
    composer,
    composer_dates,
    opus,
    arranger,
    instrumentation,
    key,
    tempo,
    difficulty,
    duration,
    publisher,
    year_published,
    location,
    notes,
  } = req.body

  const sql = `
    INSERT INTO sheet_music
    (title, composer, composer_dates, opus, arranger, instrumentation,
     \`key\`, tempo, difficulty, duration, publisher, year_published,
     location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const params = [
    title,
    composer,
    composer_dates,
    opus,
    arranger,
    instrumentation,
    key,
    tempo,
    difficulty,
    duration,
    publisher,
    year_published,
    location,
    notes,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    res.status(201).json({ id: result.insertId, ...req.body })
  })
})

// Update sheet music
app.put('/api/sheet-music/:id', (req, res) => {
  const {
    title,
    composer,
    composer_dates,
    opus,
    arranger,
    instrumentation,
    key,
    tempo,
    difficulty,
    duration,
    publisher,
    year_published,
    location,
    notes,
  } = req.body

  const sql = `
    UPDATE sheet_music
    SET title = ?, composer = ?, composer_dates = ?, opus = ?,
        arranger = ?, instrumentation = ?, \`key\` = ?, tempo = ?,
        difficulty = ?, duration = ?, publisher = ?, year_published = ?,
        location = ?, notes = ?
    WHERE id = ?
  `

  const params = [
    title,
    composer,
    composer_dates,
    opus,
    arranger,
    instrumentation,
    key,
    tempo,
    difficulty,
    duration,
    publisher,
    year_published,
    location,
    notes,
    req.params.id,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({ id: req.params.id, ...req.body })
  })
})

// Delete sheet music
app.delete('/api/sheet-music/:id', (req, res) => {
  const sql = 'DELETE FROM sheet_music WHERE id = ?'
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({ message: 'Deleted successfully' })
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

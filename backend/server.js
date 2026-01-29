const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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
  password: process.env.DB_PASSWORD || 'bi5millah',
  database: process.env.DB_NAME || 'sheet_music_db',
})

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err)
    process.exit(1)
  }
  console.log('Connected to MySQL database')
})

// Create tables if not exists
const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
`

const createSheetMusicTableSQL = `
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
)
`

// Execute table creation queries
db.query(createUsersTableSQL, (err) => {
  if (err) {
    console.error('Error creating users table:', err)
  } else {
    console.log('Users table ready')
    // Now create sheet_music table
    db.query(createSheetMusicTableSQL, (err) => {
      if (err) {
        console.error('Error creating sheet_music table:', err)
      } else {
        console.log('Sheet_music table ready')
      }
    })
  }
})

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// API Routes

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' })
    }

    // Check if user already exists
    const checkUserSql = 'SELECT * FROM users WHERE username = ? OR email = ?'
    db.query(checkUserSql, [username, email], async (err, results) => {
      if (err) {
        console.error('Error checking user:', err)
        return res.status(500).json({ error: 'Database error' })
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert new user
      const insertUserSql = 'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)'
      db.query(insertUserSql, [username, email, hashedPassword, full_name || null], (err, result) => {
        if (err) {
          console.error('Error creating user:', err)
          return res.status(500).json({ error: 'Database error' })
        }

        // Create JWT token
        const user = {
          id: result.insertId,
          username,
          email,
          full_name: full_name || null,
          role: 'user'
        }

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user
        })
      })
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const sql = 'SELECT * FROM users WHERE username = ? OR email = ?'
  db.query(sql, [username, username], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = results[0]

    // Compare passwords
    try {
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Create user object without password
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }

      // Create JWT token
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' })

      res.json({
        message: 'Login successful',
        token,
        user: userData
      })
    } catch (error) {
      console.error('Password comparison error:', error)
      res.status(500).json({ error: 'Server error' })
    }
  })
})

// Get current user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  const sql = 'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?'
  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(results[0])
  })
})

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { full_name, email, current_password, new_password } = req.body

  try {
    // First, get current user data
    const getUserSql = 'SELECT * FROM users WHERE id = ?'
    db.query(getUserSql, [req.user.id], async (err, results) => {
      if (err) {
        console.error('Error fetching user:', err)
        return res.status(500).json({ error: 'Database error' })
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const user = results[0]
      let hashedPassword = user.password

      // If changing password, verify current password
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ error: 'Current password is required to set new password' })
        }

        const passwordMatch = await bcrypt.compare(current_password, user.password)
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' })
        }

        hashedPassword = await bcrypt.hash(new_password, 10)
      }

      // Check if email already exists (if changing email)
      if (email && email !== user.email) {
        const checkEmailSql = 'SELECT id FROM users WHERE email = ? AND id != ?'
        db.query(checkEmailSql, [email, req.user.id], (err, emailResults) => {
          if (err) {
            console.error('Error checking email:', err)
            return res.status(500).json({ error: 'Database error' })
          }

          if (emailResults.length > 0) {
            return res.status(400).json({ error: 'Email already in use' })
          }

          updateUser()
        })
      } else {
        updateUser()
      }

      function updateUser() {
        const updateSql = 'UPDATE users SET full_name = ?, email = ?, password = ? WHERE id = ?'
        db.query(updateSql, [
          full_name || user.full_name,
          email || user.email,
          hashedPassword,
          req.user.id
        ], (err, result) => {
          if (err) {
            console.error('Error updating profile:', err)
            return res.status(500).json({ error: 'Database error' })
          }

          // Get updated user data
          db.query('SELECT id, username, email, full_name, role FROM users WHERE id = ?',
            [req.user.id], (err, updatedResults) => {
              if (err) {
                console.error('Error fetching updated user:', err)
                return res.status(500).json({ error: 'Database error' })
              }

              // Generate new token with updated data
              const updatedUser = updatedResults[0]
              const newToken = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '24h' })

              res.json({
                message: 'Profile updated successfully',
                token: newToken,
                user: updatedUser
              })
            })
        })
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin only: Get all users
app.get('/api/users', authenticateToken, checkAdmin, (req, res) => {
  const sql = 'SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    res.json(results)
  })
})

// Admin only: Update user role
app.put('/api/users/:id/role', authenticateToken, checkAdmin, (req, res) => {
  const { role } = req.body
  const userId = req.params.id

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }

  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' })
  }

  const sql = 'UPDATE users SET role = ? WHERE id = ?'
  db.query(sql, [role, userId], (err, result) => {
    if (err) {
      console.error('Error updating user role:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User role updated successfully' })
  })
})

// Update sheet music routes to include authentication

// Get all sheet music with search (now includes user_id)
app.get('/api/sheet-music', authenticateToken, (req, res) => {
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

// Get single sheet music (with user permission check)
app.get('/api/sheet-music/:id', authenticateToken, (req, res) => {
  let sql = 'SELECT * FROM sheet_music WHERE id = ?'
  const params = [req.params.id]

  if (req.user.role !== 'admin') {
    sql += ' AND user_id = ?'
    params.push(req.user.id)
  }

  db.query(sql, params, (err, results) => {
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

// Create new sheet music (now includes user_id)
app.post('/api/sheet-music', authenticateToken, (req, res) => {
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
     location, notes, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    req.user.id
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    res.status(201).json({ id: result.insertId, ...req.body, user_id: req.user.id })
  })
})

// Update sheet music (with user permission check)
app.put('/api/sheet-music/:id', authenticateToken, (req, res) => {
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

  // First check if user has permission to update
  let checkSql = 'SELECT * FROM sheet_music WHERE id = ?'
  const checkParams = [req.params.id]

  if (req.user.role !== 'admin') {
    checkSql += ' AND user_id = ?'
    checkParams.push(req.user.id)
  }

  db.query(checkSql, checkParams, (err, results) => {
    if (err) {
      console.error('Error checking sheet music:', err)
      return res.status(500).json({ error: 'Database error' })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Not found or no permission' })
    }

    // Proceed with update
    const updateSql = `
      UPDATE sheet_music
      SET title = ?, composer = ?, composer_dates = ?, opus = ?,
          arranger = ?, instrumentation = ?, \`key\` = ?, tempo = ?,
          difficulty = ?, duration = ?, publisher = ?, year_published = ?,
          location = ?, notes = ?
      WHERE id = ?
    `

    const updateParams = [
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

    db.query(updateSql, updateParams, (err, result) => {
      if (err) {
        console.error('Error updating sheet music:', err)
        res.status(500).json({ error: 'Database error' })
        return
      }
      res.json({ id: req.params.id, ...req.body })
    })
  })
})

// Delete sheet music (with user permission check)
app.delete('/api/sheet-music/:id', authenticateToken, (req, res) => {
  let sql = 'DELETE FROM sheet_music WHERE id = ?'
  const params = [req.params.id]

  if (req.user.role !== 'admin') {
    sql += ' AND user_id = ?'
    params.push(req.user.id)
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error deleting sheet music:', err)
      res.status(500).json({ error: 'Database error' })
      return
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Not found or no permission' })
      return
    }
    res.json({ message: 'Deleted successfully' })
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`)
})

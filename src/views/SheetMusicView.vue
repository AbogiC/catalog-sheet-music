<template>
  <div class="sheet-music-catalog">
    <h1>Sheet Music Catalog</h1>

    <!-- Add/Edit Form -->
    <div class="form-section">
      <h2>{{ editingId ? 'Edit' : 'Add' }} Sheet Music</h2>
      <form @submit.prevent="saveSheetMusic" class="music-form">
        <div class="form-row">
          <div class="form-group">
            <label>Title *</label>
            <input v-model="form.title" required />
          </div>
          <div class="form-group">
            <label>Composer</label>
            <input v-model="form.composer" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Composer Dates</label>
            <input v-model="form.composer_dates" placeholder="e.g., 1685-1750" />
          </div>
          <div class="form-group">
            <label>Opus/Catalog Number</label>
            <input v-model="form.opus" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Arranger/Editor</label>
            <input v-model="form.arranger" />
          </div>
          <div class="form-group">
            <label>Instrumentation</label>
            <input v-model="form.instrumentation" placeholder="e.g., Piano, Violin" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Key</label>
            <input v-model="form.key" placeholder="e.g., C major, A minor" />
          </div>
          <div class="form-group">
            <label>Tempo/Style</label>
            <input v-model="form.tempo" placeholder="e.g., Allegro, Adagio" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Difficulty</label>
            <select v-model="form.difficulty">
              <option value="">Select Difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input v-model="form.duration" type="number" step="0.1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Publisher</label>
            <input v-model="form.publisher" />
          </div>
          <div class="form-group">
            <label>Year Published</label>
            <input v-model="form.year_published" type="number" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label>Location/File Name</label>
            <input v-model="form.location" placeholder="e.g., /music/bach_prelude.pdf" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label>Notes</label>
            <textarea v-model="form.notes" rows="3"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary">
            {{ editingId ? 'Update' : 'Save' }}
          </button>
          <button v-if="editingId" type="button" @click="cancelEdit" class="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Search and Filter -->
    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="searchSheetMusic"
        placeholder="Search by title, composer, or instrumentation..."
        class="search-input"
      />
      <div class="filter-section">
        <select v-model="filterDifficulty" @change="filterSheetMusic">
          <option value="">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Professional">Professional</option>
        </select>
      </div>
    </div>

    <!-- Sheet Music List -->
    <div class="music-list">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="sheetMusic.length === 0" class="empty-state">
        No sheet music found. Add some using the form above!
      </div>
      <div v-else class="music-grid">
        <div v-for="item in sheetMusic" :key="item.id" class="music-card">
          <div class="music-card-header">
            <h3>{{ item.title }}</h3>
            <div class="music-card-actions">
              <button @click="editSheetMusic(item)" class="btn-edit">✏️</button>
              <button @click="deleteSheetMusic(item.id)" class="btn-delete">🗑️</button>
            </div>
          </div>
          <div class="music-card-body">
            <p>
              <strong>Composer:</strong> {{ item.composer }}
              {{ item.composer_dates ? `(${item.composer_dates})` : '' }}
            </p>
            <p v-if="item.opus"><strong>Opus:</strong> {{ item.opus }}</p>
            <p v-if="item.arranger"><strong>Arranger/Editor:</strong> {{ item.arranger }}</p>
            <p v-if="item.instrumentation">
              <strong>Instrumentation:</strong> {{ item.instrumentation }}
            </p>
            <p v-if="item.key"><strong>Key:</strong> {{ item.key }}</p>
            <p v-if="item.tempo"><strong>Tempo/Style:</strong> {{ item.tempo }}</p>
            <p>
              <strong>Difficulty:</strong>
              <span class="difficulty-badge" :class="(item.difficulty || '').toLowerCase()">{{
                item.difficulty
              }}</span>
            </p>
            <p v-if="item.duration"><strong>Duration:</strong> {{ item.duration }} minutes</p>
            <p v-if="item.publisher"><strong>Publisher:</strong> {{ item.publisher }}</p>
            <p v-if="item.year_published">
              <strong>Year Published:</strong> {{ item.year_published }}
            </p>
            <p v-if="item.location">
              <strong>Location:</strong> <code>{{ item.location }}</code>
            </p>
            <p v-if="item.notes"><strong>Notes:</strong> {{ item.notes }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sheetMusic: [],
      loading: false,
      searchQuery: '',
      filterDifficulty: '',
      editingId: null,
      form: {
        title: '',
        composer: '',
        composer_dates: '',
        opus: '',
        arranger: '',
        instrumentation: '',
        key: '',
        tempo: '',
        difficulty: '',
        duration: '',
        publisher: '',
        year_published: '',
        location: '',
        notes: '',
      },
    }
  },
  mounted() {
    this.fetchSheetMusic()
  },
  methods: {
    // Fetch all sheet music
    async fetchSheetMusic() {
      this.loading = true
      try {
        const response = await fetch('http://localhost:3000/api/sheet-music')
        this.sheetMusic = await response.json()
      } catch (error) {
        console.error('Error fetching sheet music:', error)
      } finally {
        this.loading = false
      }
    },

    // Search and filter
    async searchSheetMusic() {
      this.loading = true
      try {
        const params = new URLSearchParams()
        if (this.searchQuery) params.append('q', this.searchQuery)
        if (this.filterDifficulty) params.append('difficulty', this.filterDifficulty)

        const response = await fetch(`http://localhost:3000/api/sheet-music?${params}`)
        this.sheetMusic = await response.json()
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        this.loading = false
      }
    },

    async filterSheetMusic() {
      await this.searchSheetMusic()
    },

    // Save or update sheet music
    async saveSheetMusic() {
      try {
        const url = this.editingId
          ? `http://localhost:3000/api/sheet-music/${this.editingId}`
          : 'http://localhost:3000/api/sheet-music'

        const method = this.editingId ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        })

        if (response.ok) {
          this.resetForm()
          await this.fetchSheetMusic()
        }
      } catch (error) {
        console.error('Error saving sheet music:', error)
      }
    },

    // Edit sheet music
    editSheetMusic(item) {
      this.editingId = item.id
      Object.keys(this.form).forEach((key) => {
        this.form[key] = item[key] || ''
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    // Delete sheet music
    async deleteSheetMusic(id) {
      if (!confirm('Are you sure you want to delete this item?')) return

      try {
        const response = await fetch(`http://localhost:3000/api/sheet-music/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await this.fetchSheetMusic()
        }
      } catch (error) {
        console.error('Error deleting sheet music:', error)
      }
    },

    // Cancel edit
    cancelEdit() {
      this.editingId = null
      this.resetForm()
    },

    // Reset form
    resetForm() {
      this.editingId = null
      Object.keys(this.form).forEach((key) => {
        this.form[key] = ''
      })
    },
  },
}
</script>

<style scoped>
.sheet-music-catalog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.music-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  flex: 2;
}

label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

input,
select,
textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.search-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.filter-section select {
  padding: 10px 15px;
  min-width: 200px;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.music-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.music-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.music-card-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.music-card-actions {
  display: flex;
  gap: 10px;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.btn-edit:hover {
  color: #4caf50;
}

.btn-delete:hover {
  color: #f44336;
}

.music-card-body p {
  margin: 5px 0;
  font-size: 14px;
  color: #555;
}

.music-card-body strong {
  color: #333;
}

.difficulty-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.difficulty-badge.beginner {
  background-color: #4caf50;
}

.difficulty-badge.intermediate {
  background-color: #2196f3;
}

.difficulty-badge.advanced {
  background-color: #ff9800;
}

.difficulty-badge.professional {
  background-color: #f44336;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  background: #f9f9f9;
  border: 2px dashed #ddd;
  border-radius: 8px;
}
</style>

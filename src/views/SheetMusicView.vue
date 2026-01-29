<template>
  <div class="sheet-music-catalog">
    <h1>Sheet Music Catalog</h1>

    <!-- Search and Filter -->
    <div class="search-section">
      <input v-model="searchQuery" @input="searchSheetMusic"
        placeholder="Search by title, composer, or instrumentation..." class="search-input" />
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

    <!-- Add Button -->
    <div v-if="isAdmin" class="add-button-section">
      <button @click="openAddModal" class="btn-primary">Add New Sheet Music</button>
    </div>

    <!-- Sheet Music List -->
    <div class="music-list">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="sheetMusic.length === 0" class="empty-state">
        No sheet music found. Add some using the button above!
      </div>
      <table v-else class="music-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Composer</th>
            <th>Difficulty</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sheetMusic" :key="item.id">
            <td>{{ item.title }}</td>
            <td>{{ item.composer }}</td>
            <td>
              <span class="difficulty-badge" :class="(item.difficulty || '').toLowerCase()">{{
                item.difficulty
              }}</span>
            </td>
            <td class="actions-cell">
              <button @click="editSheetMusic(item)" class="btn-edit">{{ isAdmin ? 'Edit' : 'View' }}</button>
              <button v-if="isAdmin" @click="deleteSheetMusic(item.id)" class="btn-delete">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2 v-if="isAdmin">{{ isEditing ? 'Edit' : 'Add' }} Sheet Music</h2>
          <h2 v-if="!isAdmin">Preview Sheet Music</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveSheetMusic" class="music-form">
            <div class="form-row">
              <div class="form-group">
                <label>Title *</label>
                <input v-model="form.title" :disabled="!isAdmin" required />
              </div>
              <div class="form-group">
                <label>Composer</label>
                <input v-model="form.composer" :disabled="!isAdmin" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Composer Dates</label>
                <input v-model="form.composer_dates" :disabled="!isAdmin" placeholder="e.g., 1685-1750" />
              </div>
              <div class="form-group">
                <label>Opus/Catalog Number</label>
                <input v-model="form.opus" :disabled="!isAdmin" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Arranger/Editor</label>
                <input v-model="form.arranger" :disabled="!isAdmin" />
              </div>
              <div class="form-group">
                <label>Instrumentation</label>
                <input v-model="form.instrumentation" :disabled="!isAdmin" placeholder="e.g., Piano, Violin" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Key</label>
                <input v-model="form.key" :disabled="!isAdmin" placeholder="e.g., C major, A minor" />
              </div>
              <div class="form-group">
                <label>Tempo/Style</label>
                <input v-model="form.tempo" :disabled="!isAdmin" placeholder="e.g., Allegro, Adagio" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Difficulty</label>
                <select v-model="form.difficulty" :disabled="!isAdmin">
                  <option value="">Select Difficulty</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
              <div class="form-group">
                <label>Duration (minutes)</label>
                <input v-model="form.duration" :disabled="!isAdmin" type="number" step="0.1" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Publisher</label>
                <input v-model="form.publisher" :disabled="!isAdmin" />
              </div>
              <div class="form-group">
                <label>Year Published</label>
                <input v-model="form.year_published" :disabled="!isAdmin" type="number" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>Location/File Name</label>
                <input v-model="form.location" :disabled="!isAdmin" placeholder="e.g., /music/bach_prelude.pdf" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea v-model="form.notes" :disabled="!isAdmin" rows="3"></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button v-if="isAdmin" type="submit" :disabled="!isAdmin" class="btn-primary">
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
              <button type="button" @click="closeModal" class="btn-secondary">{{ isAdmin ? 'Cancel' : 'Close'
                }}</button>
            </div>
          </form>
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
      showModal: false,
      isEditing: false,
      editingId: null,
      isAdmin: false,
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
    this.checkAdminStatus()
  },
  methods: {
    async checkAdminStatus() {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        this.isAdmin = userData.role === 'admin'
      }
    },

    getAuthHeader() {
      const token = localStorage.getItem('auth_token')
      return token ? { 'Authorization': `Bearer ${token}` } : {}
    },

    // Fetch all sheet music
    async fetchSheetMusic() {
      this.loading = true
      try {
        const response = await fetch(
          `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music`, {
          headers: this.getAuthHeader()
        }
        )
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

        const response = await fetch(
          `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music?${params}`,
        )
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
          ? `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music/${this.editingId}`
          : `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music`

        const method = this.editingId ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        })

        if (response.ok) {
          this.closeModal()
          await this.fetchSheetMusic()
        }
      } catch (error) {
        console.error('Error saving sheet music:', error)
      }
    },

    // Open add modal
    openAddModal() {
      this.isEditing = false
      this.showModal = true
      this.resetForm()
    },

    // Edit sheet music
    editSheetMusic(item) {
      this.editingId = item.id
      this.isEditing = true
      this.showModal = true
      Object.keys(this.form).forEach((key) => {
        this.form[key] = item[key] || ''
      })
    },

    // Close modal
    closeModal() {
      this.showModal = false
      this.resetForm()
    },

    // Delete sheet music
    async deleteSheetMusic(id) {
      if (!confirm('Are you sure you want to delete this item?')) return

      try {
        const response = await fetch(
          `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music/${id}`,
          {
            method: 'DELETE',
          },
        )

        if (response.ok) {
          await this.fetchSheetMusic()
        }
      } catch (error) {
        console.error('Error deleting sheet music:', error)
      }
    },

    // Reset form
    resetForm() {
      this.editingId = null
      this.isEditing = false
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

.add-button-section {
  margin-bottom: 20px;
}

.music-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.music-table th,
.music-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.music-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.music-table tbody tr:hover {
  background: #f9f9f9;
}

.actions-cell {
  white-space: nowrap;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  margin-right: 5px;
}

.btn-edit:hover {
  color: #4caf50;
}

.btn-delete:hover {
  color: #f44336;
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

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
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

/* Responsive design */
@media (max-width: 768px) {
  .sheet-music-catalog {
    padding: 10px;
  }

  .search-section {
    flex-direction: column;
    gap: 15px;
  }

  .add-button-section {
    text-align: center;
  }

  .music-table {
    font-size: 14px;
  }

  .music-table th,
  .music-table td {
    padding: 8px 10px;
  }

  .actions-cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .actions-cell button {
    padding: 6px 12px;
    font-size: 12px;
  }

  .modal {
    width: 95%;
    margin: 10px;
  }

  .modal-header,
  .modal-body {
    padding: 15px;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .music-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .music-table th,
  .music-table td {
    min-width: 120px;
  }

  .difficulty-badge {
    font-size: 11px;
    padding: 1px 6px;
  }
}
</style>

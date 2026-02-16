<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Sheet Music Catalog</h2>
      <button v-if="isAdmin" class="btn btn-primary" @click="openAddModal">
        Add Sheet Music
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="form-row">
          <div class="col-md-8 mb-2">
            <input v-model="searchQuery" @input="searchSheetMusic" class="form-control"
              placeholder="Search by title, composer, or instrumentation" />
          </div>
          <div class="col-md-4 mb-2">
            <select v-model="filterDifficulty" @change="filterSheetMusic" class="form-control">
              <option value="">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-center py-5 text-muted">
      Loading...
    </div>

    <div v-else-if="sheetMusic.length === 0" class="alert alert-info">
      No sheet music found.
    </div>

    <div v-else class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="thead-light">
          <tr>
            <th>Title</th>
            <th>Composer</th>
            <th>Arranger</th>
            <th>Difficulty</th>
            <th class="text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sheetMusic" :key="item.id">
            <td>{{ item.title }}</td>
            <td>{{ item.composer }}</td>
            <td>{{ item.arranger }}</td>
            <td>
              <span class="badge" :class="difficultyClass(item.difficulty)">
                {{ item.difficulty }}
              </span>
            </td>
            <td class="text-nowrap">
              <button class="btn btn-sm btn-outline-primary mr-2" @click="editSheetMusic(item)">
                {{ isAdmin ? 'Edit' : 'View' }}
              </button>
              <button v-if="isAdmin" class="btn btn-sm btn-outline-danger" @click="deleteSheetMusic(item.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <form @submit.prevent="saveSheetMusic">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isAdmin ? (isEditing ? 'Edit Sheet Music' : 'Add Sheet Music') : 'Sheet Music Preview' }}
              </h5>
              <button type="button" class="close" @click="closeModal">
                <span>&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Title *</label>
                  <input v-model="form.title" class="form-control" :disabled="!isAdmin" required />
                </div>
                <div class="form-group col-md-6">
                  <label>Composer</label>
                  <input v-model="form.composer" class="form-control" :disabled="!isAdmin" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Composer Dates</label>
                  <input v-model="form.composer_dates" class="form-control" :disabled="!isAdmin" />
                </div>
                <div class="form-group col-md-6">
                  <label>Opus</label>
                  <input v-model="form.opus" class="form-control" :disabled="!isAdmin" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-6">
                  <label>Instrumentation</label>
                  <input v-model="form.instrumentation" class="form-control" :disabled="!isAdmin" />
                </div>
                <div class="form-group col-md-6">
                  <label>Difficulty</label>
                  <select v-model="form.difficulty" class="form-control" :disabled="!isAdmin">
                    <option value="">Select</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Professional</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea v-model="form.notes" class="form-control" rows="3" :disabled="!isAdmin"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button v-if="isAdmin" type="submit" class="btn btn-primary">
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { isAdmin } from '../auth/auth.js'

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
    this.isAdmin = isAdmin()
  },
  methods: {
    difficultyClass(level) {
      return {
        Beginner: 'badge-success',
        Intermediate: 'badge-primary',
        Advanced: 'badge-warning',
        Professional: 'badge-danger',
      }[level] || 'badge-secondary'
    },

    async fetchSheetMusic() {
      this.loading = true
      try {
        const res = await fetch(`http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music`)
        this.sheetMusic = await res.json()
      } finally {
        this.loading = false
      }
    },

    async searchSheetMusic() {
      const params = new URLSearchParams()
      if (this.searchQuery) params.append('q', this.searchQuery)
      if (this.filterDifficulty) params.append('difficulty', this.filterDifficulty)

      this.loading = true
      try {
        const res = await fetch(
          `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music?${params}`
        )
        this.sheetMusic = await res.json()
      } finally {
        this.loading = false
      }
    },

    filterSheetMusic() {
      this.searchSheetMusic()
    },

    openAddModal() {
      this.resetForm()
      this.showModal = true
    },

    editSheetMusic(item) {
      this.isEditing = true
      this.editingId = item.id
      this.showModal = true
      Object.assign(this.form, item)
    },

    closeModal() {
      this.showModal = false
      this.resetForm()
    },

    async saveSheetMusic() {
      const url = this.editingId
        ? `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music/${this.editingId}`
        : `http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music`

      await fetch(url, {
        method: this.editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(this.form),
      })

      this.closeModal()
      this.fetchSheetMusic()
    },

    async deleteSheetMusic(id) {
      if (!confirm('Delete this item?')) return
      await fetch(`http://${process.env.VUE_APP_URL_DOMAIN}:3000/api/sheet-music/${id}`, {
        method: 'DELETE',
      })
      this.fetchSheetMusic()
    },

    resetForm() {
      this.isEditing = false
      this.editingId = null
      Object.keys(this.form).forEach(k => (this.form[k] = ''))
    },
  },
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="register-title">Create Account</h2>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            :class="['form-input', { 'error': errors.username }]"
            placeholder="Choose a username"
            required
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            :class="['form-input', { 'error': errors.email }]"
            placeholder="Enter your email"
            required
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="full_name" class="form-label">Full Name (Optional)</label>
          <input
            type="text"
            id="full_name"
            v-model="form.full_name"
            :class="['form-input', { 'error': errors.full_name }]"
            placeholder="Enter your full name"
          />
          <span v-if="errors.full_name" class="error-message">{{ errors.full_name }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            :class="['form-input', { 'error': errors.password }]"
            placeholder="Create a password"
            required
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          <small class="password-hint">Password must be at least 6 characters</small>
        </div>

        <div class="form-group">
          <label for="confirm_password" class="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirm_password"
            v-model="form.confirm_password"
            :class="['form-input', { 'error': errors.confirm_password }]"
            placeholder="Confirm your password"
            required
          />
          <span v-if="errors.confirm_password" class="error-message">{{ errors.confirm_password }}</span>
        </div>

        <div class="form-group">
          <button type="submit" class="btn btn-primary btn-register" :disabled="loading">
            <span v-if="loading">Creating Account...</span>
            <span v-else>Create Account</span>
          </button>
        </div>

        <div class="form-footer">
          <p class="login-link">
            Already have an account?
            <router-link to="/login" class="link">Login here</router-link>
          </p>
        </div>
      </form>

      <div v-if="message" class="alert" :class="messageType">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterPage',

  data() {
    return {
      form: {
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirm_password: ''
      },
      errors: {
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirm_password: ''
      },
      loading: false,
      message: '',
      messageType: ''
    }
  },

  methods: {
    validateForm() {
      let isValid = true

      // Reset errors
      this.errors = {
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirm_password: ''
      }

      // Validate username
      if (!this.form.username.trim()) {
        this.errors.username = 'Username is required'
        isValid = false
      } else if (this.form.username.length < 3) {
        this.errors.username = 'Username must be at least 3 characters'
        isValid = false
      }

      // Validate email
      if (!this.form.email.trim()) {
        this.errors.email = 'Email is required'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
        this.errors.email = 'Please enter a valid email address'
        isValid = false
      }

      // Validate password
      if (!this.form.password) {
        this.errors.password = 'Password is required'
        isValid = false
      } else if (this.form.password.length < 6) {
        this.errors.password = 'Password must be at least 6 characters'
        isValid = false
      }

      // Validate confirm password
      if (!this.form.confirm_password) {
        this.errors.confirm_password = 'Please confirm your password'
        isValid = false
      } else if (this.form.password !== this.form.confirm_password) {
        this.errors.confirm_password = 'Passwords do not match'
        isValid = false
      }

      return isValid
    },

    async handleRegister() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      this.message = ''

      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.form.username,
            email: this.form.email,
            password: this.form.password,
            full_name: this.form.full_name || undefined
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // Save token and user data
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        this.message = 'Registration successful! You will be logged in...'
        this.messageType = 'success'

        // Redirect to dashboard or home page
        setTimeout(() => {
          this.$router.push('/')
        }, 1500)

      } catch (error) {
        this.message = error.message || 'Registration failed. Please try again.'
        this.messageType = 'error'
        console.error('Registration error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 40px;
}

.register-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.register-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.error {
  border-color: #e74c3c;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
}

.password-hint {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-register {
  margin-top: 10px;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-link {
  color: #666;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
  text-align: center;
}

.alert.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>

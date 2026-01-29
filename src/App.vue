<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container" style="display: flex; justify-content: space-between; align-items: center;">
        <router-link to="/" class="nav-brand"> 🎼 Sheet Music Catalog </router-link>
        <button v-if="loginCheck" class="btn-logout" @click="logout">Logout</button>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { isLoggedIn, logout } from './auth/auth';
export default {
  name: 'App',

  data() {
    return {
      loginCheck: false,
    }
  },

  mounted() {
    this.loginCheck = isLoggedIn();
  },

  methods: {
    logout() {
      logout();
      window.location.href = '/login'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-brand {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.main-content {
  padding: 20px;
}

.btn-logout {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: #c0392b;
}
</style>

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './stores/counter'

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')

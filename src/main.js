import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false


import { BaklavaVuePlugin } from '@baklavajs/plugin-renderer-vue'
import '@baklavajs/plugin-renderer-vue/dist/styles.css'

Vue.use(BaklavaVuePlugin)

Vue.config.productionTip = false

Vue.prototype.log = console.log

new Vue({
  render: h => h(App),
}).$mount('#app')

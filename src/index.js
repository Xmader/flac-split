
import Vue from "vue/dist/vue.runtime.esm.js"
import VueMaterial from "vue-material/dist/vue-material.js"
import App from "./App.vue"

Vue.use(VueMaterial)

Vue.material.registerTheme("default", {
    primary: "blue",
    accent: "red",
    warn: "red",
})

export const vm = new Vue({
    el: "#app",
    components: {
        App
    },
    render: function (createElement) {
        return createElement("App", { ref: "App" })
    },
})


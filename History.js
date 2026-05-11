const historyUrl = "https://localhost:7159/api/EmptyHistory";

Vue.createApp({

    data() {
        return {
            history: [],
            jwtToken: localStorage.getItem("token"),
            username: localStorage.getItem("username")
        };
    },

    methods: {

        authConfig() {
            return {
                headers: {
                    Authorization: `Bearer ${this.jwtToken}`
                }
            };
        },

        async getHistory() {

            const params = new URLSearchParams(window.location.search);
            const binId = params.get("binId");

            let url = historyUrl;

            // hvis binId findes → filtrér
            if (binId) {
                url = `${historyUrl}/${binId}`;
            }

            const res = await axios.get(url, this.authConfig());
            this.history = res.data;
        },

        formatDate(date) {
            if (!date) return "Ukendt";
            return new Date(date).toLocaleString("da-DK");
        },
        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "login.html";
        }
    },

    mounted() {
        this.getHistory();
    }

}).mount("#app");
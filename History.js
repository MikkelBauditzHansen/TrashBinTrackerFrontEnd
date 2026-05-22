const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net";
const historyUrl = `${apiBaseUrl}/api/EmptyHistory`;
const languageUrl = `${apiBaseUrl}/api/Language`;

Vue.createApp({

    data() {
        return {
            history: [],
            jwtToken: localStorage.getItem("token"),
            username: localStorage.getItem("username"),
            selectedLanguage: "Danish"
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

        async getLanguage() {
            const res = await axios.get(languageUrl);
            this.selectedLanguage = res.data;
        },

        async updateLanguage() {
            await axios.post(
                languageUrl,
                JSON.stringify(this.selectedLanguage),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.jwtToken}`
                    }
                }
            );
        },

        formatDate(date) {
            if (!date) return "Ukendt";
            return new Date(date).toLocaleString("da-DK");
        },
        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "Login.html";
        }
    },

    async mounted() {
        await this.getHistory();
        await this.getLanguage();
    }

}).mount("#app");

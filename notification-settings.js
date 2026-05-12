const notificationSettingsUrl = "https://localhost:7159/api/NotificationSettings";

Vue.createApp({

    data() {
        return {
            role: localStorage.getItem("role"),
            token: localStorage.getItem("token"),
            users: [],
            message: ""
        };
    },

    methods: {

        authConfig() {
            return {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            };
        },

        async getSettings() {

            if (this.role !== "Admin") {
                return;
            }

            try {

                const res = await axios.get(
                    notificationSettingsUrl,
                    this.authConfig()
                );

                this.users = res.data;

            } catch (error) {

                console.log("API ikke klar endnu. Bruger testdata.");

                this.users = [
                    {
                        username: "admin",
                        role: "Admin",
                        fillNotifications: true,
                        temperatureNotifications: true,
                        telegramEnabled: true
                    },
                    {
                        username: "user",
                        role: "User",
                        fillNotifications: true,
                        temperatureNotifications: false,
                        telegramEnabled: false
                    }
                ];
            }
        },

        async saveSettings(user) {

            try {

                await axios.put(
                    `${notificationSettingsUrl}/${user.username}`,
                    user,
                    this.authConfig()
                );

                this.message = "Indstillinger gemt";

            } catch (error) {

                console.log("Kunne ikke gemme til API endnu:", error);

                this.message = "Ændring gemt lokalt/test";
            }
        }
    },

    mounted() {
        this.getSettings();
    }

}).mount("#app");

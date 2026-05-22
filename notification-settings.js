const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net";
const notificationSettingsUrl = `${apiBaseUrl}/api/NotificationSettings`;

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
        async getSettings() {
            if (this.role !== "Admin") {
                return;
            }

            try {
                const res = await axios.get(
                    notificationSettingsUrl
                );

                this.users = [
                    {
                        username: "admin",
                        role: "Admin",
                        ...res.data
                    }
                ];
            } catch (error) {
                console.log("Kunne ikke hente settings fra API.", error);

                this.message = "Kunne ikke hente indstillinger fra API";
            }
        },

        async saveSettings(user) {
            try {
                const payload = {
                    fillNotifications: user.fillNotifications,
                    temperatureNotifications: user.temperatureNotifications,
                    telegramEnabled: user.telegramEnabled
                };

                await axios.put(
                    `${notificationSettingsUrl}/${user.username}`,
                    payload
                );

                this.message = "Indstillinger gemt";
            } catch (error) {
                console.log("Kunne ikke gemme settings til API:", error);

                this.message = "Kunne ikke gemme indstillinger i API";
            }
        }
    },

    mounted() {
        this.getSettings();
    }
}).mount("#app");

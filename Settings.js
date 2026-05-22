const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net";
const notificationSettingsUrl = `${apiBaseUrl}/api/NotificationSettings`;
const languageUrl = `${apiBaseUrl}/api/Language`;

Vue.createApp({

    data() {
        return {
            username: localStorage.getItem("username"),
            token: localStorage.getItem("token"),
            role: localStorage.getItem("role"),
            settings: {
                fillNotifications: true,
                temperatureNotifications: true,
                telegramEnabled: false
            },
            selectedLanguage: "Danish",
            newFillWatchLevel: 0,
            message: ""
        };
    },

    methods: {
        logout() {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "Login.html";
        },

        async loadSettings() {
            const saved = localStorage.getItem("notificationSettings");

            if (saved) {
                this.settings = {
                    ...this.settings,
                    ...JSON.parse(saved)
                };
            }

            try {
                const res = await axios.get(
                    notificationSettingsUrl
                );

                this.settings = {
                    fillNotifications: res.data.fillNotifications,
                    temperatureNotifications: res.data.temperatureNotifications,
                    telegramEnabled: res.data.telegramEnabled
                };

                localStorage.setItem(
                    "notificationSettings",
                    JSON.stringify(this.settings)
                );
            } catch (error) {
                console.log("Kunne ikke hente settings fra API:", error);
            }
        },

        async save() {
            if (!this.settings.temperatureNotifications) {
                localStorage.removeItem("temperatureWarnings");
            }

            try {
                await axios.put(
                    notificationSettingsUrl,
                    this.settings
                );

                localStorage.setItem(
                    "notificationSettings",
                    JSON.stringify(this.settings)
                );

                this.message = "Indstillinger gemt";
            } catch (error) {
                console.log("Kunne ikke gemme settings til API:", error);

                this.message = "Kunne ikke gemme indstillinger i API";
            }
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
                        Authorization: `Bearer ${this.token}`
                    }
                }
            );
        },

        enforceAdminAccess() {
            if (this.role !== "Admin") {
                window.location.href = "Dashboard.html";
            }
        },

        async updateFillNeeded(id, fillLevel) {
            try {
                const response = await axios.put(
                    `${apiBaseUrl}/api/Notification/${id}/UpdateFillNeeded?fill=${encodeURIComponent(fillLevel)}`,
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (response.status === 200) {
                    this.message = "Påfyldningsniveau opdateret";
                    return response.data;
                }
            } catch (error) {
                console.log("Error updating fill level:", error);

                if (error.response && error.response.status === 400) {
                    this.message = "Fejl ved opdatering af påfyldningsniveau";
                } else {
                    this.message = "Der opstod en fejl";
                }
            }
        }
    },

    async mounted() {
        this.enforceAdminAccess();
        await this.loadSettings();
        await this.getLanguage();
    }

}).mount("#app");

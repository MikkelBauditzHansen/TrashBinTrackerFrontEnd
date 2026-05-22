const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net";
const notificationUrl = `${apiBaseUrl}/api/Notification`;
const languageUrl = `${apiBaseUrl}/api/Language`;

Vue.createApp({

    data() {

        return {

            notifications: [],

            temperatureWarnings: JSON.parse(
                localStorage.getItem("temperatureWarnings")

            ) || [],
            username: localStorage.getItem("username"),
            jwtToken: localStorage.getItem("token"),
            selectedLanguage: "Danish"
            
        };
    },

    methods: {

        async getNotifications() {

            try {

                const res = await axios.get(
                    notificationUrl
                );

                this.notifications = res.data;

            } catch (error) {

                console.log(error);
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
                        Authorization: `Bearer ${this.jwtToken}`
                    }
                }
            );
        },

        async markAsRead(id) {

            try {

                await axios.delete(
                    `${notificationUrl}/${id}`
                );

                this.notifications =
                    this.notifications.filter(

                        n => n.notificationId !== id
                    );

            } catch (error) {

                console.log(error);
            }
        },

        removeTemperatureWarning(binId) {

            this.temperatureWarnings =
                this.temperatureWarnings.filter(

                    w => w.binId !== binId
                );

            localStorage.setItem(

                "temperatureWarnings",

                JSON.stringify(
                    this.temperatureWarnings
                )
            );
        },
        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "Login.html";
        }
    },

    mounted() {

        this.getNotifications();
        this.getLanguage();

        setInterval(() => {

            this.getNotifications();

            this.temperatureWarnings = JSON.parse(
                localStorage.getItem("temperatureWarnings")
            ) || [];

        }, 3000);
    }

}).mount("#app");

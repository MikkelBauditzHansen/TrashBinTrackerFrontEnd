const notificationUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net/api/Notification";

Vue.createApp({

    data() {

        return {

            notifications: [],

            temperatureWarnings: JSON.parse(
                localStorage.getItem("temperatureWarnings")

            ) || [],
            username: localStorage.getItem("username")
            
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

        setInterval(() => {

            this.getNotifications();

            this.temperatureWarnings = JSON.parse(
                localStorage.getItem("temperatureWarnings")
            ) || [];

        }, 3000);
    }

}).mount("#app");

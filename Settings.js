const notificationUrl =
    "https://localhost:7159/api/Notification";

Vue.createApp({

    data() {

        return {

            receiveBinFull: true,
            telegramEnabled: true
        };
    },

    methods: {

        // Hent status fra backend
        async getSettings() {

            try {

                const binRes =
                    await axios.get(
                        `${notificationUrl}/binfull-status`
                    );

                const telegramRes =
                    await axios.get(
                        `${notificationUrl}/telegram-status`
                    );

                this.receiveBinFull =
                    binRes.data;

                this.telegramEnabled =
                    telegramRes.data;

            } catch (error) {

                console.log(error);
            }
        },


        // Toggle bin full notifications
        async toggleBinFull() {

            try {

                const res =
                    await axios.put(
                        `${notificationUrl}/toggle-binfull`
                    );

                this.receiveBinFull =
                    res.data;

            } catch (error) {

                console.log(error);
            }
        },


        // Toggle telegram
        async toggleTelegram() {

            try {

                const res =
                    await axios.put(
                        `${notificationUrl}/toggle-telegram`
                    );

                this.telegramEnabled =
                    res.data;

            } catch (error) {

                console.log(error);
            }
        }
    },

    mounted() {

        this.getSettings();
    }

}).mount("#app");
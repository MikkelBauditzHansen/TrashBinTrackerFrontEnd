const notificationUrl = "https://localhost:7159/api/Notification";

Vue.createApp({
    data() {
        return {
            notifications: []
        };
    },

    methods: {

        async getNotifications() {
            const res = await axios.get(notificationUrl);
            this.notifications = res.data;
        },

        async markAsRead(id) {
            await axios.delete(`${notificationUrl}/${id}`);

            // fjern lokalt uden refresh
            this.notifications = this.notifications.filter(n => n.notificationId !== id);
        }

    },

    mounted() {
        this.getNotifications();
    }

}).mount("#app");

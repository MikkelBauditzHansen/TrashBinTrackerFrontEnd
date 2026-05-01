const baseUrl = "https://localhost:7159/api/Notification";

Vue.createApp({
    data() {
        return {
            Nostifacations: [],
            newNostifacation: {
                notificationMessage: "",
                trashLevel: 0,
                trashCanID: 0,
                notificationId: 100
            },
            message: "",
            error: ""
        };
    },

    methods: {
        async getAllNofis() {
            try {
                const response = await axios.get(baseUrl);
                this.Nostifacations = response.data;
                this.error = "";
            } catch (err) {
                this.error = "Kunne ikke hente data";
            }
        },

       
       
    },

    mounted() {
        this.getAllNofis();
    }
}).mount("#app");

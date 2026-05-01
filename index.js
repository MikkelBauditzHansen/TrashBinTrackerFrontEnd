const baseUrl = "https://localhost:7159/api/TrashBinTracker";

Vue.createApp({
    data() {
        return {
        return {
            bins: [],
            showForm: false,

            newBin: {
                name: "",
                wasteType: "",
                location: "",
                fillLevel: 100
            },

            message: "",
            error: ""
        };
    },

    methods: {

        toggleForm() {
            this.showForm = !this.showForm;
            this.message = "";
            this.error = "";
        },

        async getAllBins() {
            try {
                const response = await axios.get(baseUrl);
                this.bins = response.data;
            } catch (err) {
                this.error = "Kunne ikke hente data";
            }
        },

        async addBin() {
            try {
                const response = await axios.post(baseUrl, this.newBin);

                this.bins.push(response.data);

                this.newBin = {
                    name: "",
                    wasteType: "",
                    location: "",
                    fillLevel: 0
                };

                this.message = "Oprettet!";
                this.message = "Oprettet!";
                this.error = "";

                this.showForm = false;

            } catch (err) {
                this.message = "";
                this.error = err.response?.data || "Fejl i forbindelse til API";
            }
        },

        getFillText(level) {
            if (level < 30) return "Lav";
            if (level < 70) return "Halvfuld";
            return "Fuld";
        },

        getBarColor(level) {
            if (level < 30) return "bg-success";
            if (level < 70) return "bg-warning";
            return "bg-danger";
        },

        getTextColor(level) {
            if (level < 30) return "text-success";
            if (level < 70) return "text-warning";
            return "text-danger";
        },

        formatDate(date) {
            if (!date) return "Ukendt";
            return new Date(date).toLocaleDateString("da-DK");
        },

        translateWaste(type) {
            switch(type) {
                case "General": return "Restaffald";
                case "Paper": return "Papir";
                case "Organic": return "Madaffald";
                case "Metal": return "Metal";
                default: return type;
            }
        }
    },

    mounted() {
        this.getAllBins();
    }

}).mount("#app");

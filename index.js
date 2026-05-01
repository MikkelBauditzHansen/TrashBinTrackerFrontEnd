const baseUrl = "https://localhost:7159/api/TrashBinTracker";

Vue.createApp({
    data() {
        return {
            bins: [],
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
        async getAllBins() {
            try {
                const response = await axios.get(baseUrl);
                this.bins = response.data;
                this.error = "";
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
                this.error = "";
            } catch (err) {
                this.message = "";

                if (err.response) {
                    this.error = err.response.data;
                } else {
                    this.error = "Fejl i forbindelse til API";
                }
            }
        },

        getFillText(level) {
            if (level < 30) return "Lav";
            if (level < 80) return "Halv fuld";
            return "Fuld";
        },

        getBarColor(level) {
            if (level < 30) return "bg-success";
            if (level < 80) return "bg-warning";
            return "bg-danger";
        },

        getTextColor(level) {
            if (level < 30) return "text-success";
            if (level < 80) return "text-warning";
            return "text-danger";
        },

        translateWaste(type) {
            switch (type) {
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

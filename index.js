const baseUrl = "https://localhost:7159/api/TrashBinTracker";

Vue.createApp({
    data() {
        return{
            bins: [],
            newBin: {
                name: "",
                wasteType: "",
                location: "",
                fillLevel: 0
            },
            message: "",
            error: ""
        };
    },

    methods: {
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

                this.message = "oprettet!";
                this.error = "";
            } catch (err){
                this.message = "";

                if (err.response){
                    this.error = err.response.data;
                } else{
                    this.error = "fejl i forbindelse til API";
                }
            }
        }
    },
    
}).mount("#app");
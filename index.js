const baseUrl = "https://localhost:7159/api/TrashBinTracker";
const locationUrl = "https://localhost:7159/api/Location";

Vue.createApp({
    data() {
        return {
            bins: [],
            locations: [],
            newLocation: "",
            showForm: false,

            newBin: {
                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            },

            editId: null,
            editBin: {
                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            },

            message: "",
            error: ""
        };
    },

    methods: {

        toggleForm() {
            this.showForm = !this.showForm;
        },

        async getAllBins() {
            const res = await axios.get(baseUrl);
            this.bins = res.data;
        },

        async getLocations() {
            const res = await axios.get(locationUrl);
            this.locations = res.data;
        },

        async addBin() {
            const res = await axios.post(baseUrl, this.newBin);
            this.bins.push(res.data);

            this.newBin = {
                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            };

            this.showForm = false;
        },

        async addLocation() {
            if (!this.newLocation) return;

            const res = await axios.post(locationUrl, {
                name: this.newLocation,
                isIndoor: false
            });

            this.locations.push(res.data);

            // auto vælg ny
            this.newBin.locationId = res.data.id;

            this.newLocation = "";
        },

        async updateLocation(loc) {
            await axios.put(`${locationUrl}/${loc.id}`, loc);
        },

        async deleteLocation(id) {
            try {
                await axios.delete(`${locationUrl}/${id}`);
                this.locations = this.locations.filter(l => l.id !== id);
            } catch (err) {
                alert(err.response?.data || "Kan ikke slette lokation");
            }
        },

        startEdit(bin) {
            this.editId = bin.id;
            this.editBin = { ...bin };
        },

        cancelEdit() {
            this.editId = null;
        },

        async saveEdit(id) {
            const res = await axios.put(`${baseUrl}/${id}`, this.editBin);

            const index = this.bins.findIndex(b => b.id === id);
            this.bins[index] = res.data;

            this.editId = null;
        },

        async deleteBin(bin) {
            if (!confirm("Slet?")) return;

            await axios.delete(`${baseUrl}/${bin.id}`);
            this.bins = this.bins.filter(b => b.id !== bin.id);
        },

        getLocationName(id) {
            const loc = this.locations.find(l => l.id === id);
            return loc ? loc.name : "Ukendt";
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
        this.getLocations();
    }

}).mount("#app");

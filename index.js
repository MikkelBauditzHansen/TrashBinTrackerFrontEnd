const baseUrl = "https://localhost:7159/api/TrashBinTracker";
const locationUrl = "https://localhost:7159/api/Location";
const notificationUrl = "https://localhost:7159/api/Notification";

Vue.createApp({
    data() {
        return {
            bins: [],
            locations: [],
            notifications: [],
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
            }
        };
    },

    computed: {
        latestNotifications() {
            return this.notifications
                .slice()
                .sort((a, b) => b.notificationId - a.notificationId)
                .slice(0, 3);
        }
    },

    methods: {

        toggleForm() {
            this.showForm = !this.showForm;
        },

        // ---------------- BINS ----------------
        async getAllBins() {
            const res = await axios.get(baseUrl);
            this.bins = res.data;
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
        async emptyBin(bin) {
    const updatedBin = {
        ...bin,
        fillLevel: 0
    };

    const res = await axios.put(`${baseUrl}/${bin.id}`, updatedBin);

    const index = this.bins.findIndex(b => b.id === bin.id);
    this.bins[index] = res.data;
},

formatDate(date) {
    if (!date) {
        return "Ikke registreret";
    }

    return new Date(date).toLocaleString("da-DK");
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

        startEdit(bin) {
            this.editId = bin.id;
            this.editBin = { ...bin };
        },

        cancelEdit() {
            this.editId = null;
        },

        // ---------------- LOCATIONS ----------------
        async getLocations() {
            const res = await axios.get(locationUrl);
            this.locations = res.data;
        },

        async addLocation() {
            if (!this.newLocation) return;

            const res = await axios.post(locationUrl, {
                name: this.newLocation,
                isIndoor: false
            });

            this.locations.push(res.data);
            this.newBin.locationId = res.data.id;
            this.newLocation = "";
        },

        async updateLocation(loc) {
            await axios.put(`${locationUrl}/${loc.id}`, loc);
        },

        async deleteLocation(id) {
            await axios.delete(`${locationUrl}/${id}`);
            this.locations = this.locations.filter(l => l.id !== id);
        },

        // ---------------- NOTIFICATIONS ----------------
        async getNotifications() {
            const res = await axios.get(notificationUrl);
            this.notifications = res.data;
        },
        

        getLocationName(id) {
            const loc = this.locations.find(l => l.id === id);
            return loc ? loc.name : "Ukendt";
        },
async increaseFill(bin) {

    let newLevel = bin.fillLevel + 10;
    if (newLevel > 100) newLevel = 100;

    const updatedBin = {
        ...bin,
        fillLevel: newLevel
    };
    

    const res = await axios.put(`${baseUrl}/${bin.id}`, updatedBin);

    const index = this.bins.findIndex(b => b.id === bin.id);
    this.bins[index] = res.data;

    // 🔥 kun refresh bins (ikke notifikationer her)
    await this.getNotifications();
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
        this.getNotifications();
         setInterval(() => {
        this.getNotifications();
    }, 3000);
    }

}).mount("#app");

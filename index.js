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
            },

            jwtToken: localStorage.getItem("token"),
            role: localStorage.getItem("role"),
            username: localStorage.getItem("username"),
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
        authConfig() {

            return {
                headers: {
                    Authorization: `Bearer ${this.jwtToken}`
                }
            };
        },

        toggleForm() {
            this.showForm = !this.showForm;
        },

        // ---------------- BINS ----------------
        async getAllBins() {
            const res = await axios.get(baseUrl, this.authConfig());
            this.bins = res.data;
        },

        async addBin() {
            const res = await axios.post(baseUrl, this.newBin, this.authConfig());
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

            const res = await axios.put(`${baseUrl}/${bin.id}`, updatedBin, this.authConfig());

            const index = this.bins.findIndex(b => b.id === bin.id);
            this.bins[index] = res.data;
        },

        formatDate(date) {
            if (!date) {
                return "Ikke registreret";
            }

            return new Date(date).toLocaleString("da-DK");
        },

        startEdit(bin) {

            this.editId = bin.id;

            this.editBin = {
                id: bin.id,
                name: bin.name,
                wasteType: bin.wasteType,
                locationId: bin.locationId,
                fillLevel: bin.fillLevel
            };
        },

        cancelEdit() {

            this.editId = null;
        },
        async saveEdit(id) {

            try {

                const updatedBin = {
                    id: id,
                    name: this.editBin.name,
                    wasteType: this.editBin.wasteType,
                    locationId: this.editBin.locationId,
                    fillLevel: this.editBin.fillLevel
                };

                const res = await axios.put(
                    `${baseUrl}/${id}`,
                    updatedBin,
                    this.authConfig()
                );

                const index = this.bins.findIndex(
                    b => b.id === id
                );

                this.bins[index] = res.data;

                this.editId = null;

            }

            catch (error) {

                console.error(error);

                alert("Error updating trash bin");
            }
        }, async deleteBin(bin) {

            if (!confirm("Slet?")) return;

            try {

                await axios.delete(
                    `${baseUrl}/${bin.id}`,
                    this.authConfig()
                );

                this.bins = this.bins.filter(b => b.id !== bin.id);

            }

            catch (error) {

                console.error(error);

                alert("Error deleting trash bin");
            }
        },

        // ---------------- LOCATIONS ----------------
        async getLocations() {
            const res = await axios.get(locationUrl, this.authConfig());
            this.locations = res.data;
        },

        async addLocation() {
            if (!this.newLocation) return;

            const res = await axios.post(locationUrl, {
                name: this.newLocation,
                isIndoor: false
            }, this.authConfig());

            this.locations.push(res.data);
            this.newBin.locationId = res.data.id;
            this.newLocation = "";
        },

        async updateLocation(loc) {
            await axios.put(`${locationUrl}/${loc.id}`, loc, this.authConfig());
        },

        async deleteLocation(id) {
            await axios.delete(`${locationUrl}/${id}`, this.authConfig());
            this.locations = this.locations.filter(l => l.id !== id);
        },

        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("username");

            window.location.href = "login.html";
        },

        // ---------------- NOTIFICATIONS ----------------
        async getNotifications() {
            const res = await axios.get(notificationUrl, this.authConfig());
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


            const res = await axios.put(`${baseUrl}/${bin.id}`, updatedBin, this.authConfig());

            const index = this.bins.findIndex(b => b.id === bin.id);
            this.bins[index] = res.data;

            //  kun refresh bins (ikke notifikationer her)
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

        if (!this.jwtToken) {

            window.location.href = "login.html";
            return;
        }

        this.getAllBins();
        this.getLocations();
        this.getNotifications();

        setInterval(() => {

            this.getNotifications();

        }, 3000);
    }

}).mount("#app");
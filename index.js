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
            auth: {
                username: "",
                password: ""
            },
            authMessage: "",
            jwtToken: "",
            role: null,
            loggedIn: false,
            message: "",

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

            authurl: "https://localhost:7159/api/auth/login",
           






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

        login() {
            axios.post(this.authurl, this.auth)
                .then(response => {
                    this.jwtToken = response.data.token;
                    this.role = response.data.role;
                    this.loggedIn = true;
                    this.authMessage = "Authentication successful";
                    this.getAllBins();
                    this.getLocations();
                    this.getNotifications();
                }).catch(ex => {
                    this.authMessage = "Authentication failed - " + ex.message;
                });
        },
        authConfig() {
            const config = {};
            if (this.jwtToken) {
                config.headers = {
                    Authorization: `Bearer ${this.jwtToken}`
                };
            }
            return config;
        },
        logout() {
            this.jwtToken = null;
            this.role = null;
            this.loggedIn = false;
            this.auth = { username: "", password: "" };
            this.bins = [];
            this.message = null;
            this.authMessage = "Logged out successfully";
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

        async saveEdit(id) {
            const res = await axios.put(`${baseUrl}/${id}`, this.editBin, this.authConfig());

            const index = this.bins.findIndex(b => b.id === id);
            this.bins[index] = res.data;

            this.editId = null;
        },

        async deleteBin(bin) {
            if (!confirm("Slet?")) return;

            await axios.delete(`${baseUrl}/${bin.id}`, this.authConfig());
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
        this.getLocations();
        this.getNotifications();
        setInterval(() => {
            this.getNotifications();
        }, 3000);
    }

}).mount("#app");
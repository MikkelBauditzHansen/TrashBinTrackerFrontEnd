const baseUrl = "https://localhost:7159/api/TrashBinTracker";
const locationUrl = "https://localhost:7159/api/Location";
const notificationUrl = "https://localhost:7159/api/Notification";
const weatherUrl = "https://localhost:7159/api/Weather";

Vue.createApp({

    data() {
        return {

            bins: [],
            locations: [],
            notifications: [],

            weather: null,
            originalWeather: null,

            temperatureWarnings: [],
            temperatureNotificationsEnabled: true,

            testTemperature: 22,

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
            username: localStorage.getItem("username")
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

        // ---------------- AUTH ----------------

        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "login.html";
        },

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

        // ---------------- WEATHER ----------------

        async getWeather() {

            try {

                const res = await axios.get(weatherUrl);

                const data = res.data;

                const now = new Date();

                let currentIndex = 0;

                for (let i = 0; i < data.hourly.time.length; i++) {

                    const weatherTime =
                        new Date(data.hourly.time[i]);

                    if (
                        weatherTime.getHours() ===
                        now.getHours()
                    ) {

                        currentIndex = i;
                        break;
                    }
                }

                this.weather = {

                    temperature:
                        data.hourly.temperature_2m[currentIndex],

                    precipitation:
                        data.hourly.precipitation[currentIndex],

                    rain:
                        data.hourly.rain[currentIndex],

                    showers:
                        data.hourly.showers[currentIndex],

                    snowfall:
                        data.hourly.snowfall[currentIndex],

                    time:
                        data.hourly.time[currentIndex]
                };

                this.originalWeather = {
                    ...this.weather
                };

                this.checkTemperatureWarnings();

            } catch (error) {

                console.log(
                    "Fejl ved hentning af vejr:",
                    error
                );
            }
        },

        setTestWeather() {

            if (!this.weather) {
                return;
            }

            this.weather.temperature =
                Number(this.testTemperature);

            this.checkTemperatureWarnings();
        },

        resetWeather() {

            if (!this.originalWeather) {
                return;
            }

            this.weather = {
                ...this.originalWeather
            };

            this.checkTemperatureWarnings();
        },

        // ---------------- TEMPERATURE WARNINGS ----------------

        checkTemperatureWarnings() {

            if (
                !this.weather ||
                this.bins.length === 0 ||
                this.locations.length === 0
            ) {
                return;
            }

            this.temperatureWarnings = [];

            for (const bin of this.bins) {

                const location = this.locations.find(
                    l => Number(l.id) === Number(bin.locationId)
                );

                if (!location) {

                    console.log(
                        "Ingen location fundet:",
                        bin
                    );

                    continue;
                }

                const isFoodWaste =
                    bin.wasteType === "Organic" ||
                    bin.wasteType === "Madaffald" ||
                    bin.wasteType === "Food" ||
                    bin.wasteType === 2;

                const isOutdoor =
                    location.isIndoor === false ||
                    location.isIndoor === "false";

                const tempOk =
                    Number(this.weather.temperature) > 20;

                const fillOk =
                    Number(bin.fillLevel) >= 50;

                console.log("TJEK:", {

                    name: bin.name,

                    wasteType: bin.wasteType,

                    fillLevel: bin.fillLevel,

                    temperature: this.weather.temperature,

                    location: location.name,

                    isIndoor: location.isIndoor,

                    isFoodWaste,

                    isOutdoor,

                    tempOk,

                    fillOk
                });

                if (
                    isFoodWaste &&
                    isOutdoor &&
                    tempOk &&
                    fillOk
                ) {

                    this.temperatureWarnings.push({

                        binId: bin.id,

                        binName: bin.name,

                        locationName: location.name,

                        temperature: this.weather.temperature,

                        fillLevel: bin.fillLevel
                    });
                }
            }

            localStorage.setItem(

                "temperatureWarnings",

                JSON.stringify(
                    this.temperatureWarnings
                )
            );

            console.log(
                "Warnings:",
                this.temperatureWarnings
            );

            if (this.temperatureWarnings.length > 0) {

                this.playWarningSound();
            }
        },

        playWarningSound() {

            const audio = new Audio(
                "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
            );

            audio.play().catch(() => {

                console.log(
                    "Kunne ikke afspille lyd"
                );
            });
        },

        isTemperatureWarningBin(id) {

            return this.temperatureWarnings.some(
                w => w.binId === id
            );
        },

        // ---------------- BINS ----------------

        async getAllBins() {

            const res = await axios.get(
                baseUrl,
                this.authConfig()
            );

            this.bins = res.data;

            this.checkTemperatureWarnings();
        },

        async addBin() {

            const res = await axios.post(
                baseUrl,
                this.newBin,
                this.authConfig()
            );

            this.bins.push(res.data);

            this.newBin = {

                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            };

            this.showForm = false;

            this.checkTemperatureWarnings();
        },

        async emptyBin(bin) {

            const res = await axios.put(

                `${baseUrl}/${bin.id}/empty`,

                null,

                this.authConfig()
            );

            const index = this.bins.findIndex(
                b => b.id === bin.id
            );

            if (index !== -1) {

                this.bins[index] = res.data;
            }

            this.checkTemperatureWarnings();
        },

        async saveEdit(id) {

            const res = await axios.put(

                `${baseUrl}/${id}`,

                this.editBin,

                this.authConfig()
            );

            const index = this.bins.findIndex(
                b => b.id === id
            );

            this.bins[index] = res.data;

            this.editId = null;

            this.checkTemperatureWarnings();
        },

        async deleteBin(bin) {

            if (!confirm("Slet?")) {
                return;
            }

            await axios.delete(

                `${baseUrl}/${bin.id}`,

                this.authConfig()
            );

            this.bins = this.bins.filter(
                b => b.id !== bin.id
            );

            this.checkTemperatureWarnings();
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

            const res = await axios.get(
                locationUrl
            );

            this.locations = res.data;

            this.checkTemperatureWarnings();
        },

        async addLocation() {

            if (!this.newLocation) {
                return;
            }

            const res = await axios.post(

                locationUrl,

                {
                    name: this.newLocation,
                    isIndoor: false
                },

                this.authConfig()
            );

            this.locations.push(res.data);

            this.newBin.locationId =
                res.data.id;

            this.newLocation = "";

            this.checkTemperatureWarnings();
        },

        async updateLocation(loc) {

            await axios.put(

                `${locationUrl}/${loc.id}`,

                loc,

                this.authConfig()
            );

            this.checkTemperatureWarnings();
        },

        async deleteLocation(id) {

            await axios.delete(

                `${locationUrl}/${id}`,

                this.authConfig()
            );

            this.locations =
                this.locations.filter(
                    l => l.id !== id
                );

            this.checkTemperatureWarnings();
        },

        // ---------------- NOTIFICATIONS ----------------

        async getNotifications() {

            const res = await axios.get(

                notificationUrl,

                this.authConfig()
            );

            this.notifications = res.data;
        },

        async markAsRead(id) {

            await axios.delete(

                `${notificationUrl}/${id}`,

                this.authConfig()
            );

            this.notifications =
                this.notifications.filter(

                    n => n.notificationId !== id
                );
        },

        // ---------------- HELPERS ----------------

        getLocationName(id) {

            const loc = this.locations.find(
                l => l.id === id
            );

            return loc
                ? loc.name
                : "Ukendt";
        },

        async increaseFill(bin) {

            let newLevel =
                bin.fillLevel + 10;

            if (newLevel > 100) {
                newLevel = 100;
            }

            const updatedBin = {

                ...bin,

                fillLevel: newLevel
            };

            const res = await axios.put(

                `${baseUrl}/${bin.id}`,

                updatedBin,

                this.authConfig()
            );

            const index = this.bins.findIndex(
                b => b.id === bin.id
            );

            this.bins[index] = res.data;

            await this.getNotifications();

            this.checkTemperatureWarnings();
        },

        goToDetails(binId) {

            window.location.href =
                `History.html?binId=${binId}`;
        },

        formatDate(date) {

            if (!date) {
                return "Ikke registreret";
            }

            return new Date(date)
                .toLocaleString("da-DK");
        },

        getFillText(level) {

            if (level < 30) {
                return "Lav";
            }

            if (level < 70) {
                return "Halvfuld";
            }

            return "Fuld";
        },

        getBarColor(level) {

            if (level < 30) {
                return "bg-success";
            }

            if (level < 70) {
                return "bg-warning";
            }

            return "bg-danger";
        },

        getTextColor(level) {

            if (level < 30) {
                return "text-success";
            }

            if (level < 70) {
                return "text-warning";
            }

            return "text-danger";
        },

        translateWaste(type) {

            switch (type) {

                case "General":
                    return "Restaffald";

                case "Paper":
                    return "Papir";

                case "Organic":
                    return "Madaffald";

                case "Metal":
                    return "Metal";

                default:
                    return type;
            }
        }
    },

    async mounted() {

        await this.getAllBins();

        await this.getLocations();

        await this.getNotifications();

        await this.getWeather();

        this.checkTemperatureWarnings();

        setInterval(() => {

            this.getNotifications();

        }, 3000);
        setInterval(() => {

            this.getAllBins();

        }, 5000);

        setInterval(async () => {

            await this.getWeather();

            this.checkTemperatureWarnings();

        }, 3600000);
    }

}).mount("#app");
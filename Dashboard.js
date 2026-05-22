const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net";
const baseUrl = `${apiBaseUrl}/api/TrashBinTracker`;
const locationUrl = `${apiBaseUrl}/api/Location`;
const notificationUrl = `${apiBaseUrl}/api/Notification`;
const weatherUrl = `${apiBaseUrl}/api/Weather`;
const telegramTemperatureUrl = `${apiBaseUrl}/api/Telegram/temperature-test`;
const languageUrl = `${apiBaseUrl}/api/Language`;
const sensorOfflineTimeoutMs = 15000;

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

            apiError: "",

            jwtToken: localStorage.getItem("token"),
            role: localStorage.getItem("role"),
            username: localStorage.getItem("username"),
            selectedLanguage: "Danish"
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

        async getLanguage() {

            const res = await axios.get(
                languageUrl
            );

            this.selectedLanguage = res.data;
        },

        async updateLanguage() {

            await axios.post(
                languageUrl,
                JSON.stringify(this.selectedLanguage),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.jwtToken}`
                    }
                }
            );

            console.log(
                "Language changed to:",
                this.selectedLanguage
            );
        },

        // ---------------- AUTH ----------------

        logout() {

            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "Login.html";
        },

        authConfig() {

            return {
                headers: {
                    Authorization: `Bearer ${this.jwtToken}`
                }
            };
        },

        handleApiError(error, fallbackMessage) {

            this.apiError = fallbackMessage;
            console.error(fallbackMessage, error);
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

                await this.checkTemperatureWarnings();

            } catch (error) {

                console.log(
                    "Fejl ved hentning af vejr:",
                    error
                );
            }
        },

async setTestWeather() {

    if (!this.weather) {
        return;
    }

    this.weather.temperature =
        Number(this.testTemperature);

    await this.checkTemperatureWarnings();
},
async setActiveSensorBin(bin) {

    try {
        await axios.put(
            `${baseUrl}/${bin.id}/active-sensor`,
            null,
            this.authConfig()
        );
    } catch (error) {
        this.handleApiError(
            error,
            "Kunne ikke vælge aktiv sensor."
        );

        return;
    }

    for (const b of this.bins) {
        b.isActiveSensorBin = false;
    }

    const index = this.bins.findIndex(
        b => b.id === bin.id
    );

    if (index !== -1) {
        this.bins[index].isActiveSensorBin = true;
    }

    this.apiError = "";
},
async resetWeather() {

    if (!this.originalWeather) {
        return;
    }

    this.weather = {
        ...this.originalWeather
    };

    await this.checkTemperatureWarnings();
},

        // ---------------- TEMPERATURE WARNINGS ----------------

        async checkTemperatureWarnings() {

            const settings = this.getSettings();

    if(!settings.temperatureNotifications){

        this.temperatureWarnings=[];

        localStorage.setItem(
            "temperatureWarnings",
            JSON.stringify([])
        );

        return;
    }

    if (
        !this.weather ||
        this.bins.length === 0 ||
        this.locations.length === 0
    ) {
        return;
    }

            this.temperatureWarnings = [];
            const sentLevels =
                this.getSentTemperatureWarningLevels();

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

                    const settings=this.getSettings();

if(
settings.temperatureNotifications &&
settings.telegramEnabled
){

await this.sendTemperatureWarningForLevel(
    bin,
    sentLevels
);

}
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

        markTempAsRead(binId) {

            this.temperatureWarnings =
                this.temperatureWarnings.filter(
                    w => w.binId !== binId
                );

            localStorage.setItem(
                "temperatureWarnings",
                JSON.stringify(this.temperatureWarnings)
            );
        },

        getSentTemperatureWarningLevels() {

            try {
                return JSON.parse(
                    localStorage.getItem("sentTemperatureWarningLevels")
                ) || {};
            } catch {
                return {};
            }
        },

        saveSentTemperatureWarningLevels(sentLevels) {

            localStorage.setItem(
                "sentTemperatureWarningLevels",
                JSON.stringify(sentLevels)
            );
        },

        resetSentTemperatureWarningLevels(bin) {

            const sentLevels =
                this.getSentTemperatureWarningLevels();

            const binKey =
                String(bin.id);

            if (!sentLevels[binKey]) {
                return;
            }

            sentLevels[binKey] =
                sentLevels[binKey].filter(
                    level => Number(level) <= Number(bin.fillLevel)
                );

            if (sentLevels[binKey].length === 0) {
                delete sentLevels[binKey];
            }

            this.saveSentTemperatureWarningLevels(sentLevels);
        },

        async sendTemperatureWarningForLevel(bin, sentLevels) {

            const fillLevel =
                Number(bin.fillLevel);

            const binKey =
                String(bin.id);

            if (!sentLevels[binKey]) {
                sentLevels[binKey] = [];
            }

            if (sentLevels[binKey].includes(fillLevel)) {
                return;
            }

            await axios.post(
                telegramTemperatureUrl,
                {
                    binName: bin.name || "Madaffald",
                    fillLevel,
                    temperature: Number(this.weather.temperature)
                },
                this.authConfig()
            );

            sentLevels[binKey].push(fillLevel);
            this.saveSentTemperatureWarningLevels(sentLevels);
        },

        // ---------------- BINS ----------------
parseSensorReadingDate(value){

    if(!value){
        return null;
    }

    const text =
        String(value);

    const hasTimeZone =
        /z$|[+-]\d{2}:\d{2}$/i.test(text);

    return new Date(hasTimeZone ? text : `${text}Z`);
},
isSensorOffline(bin){

    if(!bin.lastSensorReading){
        return true;
    }

    const lastReading =
        this.parseSensorReadingDate(bin.lastSensorReading);

    if(!lastReading || Number.isNaN(lastReading.getTime())){
        return true;
    }

    const now = new Date();

    const diffMs =
        now - lastReading;

    return diffMs >= sensorOfflineTimeoutMs;
},
isSensorOnline(bin){

    if(!bin.lastSensorReading){
        return false;
    }

    const lastReading =
        this.parseSensorReadingDate(bin.lastSensorReading);

    if(!lastReading || Number.isNaN(lastReading.getTime())){
        return false;
    }

    const now = new Date();

    const diffMs =
        now - lastReading;

    return diffMs < sensorOfflineTimeoutMs;
},
        async getAllBins() {
if (this.editId !== null) {
        return;
    }
            const res = await axios.get(
                baseUrl,
                this.authConfig()
            );

            this.bins = res.data;

            await this.checkTemperatureWarnings();
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

            await this.checkTemperatureWarnings();
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

                this.bins.splice(index, 1, res.data);
            }

            this.resetSentTemperatureWarningLevels(res.data);

            await this.checkTemperatureWarnings();
        },

        async saveEdit(id) {

            const previousBin = this.bins.find(
                b => b.id === id
            );

            const res = await axios.put(

                `${baseUrl}/${id}`,

                this.editBin,

                this.authConfig()
            );

            const index = this.bins.findIndex(
                b => b.id === id
            );

            this.bins.splice(index, 1, res.data);

            this.editId = null;

            this.resetSentTemperatureWarningLevels(res.data);

            await this.checkTemperatureWarnings();
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

            await this.checkTemperatureWarnings();
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

            await this.checkTemperatureWarnings();
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

            await this.checkTemperatureWarnings();
        },

        async updateLocation(loc) {

            await axios.put(

                `${locationUrl}/${loc.id}`,

                loc,

                this.authConfig()
            );

            await this.checkTemperatureWarnings();
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

            await this.checkTemperatureWarnings();
        },

        // ---------------- NOTIFICATIONS ----------------
getSettings(){

return JSON.parse(
localStorage.getItem(
"notificationSettings"
)) || {

fillNotifications:true,
temperatureNotifications:true,
telegramEnabled:true

};

},
        async getNotifications() {

    const settings=this.getSettings();

    if(!settings.fillNotifications){

        this.notifications=[];

        return;
    }

    const res = await axios.get(
        notificationUrl,
        this.authConfig()
    );

    this.notifications=res.data;
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

        isFoodWaste(bin) {
    return bin.wasteType === "Organic" ||
           bin.wasteType === "Madaffald" ||
           bin.wasteType === "Food"     ||
           bin.wasteType === 2;
},

        isOutdoorBin(bin) {

            const location = this.locations.find(
                l => Number(l.id) === Number(bin.locationId)
            );

            if (!location) {
                return false;
            }

            return location.isIndoor === false ||
                location.isIndoor === "false";
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

            this.bins.splice(index, 1, res.data);

            await this.getNotifications();

            this.resetSentTemperatureWarningLevels(res.data);

            await this.checkTemperatureWarnings();
        },

        goToDetails(binId) {

            window.location.href =
                `History.html?binId=${binId}`;
        },

        formatDate(date) {

            if (!date) {
                return "Ikke registreret";
            }

            const parsedDate =
                this.parseSensorReadingDate(date);

            if (!parsedDate) {
                return "Ikke registreret";
            }

            return parsedDate.toLocaleString("da-DK");
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
        case "General": case 0: return "Restaffald";
        case "Paper":   case 1: return "Papir";
        case "Organic": case 2: return "Madaffald";
        case "Metal":   case 3: return "Metal";
        default: return type;
    }
}
},
    
    async mounted() {

        try {
            await this.getLocations();

            await this.getAllBins();

            await this.getNotifications();

            await this.getLanguage();

            await this.getWeather();

            await this.checkTemperatureWarnings();
        } catch (error) {
            this.handleApiError(
                error,
                "Kunne ikke hente data fra API'et. Tjek backend/CORS."
            );
        }

        setInterval(() => {

            this.getNotifications().catch(error => {
                this.handleApiError(
                    error,
                    "Kunne ikke hente notifikationer."
                );
            });

        }, 3000);

        setInterval(async () => {

            try {
                await this.getWeather();

                await this.checkTemperatureWarnings();
            } catch (error) {
                this.handleApiError(
                    error,
                    "Kunne ikke opdatere vejrdata."
                );
            }

        }, 3600000);
        setInterval(async () => {
        try {
            await this.getAllBins();
        } catch (error) {
            this.handleApiError(error, "Kunne ikke opdatere skraldespande.");
        }
    }, 10000);
}
}).mount("#app");

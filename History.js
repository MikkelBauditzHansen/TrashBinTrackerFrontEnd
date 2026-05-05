const baseUrl = "https://localhost:7159/api/TrashBinTracker";
const locationUrl = "https://localhost:7159/api/Location";

Vue.createApp({
    data() {
        return {
            bin: null,
            history: [],
            locations: []
        };
    },

    methods: {

        formatDate(date) {
            if (!date) return "Ukendt";
            return new Date(date).toLocaleString("da-DK");
        },

        async loadData() {
            const binId = new URLSearchParams(window.location.search).get("binId");

            if (!binId) return;

            // hent skraldespand
            const res = await axios.get(`${baseUrl}/${binId}`);
            this.bin = res.data;

            this.history = res.data.emptyHistory || [];

            // hent locations (så vi kan vise navn)
            const locRes = await axios.get(locationUrl);
            this.locations = locRes.data;
        },

        getLocationName(id) {
            const loc = this.locations.find(l => l.id === id);
            return loc ? loc.name : "Ukendt";
        }

    },

    mounted() {
        this.loadData();
    }

}).mount("#app");

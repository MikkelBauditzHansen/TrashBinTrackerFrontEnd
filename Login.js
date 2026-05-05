Vue.createApp({
    data() {
        return {
            bins: [],
            baseUrl: "https://localhost:7159/api/TrashBinTracker",
            authurl: "https://localhost:7159/api/auth/login",
            search: "",
            addata: {
                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            },
            auth: {
                username: "",
                password: ""
            },
            authMessage: "",
            jwtToken: "",
            role: null,
            loggedIn: false,
            message: "",
            updateData: {
                id: "",
                name: "",
                wasteType: "",
                locationId: "",
                fillLevel: 0
            },
            updateMessage: "",
            deleteId: "",
            deleteMessage: ""

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
                    this.getAll(); // Fetch bins immediately after successful login
                }).catch(ex => {
                    this.authMessage = "Authentication failed - " + ex.message;
                });
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
        async getAll() {
            try {
                const config = {
                    params: { search: this.search }
                };
                if (this.jwtToken) {
                    config.headers = {
                        'Authorization': `Bearer ${this.jwtToken}`
                    };
                }
                const response = await axios.get(this.baseUrl, config);
                this.bins = response.data;
            }
            catch (error) {
                console.error(error);
                alert("Error retrieving trash bins!!");
            }
        },              
          //add method
                async add() {
            if (!this.addata.name || !this.addata.wasteType || !this.addata.locationId || this.addata.fillLevel === "") {
                alert("Please fill in all fields.");
                return;
            }
            try {
                const config = {};
                if (this.jwtToken) {
                    config.headers = {
                        'Authorization': `Bearer ${this.jwtToken}`
                    };
                }
                await axios.post(this.baseUrl, this.addata, config);
                this.addata.name = "";
                this.addata.wasteType = "";
                this.addata.locationId = "";
                this.addata.fillLevel = 0;
                this.getAll(); // Refresh the list after adding
                alert("Trash bin added successfully!");
            }
            catch (error) {
                console.error(error);
                alert("Error adding trash bin: " + (error.response ? error.response.data : error.message));
            }
        },
        //update method
                async update() {
            if (!this.updateData.id || !this.updateData.name || !this.updateData.wasteType || !this.updateData.locationId || !this.updateData.fillLevel ) {
                alert("Please fill in all fields.");
                return;
            }
            const url = this.baseUrl + "/" + this.updateData.id;
            try {
                const config = {};
                if (this.jwtToken) {
                    config.headers = {
                        'Authorization': `Bearer ${this.jwtToken}`
                    };
                }
                await axios.put(url, this.updateData, config);
                this.updateData.id = "";
                this.updateData.name = "";
                this.updateData.wasteType = "";
                this.updateData.locationId = "";
                this.updateData.fillLevel = 0;
                await this.getAll(); // Refresh the list after updating
                this.updateMessage = "Trash bin updated successfully!";
            }
            catch {
                alert("error!")
            }
        },
//delete method
        async deletebin(id) {
            if (!id) {
                this.deleteMessage = "Please enter a valid trash bin ID";
                return;
            }

            try {
                const config = {};
                if (this.jwtToken) {
                    config.headers = {
                        'Authorization': `Bearer ${this.jwtToken}`
                    };
                }
                await axios.delete(`${this.baseUrl}/${id}`, config);
                this.deleteMessage = "Trash bin deleted successfully";
                this.deleteId = "";
                await this.getAll();
            } catch (error) {
                this.deleteMessage = "Error deleting trash bin - it may not exist or you don't have permission";
                console.error(error);
            }
        },

    }
}).mount("#app")

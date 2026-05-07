Vue.createApp({

    data() {
        return {

            authurl: "https://localhost:7159/api/auth/login",

            auth: {
                username: "",
                password: ""
            },

            authMessage: ""
        }
    },

    methods: {

        async login() {

            try {

                const response = await axios.post(this.authurl, this.auth);

                // save token
                localStorage.setItem("token", response.data.token);

                // save role
                localStorage.setItem("role", response.data.role);

                // save username
                localStorage.setItem("username", this.auth.username);

                // redirect
                window.location.href = "index.html";

            }

            catch (error) {

                this.authMessage = "Invalid username or password";

                console.error(error);
            }
        }
    }

}).mount("#app");
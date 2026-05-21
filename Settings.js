Vue.createApp({

data(){

return{
username:localStorage.getItem("username"),
settings:{

fillNotifications:true,
temperatureNotifications:true,
telegramEnabled:true

},

message:""

}

},

methods:{
logout(){

localStorage.removeItem("token");
localStorage.removeItem("username");
localStorage.removeItem("role");

window.location.href="Login.html";

},
save(){

localStorage.setItem(
"notificationSettings",
JSON.stringify(this.settings)
);

if(!this.settings.temperatureNotifications){

localStorage.removeItem(
"temperatureWarnings"
);

}

this.message="Indstillinger gemt ✔";

}

},

mounted(){

const saved=localStorage.getItem(
"notificationSettings"
);

if(saved){

this.settings=JSON.parse(saved);

}

}

}).mount("#app");
const notificationUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net/api/Notification";
const apiBaseUrl = "https://shstarthtml-drfseveaedgbfeac.swedencentral-01.azurewebsites.net/api";


Vue.createApp({

data(){

return{
username:localStorage.getItem("username"),
settings:{

fillNotifications:true,
temperatureNotifications:true,
telegramEnabled:true

},
newFillWatchLevel:0,
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

},

async updateFillNeeded(id, fillLevel){

try{

const token = localStorage.getItem("token");
	const response = await axios.put(
	`${apiBaseUrl}/Notification/${id}/UpdateFillNeeded?fill=${encodeURIComponent(fillLevel)}`,
	null,
	{
	headers: {
	"Authorization": `Bearer ${token}`,
	"Content-Type": "application/json"
	}
	}
	);

if(response.status === 200){

this.message = `Påfyldningsniveau opdateret ✔`;
return response.data;

}

}catch(error){

if(error.response && error.response.status === 400){

this.message = "Fejl ved opdatering af påfyldningsniveau ✗";

}else{

this.message = "Der opstod en fejl ✗";

}

console.error("Error updating fill level:", error);
throw error;

}

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

<template>
    
    <div class="profile-container">
        <!--profile card-->
        <div class="profile-card">
                <img  class="logo" src="https://th.bing.com/th/id/R.ff64d6aeb1e605f92db2085431d6dcf2?rik=WkM7xHW3ugbl5g&pid=ImgRaw&r=0" alt="">
            <div class="profile-picture">
                <button class="exit-btn">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
                <img class="prf" src="https://th.bing.com/th/id/OIP.8K2hRNwZuitbOoWEKXeGnwHaE8?rs=1&pid=ImgDetMain" alt="">
                <i class="fas fa-camera-retro edit-icon"></i>
                <span class="status-dot active"></span>

            </div>
            <div class="profile-details">
                <div class="field">
                    <label for="full-name">full-name</label>
                    <input id="full-name" type="text" v-model="profile.fullname" />
                </div>
                <div class="field">
                    <label for="profile">profile</label>
                    <input id="profile" type="text" v-model="profile.profile"  />
                </div>
                <div class="field fieldreadonly">
                    <label for="status">status</label>
                    <input id="status" type="text" v-model="profile.status" readonly/>
                </div>
                <div class="field">
                    <label for="email">email</label>
                    <input id="email" type="text" v-model="profile.email" />
                </div>
                <div class="field">
                    <label for="password">password</label>
                    <input id="password" type="text" v-model="profile.password" />
                </div>
                <div class="field">
                    <label for="datebr">Date of birth</label>
                    <input id="datebr" type="text" v-model="profile.datebr"/>
                </div>
                <div class="field">
                    <div class="phone-dialer">
                        <label for="phone">phone</label>
                        <div class="input-container">
                            <input id="phone" type="text" v-model="profile.phone"/>
                            <button class="call-btn">
                                <i class="fas fa-phone"></i>
                            </button>
                        </div>
                        <div class="keypad">
                            <button @click="addNumber('1')">1</button>
                            <button @click="addNumber('2')">2</button>
                            <button @click="addNumber('3')">3</button>
                            <button @click="addNumber('4')">4</button>
                            <button @click="addNumber('5')">5</button>
                            <button @click="addNumber('6')">6</button>
                            <button @click="addNumber('7')">7</button>
                            <button @click="addNumber('8')">8</button>
                            <button @click="addNumber('9')">9</button>
                        </div>
                </div>
            </div>
            </div>
            <div class="buttons">
                <button @click="savechanges" class="btn-save">Save</button>
                <button @click="cancelchanges" class="btn-cancel">Cancel</button>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'ConsulterProfil',
    data(){
        return {
            profile:{
                fullname: "Adel Bahri",
                profile: "Procurement manager",
                status: "Activated",
                email: "Adelbahri@tav.aero",
                password: "tav1234567",
                datebr: "12/05/1987",
                phone: ""
            }
        };
    },
    methods:{
        savechanges(){
            alert("changes saved");
        },
        cancelchanges(){
            alert("changes canceled!");
        },
        addNumber(number){
            this.profile.phone+=number;
        },
        deleteNumber(){
            this.profile.phone = this.profile.phone.slice(0,-1);
        }
    }
};
</script>
<style>
body{
    background: linear-gradient(135deg, #cacacb, #4b67ab);
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    font-family: sans-serif;
}
.logo{
    display: flex;
    opacity: 1;
    width:10;
    height: 40px;
}

.profile-container{
    padding: 20px;
    text-align: center;
}


.profile-card{
    background-color:rgba(4, 4, 12, 0.217) ;
    border-radius: 20px;
    padding: 40px;
    align-items: center;
    box-shadow: 0 15px 30px rgba(88, 62, 62, 0.1);
    text-align: center;
    width: 500px;
    height: 650px;
    padding: 30px;
    transition: transform 0.3s ease-in-out;
    
}
.exit-btn{
    position: absolute;
    bottom: 100px;
    left: 240px;
    background: none;
    border: none;
    font-size:20px;
    color: #333;
    cursor: pointer;  
    transition: transform 0.2s ease;  
}
.profile-card:hover{
    transform: scale(1.02);
}
.profile-picture{
    position: relative;
    display: inline-block;
    width: 100px;
    height: 100px;
   
}
.profile-picture img{
    border-radius: 20%;
    width: 100px;
    height: 100px;
    object-fit: cover;
}

/*deux boutons edit icon + status */
.edit-icon{
    position: absolute;
    top: 80px;
    right: 4px;
    background-color: white;
    color: #333;
    border-radius:50%;
    padding: 8px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: transform 0.2s ease;

}
.edit-icon:hover{
    transform: scale(1.1);
}
/* cercle d'activation de compte */
.status-dot{
    position: absolute;
    top: 90px;
    left: 5px;
    width: 15px;
    height: 15px;
    background-color: rgb(22,181,22);
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2 px 5px rgba(0,0,0,0.2);
}
#status{
    color: grey;
}
.field{
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    margin-top: 20px;
}
label{
    font-weight: bold;
    font-size: 15px;
    width: 100px;
    
}
input{
    width: 350px;
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
}
.buttons{
    display: flex;
    justify-content: space-between;
    width: 100%;
}
button{
    text-align: center;
    height: 40px;
    border-radius: 5px;
    padding: 10px;
    width: 50%;  
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease; 
}
button:hover{
    transform: scale(1.05);
}


.btn-save{
    background-color: #3417c9 ;
    color: white;
    font-weight: bold;
    margin-right: 10px;
}
.btn-save:hover{
    background-color: #0f4f9f;
}
.btn-cancel{
    background-color: #ec2314;
    color: white;
    font-weight: bold;

}
.btn-cancel:hover{
    background-color: darkred;
}
button:active{
    transform: scale(0.98);
    background-color: #095a7f;
}
/* style pour le clavier numérique */
.phone-dialer{
    display: flex;
    width: 350px;
    font-family:  'Poppins' sans-serif;
    text-align: center;
    align-items: center;
    justify-content: center;
}
.input-container{
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}
#phone{
    padding: 10px 10px 10px 30px;
    font-size: 18px;
    border: 2px solid #000;
    outline: none;
    width: 100%;
    border-radius: 5px;
}
.call-btn{
    position: absolute;
    left: 150px;
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px;
    transition: background-color 0.3s;
    width: 30px;
}
.call-btn:hover{
    background-color: #218838;
}
.keypad{
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
}
.keypas button{
    width: 80px;
    height: 80px;
    background-color: #000;
    color: white;
    font-size: 20px;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease;
}
.keypad button:hover{
    transform: scale(1.1);
    background-color: #444;
}
</style>
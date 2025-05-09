<template>
  <div class="profile-container">
    <div class="profile-card">
      <img
        class="logo"
        src="https://th.bing.com/th/id/R.ff64d6aeb1e605f92db2085431d6dcf2?rik=WkM7xHW3ugbl5g&pid=ImgRaw&r=0"
        alt=""
      />

      <div class="profile-picture">
        <button class="exit-btn">
          <i class="fas fa-sign-out-alt"></i>
        </button>
        <img :src="profile.profileImage" alt="Profile Image" />
        <!-- Icône de caméra pour déclencher l'upload -->
        <label for="fileInput" class="edit-icon">
          <i class="fas fa-camera"></i>
        </label>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          style="display: none"
          @change="handleImageUpload"
        />
        <div class="status-container">
          <span class="status-dot active"></span>
          <span class="status-text">Active</span>
        </div>
      </div>
      <div class="profile-details">
        <div class="field">
          <label for="full-name">Full Name</label>
          <input id="full-name" type="text" v-model="profile.fullname" />
        </div>
        <div class="field">
          <label for="datebr">Date of Birth</label>
          <input
            id="datebr"
            type="date"
            v-model="profile.dateOfBirth"
            ref="dateInput"
          />
          <i class="calendar-icon" @click="openDatePicker"></i>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="text" v-model="profile.email" />
        </div>
        <div class="field">
          <label for="address">Address</label>
          <input id="address" type="text" v-model="profile.address" />
        </div>
        <div class="field">
          <label for="profile">Profile</label>
          <input id="profile" type="text" v-model="profile.profile" />
        </div>

        <div class="field">
          <div class="phone-dialer">
            <div class="input-container">
              <label for="phone">Phone Call</label>
              <input
                id="phone"
                type="text"
                placeholder=""
                v-model="profile.phone"
              />
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
              <button @click="deleteNumber()">Del</button>
              <button @click="addNumber('0')">0</button>
            </div>
          </div>
        </div>
      </div>

      <div class="buttons">
        <button @click="saveChanges" class="btn-save">Save</button>
        <button @click="cancelchanges" class="btn-cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>
<script>
import apiServices from '../services/apiServices';
export default {
  name: 'ConsulterProfil',
  data() {
    return {
      email: this.$route.params.email,
      profile: {}
    };
  },
  async mounted() {
    const email = this.$route.params.email;
    const userProfile = await apiServices.getUserProfile(email);

    if (userProfile) {
      this.profile = { ...userProfile };
      console.log(this.profile.profileImage);
      this.initialProfile = { ...userProfile };
    }
    // on assure que dateOfBirth est bien au format YYYY-MM-DD
    this.profile.dateOfBirth = userProfile.dateOfBirth
      ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0]
      : '';
  },

  methods: {
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // Enregistrez le fichier image dans le profil
        this.profile.imageFile = file;

        // Met à jour l'URL de l'image si nécessaire (par exemple, afficher l'image immédiatement)
        this.profile.profileImage = URL.createObjectURL(file);
      }
    },

    addNumber(number) {
      // Permet d'ajouter uniquement des chiffres
      if (this.profile.phone.length < 8) {
        this.profile.phone += number;
      }
    },
    deleteNumber() {
      this.profile.phone = this.profile.phone.slice(0, -1);
    },

    /*méthode pour le calendrier */
    openDatePicker() {
      this.$refs.dateInput.showPicker(); // Ouvre le calendrier natif
    },
    async saveChanges() {
      try {
        const formData = new FormData();
        formData.append('fullname', this.profile.fullname);
        formData.append('email', this.profile.email);
        formData.append('dateOfBirth', this.profile.dateOfBirth);
        formData.append('address', this.profile.address);
        formData.append('password', this.profile.password);
        formData.append('profile', this.profile.profile);
        formData.append('phone', this.profile.phone);

        if (this.profile.imageFile) {
          formData.append('profileImage', this.profile.imageFile);
        }

        await apiServices.updateUserProfile(this.email, formData);
        alert('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile: ', error);
        alert('Failed to update profile.');
      }
    },
    cancelchanges() {
      this.profile = { ...this.initialProfile }; // Réinitialisation des données aux valeurs initiales
      this.profile.dateOfBirth = this.initialProfile.dateOfBirth
        ? new Date(this.initialProfile.dateOfBirth).toISOString().split('T')[0]
        : '';
    }
  }
};
</script>

<style scoped>
/* Conteneur principal pour centrer le formulaire */

.profile-container {
  background-color: #07337553;
  display: flex;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}


.logo {
  display: flex;
  opacity: 1;
  width: 10;
  height: 40px;
}

.profile-card {
  background-color: rgba(4, 4, 12, 0.217);
  border-radius: 20px;
  padding: 40px;
  align-items: center;
  box-shadow: 0 15px 30px rgba(88, 62, 62, 0.1);
  text-align: center;
  width: 550px;
  padding: 30px;
  transition: transform 0.3s ease-in-out;
}
.exit-btn {
  position: absolute;
  bottom: 100px;
  left: 240px;
  background: none;
  border: none;
  font-size: 20px;
  color: #052452bc;
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 20px;
}
.profile-card:hover {
  transform: scale(1.02);
}
.profile-picture {
  position: relative;
  display: inline-block;
  width: 100px;
  height: 100px;
  cursor: pointer;
}
.profile-picture img {
  border-radius: 20%;
  width: 100px;
  height: 100px;
  object-fit: cover;
}

/*deux boutons edit icon + status */
.edit-icon {
  width: 20px;
  position: absolute;
  top: 80px;
  left: 70px;
  background-color: transparent;
  color: #0d0d5bb9;
  border-radius: 50%;
  padding: 5px;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid rgba(4, 44, 105, 0.831);
}
.edit-icon i {
  color: #333;
  font-size: 16px;
}
.edit-icon:hover {
  transform: scale(1.1);
}
.staus-container {
  position: relative;
  display: inline-block;
}
/* cercle d'activation de compte */
.status-dot {
  position: absolute;
  top: 90px;
  left: 5px;
  width: 15px;
  height: 15px;
  background-color: rgb(22, 181, 22);
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
/* active account */
.status-text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  transform: translateX(-50%);
  background-color: #000;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  transition:
    opacity 0.3s,
    visibility 0.3s;
}
/* icone active  after hover*/
.status-container:hover .status-text {
  visibility: visible;
  opacity: 1;
}

.field {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  margin-top: 20px;
}
label {
  font-weight: bold;
  font-size: 15px;
  width: 100px;
}
input {
  width: 350px;
  padding: 8px;
  font-size: 16px;
  border: 1px solid black;
  border-radius: 6px;
  background-color: #7276ce22;
  transition: border-color 0.3s;
  outline: none;
  border-bottom: 2px solid;
}
.buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
button {
  text-align: center;
  margin-right: 5px;
  height: 40px;
  border-radius: 5px;
  padding: 10px;
  width: 50%;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}
button:hover {
  transform: scale(1.05);
}

.btn-save {
  background-color: #3417c9;
  color: white;
  font-weight: bold;
  margin-right: 10px;
}
.btn-save:hover {
  background-color: #0f4f9f;
}
.btn-cancel {
  background-color: #ec2314;
  color: white;
  font-weight: bold;
}
.btn-cancel:hover {
  background-color: darkred;
}
button:active {
  transform: scale(0.98);
  background-color: #095a7f;
}
/* style pour le clavier numérique */
.phone-dialer {
  display: flex;
  width: 350px;
  font-family: 'Poppins' sans-serif;
}
.input-container {
  display: flex;
  position: relative;
  align-items: start;
  gap: 5px; /* espacement entre le label et l'input */
}
#phone {
  padding: 10px;
  font-size: 18px;
  width: 250px;
  border-radius: 8px;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-left: 9px;
  gap: 10px;
}
.keypad button {
  width: 40px;
  height: 40px;
  background-color: #000;
  color: white;
  font-size: 10px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 20px;
}

.keypad button:hover {
  transform: scale(1.1);
  background-color: #020101;
}

/* calendrier input date of birth */
.calendar-icon {
  position: absolute;
  top: 10px;
  right: 25px;
  transform: translateY(-50%);
  cursor: pointer;
  color: #274a4e;
  font-size: 20px;
}
</style>

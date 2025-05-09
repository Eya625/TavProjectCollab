<template>
  <div class="card">
    <div class="pass-container">
      <div class="header">
        <img
          class="tav-logo"
          src="https://th.bing.com/th/id/R.ff64d6aeb1e605f92db2085431d6dcf2?rik=WkM7xHW3ugbl5g&pid=ImgRaw&r=0"
          alt="Logo"
        />
        <button class="logout-button" @click="exit">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <h2 class="animated-title">Set A New Password</h2>

      <!-- New Password Field -->
      <div class="form-group">
        <div class="password-field">
          <input
            :type="isPasswordVisible ? 'text' : 'password'"
            v-model="password"
            @input="checkPasswordStrength"
            @keyup.enter="savePassword"
            placeholder="Enter a New password"
          />
        </div>
        <div
          class="progress-bar"
          :style="{
            width: progressBarWidth + '%',
            backgroundColor: progressBarColor
          }"
        ></div>
      </div>

      <!-- Password Strength Criteria -->
      <ul class="validation-list">
        <li
          v-for="(criteria, index) in passwordCriteria"
          :key="index"
          :style="getCriteriaStyle(criteria.valid)"
        >
          <i :class="getIconClass(criteria.valid)"></i> {{ criteria.text }}
        </li>
      </ul>

      <!-- Confirm Password -->
      <div v-if="isMinLengthValid" class="form-group">
        <input
          class="reenterpass"
          :type="isPasswordVisible ? 'text' : 'password'"
          v-model="confirmPassword"
          @input="checkConfirmPassword"
          @keyup.enter="resetPassword"
          placeholder="Re-enter password"
        />
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          :class="{ 'active-button': isFormValid }"
          @click="resetPassword"
          :disabled="!isFormValid"
          class="save-button"
        >
          <i class="fas fa-save"></i> Save
        </button>
        <button class="cancel-button" @click="cancel">
          <i class="fas fa-times-circle"></i> Cancel
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import apiServices from '../services/apiServices';
export default {
  props: ['token'],
  data() {
    return {
      password: '',
      confirmPassword: '',
      isPasswordVisible: false
    };
  },
  mounted() {
    // Vérifier si les paramètres sont bien présents dans l'URL
    if (!this.token) {
      this.$router.push('/error'); // Vérifier uniquement `token` car `email` est parfois absent
    }
  },

  methods: {
    async resetPassword() {
      if (!this.isFormValid) {
        alert('Please fulfill all password requirements.');
        return;
      }
      try {
        const result = await apiServices.resetPassword(
          this.token,
          this.password
        );
        if (result) {
          alert('Password has been successfully reset');
          this.$router.push('/profile'); //  Redirection vers la page de connexion
        } else {
          alert('Error occurred while resetting password');
        }
      } catch (error) {
        console.error(
          'Reset Password Error:',
          error.response ? error.response.data : error
        );
        alert('An error occurred while resetting the password.');
      }
    },
    // Toggle Password Visibility
    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
    },
    // Get Icon Class for Criteria
    getIconClass(isValid) {
      return isValid ? 'fas fa-check-circle' : 'fas fa-times-circle';
    },
    // Get Styling for Criteria
    getCriteriaStyle(isValid) {
      return { color: isValid ? 'darkgreen' : '#C62828' };
    },
    // Check if Confirm Password Matches
    checkConfirmPassword() {
      return this.password === this.confirmPassword;
    },
    // Reset Form Fields
    cancel() {
      this.password = '';
      this.confirmPassword = '';
    },
    // Logout Action
    exit() {
      alert('Logout clicked');
    }
  },
  computed: {
    // Password Validation Criteria
    isMinLengthValid() {
      return this.password.length >= 8;
    },
    hasUpperCase() {
      return /[A-Z]/.test(this.password);
    },
    hasLowerCase() {
      return /[a-z]/.test(this.password);
    },
    hasNumber() {
      return /[0-9]/.test(this.password);
    },
    hasSpecialChar() {
      return /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
    },
    isFormValid() {
      return (
        this.isMinLengthValid &&
        this.hasUpperCase &&
        this.hasLowerCase &&
        this.hasNumber &&
        this.hasSpecialChar &&
        this.password === this.confirmPassword
      );
    },
    progressBarWidth() {
      let strength = 0;
      if (this.isMinLengthValid) strength += 20;
      if (this.hasUpperCase) strength += 20;
      if (this.hasLowerCase) strength += 20;
      if (this.hasNumber) strength += 20;
      if (this.hasSpecialChar) strength += 20;
      return strength;
    },
    progressBarColor() {
      if (this.progressBarWidth <= 40) return 'red';
      if (this.progressBarWidth <= 60) return 'orange';
      return 'green';
    },
    // Password Criteria List
    passwordCriteria() {
      return [
        { valid: this.isMinLengthValid, text: 'Minimum 8 characters' },
        { valid: this.hasUpperCase, text: 'At least one uppercase letter' },
        { valid: this.hasLowerCase, text: 'At least one lowercase letter' },
        { valid: this.hasNumber, text: 'At least one digit' },
        { valid: this.hasSpecialChar, text: 'At least one special character' }
      ];
    }
  }
};
</script>
<style scoped>
/* General Layout */
.card {
  margin-top: 30px;
  margin-bottom: 30px;
}

/* Card container style */
.pass-container {
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  width: 600px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  margin: auto;
  background: linear-gradient(rgba(139, 221, 231, 0.048));
}

/* Title with animated color */
.animated-title {
  font-family: 'Roboto', sans-serif;
  animation: colorChange 2s ease-in-out infinite;
  margin-bottom: 20px;
}

/* Header with logo and logout button */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px;
}
.tav-logo {
  width: 100px;
  height: 30px;
}
.logout-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-left: 70%;
}

/* Progress bar */
.progress-bar {
  height: 5px;
  margin: 10px 0;
  transition:
    width 0.5s ease-in-out,
    background-color 0.5s ease-in-out;
  border-radius: 20px;
}

/* Password field */
.password-field {
  position: relative;
  margin-bottom: 20px;
}
.password-field input {
  width: 60%;
  padding-right: 40px;
  border-radius: 15px;
}

/* Validation list styling */
.validation-list {
  list-style: none;
  padding: 0;
  margin: 20px 100px;
}

.validation-list li {
  margin-bottom: 10px;
  display: flex;
  font-size: 15px;
}

/* Confirm password styling */
.reenterpass {
  border-radius: 15px;
  width: 60%;
  margin-bottom: 20px;
}

/* Action buttons styling */
.action-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* Cancel button styling */
.cancel-button {
  background-color: transparent;
  border: 2px solid #c1b9b9; /* Red color */
  color: #d31f1fdd;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 25px;
  text-transform: uppercase;
  font-weight: bold;
}

.cancel-button:hover {
  background-color: #e41818ba;
  color: white;
  transform: translateY(-3px);
}

.cancel-button i {
  margin-right: 15px;
  font-size: 20px;
}

/* Save button styling */
.save-button {
  background-color: transparent;
  border: 2px solid #b6b1b1bd;
  color: #1507b1d1;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 25px;
  text-transform: uppercase;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.save-button:hover {
  background-color: #1111c9c0;
  color: white;
  transform: translateY(-3px);
}

.save-button i {
  margin-right: 15px;
  font-size: 18px;
}

/* Hover effect for buttons */
@keyframes hoverEffect {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.05);
  }
}

.cancel-button:hover,
.save-button:hover {
  animation: hoverEffect 0.3s ease-in-out;
}

@keyframes colorChange {
  0% {
    color: rgb(2, 6, 167);
  }
  33% {
    color: rgba(2, 5, 143);
  }
  66% {
    color: rgba(0, 6, 130);
  }
  100% {
    color: rgba(5, 36, 74, 0.546);
  }
}
</style>

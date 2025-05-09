<template>
  <div class="forgot-password">
    <h1>Forgot Password ?</h1>
    <p>
      No worries, enter your email below and we'll send you a link to reset your
      password.
    </p>
    <input
      type="email"
      v-model="email"
      placeholder="xxxx@tav.aero"
      class="email-input"
    />
    <div class="button-group">
      <button class="cancel-button" @click="cancelRequest">Cancel</button>
      <button class="submit-button" @click="submitRequest">
        Submit request
      </button>
    </div>
  </div>
</template>

<script>
import apiServices from '../services/apiServices';

export default {
  data() {
    return {
      email: ''
    };
  },
  methods: {
    cancelRequest() {
      this.email = '';
    },
    async submitRequest() {
      try {
        const result = await apiServices.forgotPassword(this.email);
        if (result) {
          alert('Password reset link sent to your email.');
        } else {
          alert('Error occurred.');
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          'An unexpected error occurred.';
        console.error('Error occurred while sending reset request:', error);
        alert(errorMessage);
      }
    }
  }
};
</script>
<style scoped>
body {
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
.forgot-password {
  max-width: 500px;
  height: 250px;
  margin: 100px auto;
  padding: 30px;
  border: 1px solid #ccc;
  border-radius: 10px;
  text-align: center;
  background-color: #fff;
  perspective: 1000px;
  transition: transform 0.3s ease;
  box-shadow: 0.3s ease;
}
.forgot-password:hover {
  transform: rotateY('10deg') rotateX(10deg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.forgot-password:hover {
  transform: rotateY('15deg') rotateX('15deg');
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
h1 {
  margin-bottom: 10px;
}
p {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
}
.email-input {
  width: 80%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.button-group {
  display: flex;
  justify-content: space-between;
}
.cancel-button {
  background-color: #d9534f;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.submit-button {
  background-color: #0275d8;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.cancel-button:hover {
  background-color: #c9302c;
}
.submit-button:hover {
  background-color: #025aa5;
}
</style>

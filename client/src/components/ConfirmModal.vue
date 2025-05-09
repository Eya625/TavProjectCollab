<template>
    <div class="modal-backdrop" @click.self="$emit('cancel')">
      <div class="modal-content">
        <p>{{ message }}</p>
        <div class="buttons">
          <button @click="$emit('confirm')">Confirmer</button>
          <button @click="$emit('cancel')">Annuler</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ConfirmModal',
    props: {
      message: {
        type: String,
        default: 'Êtes-vous sûr ?'
      }
    }
  };
  </script>
  
  <style scoped>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: #fff;
    padding: 20px;
    border-radius: 5px;
    width: 300px;
    text-align: center;
  }
  .buttons {
    margin-top: 20px;
    display: flex;
    justify-content: space-around;
  }
  </style>
  
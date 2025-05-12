<template>
  <div>
    <h2>Véhicules ({{ vehicles.length }})</h2>
    <select v-model="localSel" @change="update">
      <option value="">Tous</option>
      <option v-for="v in vehicles" :key="v.registrationNumber" :value="v.registrationNumber">
        {{ v.registrationNumber }} — {{ v.model }}
      </option>
    </select>
  </div>
</template>

<script>
import apiService from '../services/apiServices';

export default {
  name: 'VehicleFilter',
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      vehicles: [],
      localSel: this.modelValue
    };
  },
  watch: {
    modelValue(val) { this.localSel = val; }
  },
  async mounted() {
    this.vehicles = await apiService.getFinanceVehicles();
  },
  methods: {
    update() {
      this.$emit('update:modelValue', this.localSel);
    }
  }
};
</script>

<style scoped>
select {
  width: 100%;
  padding: .5rem;
  font-size: 1rem;
}
</style>

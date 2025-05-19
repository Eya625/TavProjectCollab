<template>
  <div class="filter-veh">
    <label><i class="fas fa-car"></i> Véhicule</label>
    <select v-model="localSel">
      <option value="">Tous</option>
      <option
        v-for="v in vehicles"
        :key="v.registrationNumber"
        :value="v.registrationNumber"
      >
        {{ v.registrationNumber }} — {{ v.model }}
      </option>
    </select>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import apiService from '../services/apiServices';

export default {
  name: 'VehicleFilter',
  props: {
    modelValue: String
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const vehicles = ref([]);
    const localSel = ref(props.modelValue || '');

    onMounted(async () => {
      vehicles.value = await apiService.getFinanceVehicles();
    });

    watch(() => props.modelValue, v => {
      localSel.value = v;
    });
    watch(localSel, v => {
      emit('update:modelValue', v);
    });

    return { vehicles, localSel };
  }
};
</script>

<style scoped>
.filter-veh {
  display: flex;
  flex-direction: column;
}
.filter-veh label {
  color: #fff;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}
.filter-veh label i {
  margin-right: 0.5rem;
}
.filter-veh select {
  padding: 0.6rem;
  border-radius: 6px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  outline: none;
  appearance: none;
}
</style>

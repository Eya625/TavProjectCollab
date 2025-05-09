<template>
  <aside class="filter-panel">
    <div class="group">
      <label for="year-select">Année</label>
      <select id="year-select" v-model="localYear">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div class="group">
      <label for="employee-select">Employé</label>
      <select id="employee-select" v-model="localEmployee">
        <option value="">Tous</option>
        <option v-for="e in employees" :key="e" :value="e">{{ e }}</option>
      </select>
    </div>
    <div class="group">
      <label>Localisations</label>
      <ul class="checkbox-list">
        <li v-for="loc in locations" :key="loc">
          <input type="checkbox" :id="`loc-${loc}`" :value="loc" v-model="localLocations" />
          <label :for="`loc-${loc}`">{{ loc }}</label>
        </li>
      </ul>
    </div>
    <div class="group">
      <label>Mois</label>
      <ul class="checkbox-list months">
        <li v-for="m in months" :key="m">
          <input type="checkbox" :id="`month-${m}`" :value="m" v-model="localMonths" />
          <label :for="`month-${m}`">{{ m }}</label>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'FilterPanels',
  props: {
    years:             Array,
    employees:         Array,
    locations:         Array,
    months:            Array,
    modelValue:        Number,
    selectedEmployee:  String,
    selectedLocations: Array,
    selectedMonths:    Array
  },
  emits: [
    'update:modelValue',
    'update:selected-employee',
    'update:selected-locations',
    'update:selected-months'
  ],
  setup(props, { emit }) {
    const localYear      = ref(props.modelValue);
    const localEmployee  = ref(props.selectedEmployee);
    const localLocations = ref([...props.selectedLocations]);
    const localMonths    = ref([...props.selectedMonths]);

    watch(localYear,      y => emit('update:modelValue', y));
    watch(localEmployee,  e => emit('update:selected-employee', e));
    watch(localLocations, l => emit('update:selected-locations', l), { deep: true });
    watch(localMonths,    m => emit('update:selected-months', m),    { deep: true });

    return { localYear, localEmployee, localLocations, localMonths };
  }
};
</script>

<style scoped>
.filter-panel {
  width: 240px;
  padding: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.6); /* semi-transparent pour voir l’arrière-plan */
  color: #fff;
  box-sizing: border-box;
  backdrop-filter: blur(6px);
}

.group {
  margin-bottom: 1.5rem;
}
.group label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  color: #FFA500;
}

.checkbox-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.checkbox-list li {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.checkbox-list.months {
  flex-wrap: wrap;
  display: flex;
}
.checkbox-list.months li {
  width: 50%;
}

.checkbox-list input {
  margin-right: 0.5rem;
  accent-color: #FFA500;
}

.checkbox-list label {
  color: #fff;
}

select {
  width: 100%;
  padding: 0.25rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid #666;
  color: #fff;
  border-radius: 4px;
  appearance: none;
}
select option {
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
}

/* Au survol d’une option */
select option:hover,
select option:focus {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Au focus du select lui-même */
select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>

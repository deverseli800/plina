// src/pages/NewTab.vue
<template>
  <div class="new-tab-container">
    <div class="header">
      <h1>Your web activity today</h1>
    </div>
    <div class="content">
      <TabList :type="TypeOfList.Today" :showAllStats="false" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'NewTab',
};
</script>

<script lang="ts" setup>
import TabList from '../components/TabList.vue';
import { TypeOfList } from '../utils/enums';
</script>

<style scoped>
.new-tab-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  color: #4a4a4a;
}

.content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
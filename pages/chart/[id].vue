<template>
  <div class="max-w-6xl mx-auto p-8">
    <div class="mb-8">
      <NuxtLink
        to="/"
        class="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >← Back to Home</NuxtLink
      >
      <h1 class="text-3xl font-bold mb-2">
        {{ chartData?.title || formatChartName($route.params.id) }}
      </h1>
      <p class="text-gray-600" v-if="chartData">
        Week of {{ chartData.week }}
        <span v-if="chartData.cached" class="text-green-600 ml-2"
          >• Cached</span
        >
      </p>
    </div>

    <ClientOnly>
      <div v-if="chartData" class="space-y-4">
        <ChartCard
          v-for="song in chartData.songs"
          :key="`${song.position}-${song.name}`"
          :song="song"
        />
      </div>

      <div v-else-if="isLoading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
        ></div>
        <p class="mt-4 text-gray-600">Loading chart...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">Failed to load chart data</p>
        <button
          @click="refetch"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>

      <template #fallback>
        <div class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="mt-4 text-gray-600">Loading chart...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
const route = useRoute();
const chartId = computed(() => String(route.params.id));

const { useChartQuery } = useCharts();
const { data: chartData, isLoading, error, refetch } = useChartQuery(chartId);

const formatChartName = (id) => {
  return id
    .toString()
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
</script>

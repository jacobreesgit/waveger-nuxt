<template>
  <div class="max-w-4xl mx-auto p-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold mb-4">Waveger</h1>
      <p class="text-xl text-gray-600">Music Charts Explorer</p>
    </div>
    
    <div>
      <h2 class="text-2xl font-semibold mb-6">Popular Charts</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink to="/chart/hot-100" class="p-6 bg-gray-50 rounded-lg hover:bg-gray-100">
          <h3 class="font-semibold">Hot 100</h3>
          <p class="text-gray-600">Top songs of the week</p>
        </NuxtLink>
        <NuxtLink to="/chart/billboard-200" class="p-6 bg-gray-50 rounded-lg hover:bg-gray-100">
          <h3 class="font-semibold">Billboard 200</h3>
          <p class="text-gray-600">Top albums of the week</p>
        </NuxtLink>
        <NuxtLink to="/chart/artist-100" class="p-6 bg-gray-50 rounded-lg hover:bg-gray-100">
          <h3 class="font-semibold">Artist 100</h3>
          <p class="text-gray-600">Top artists of the week</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

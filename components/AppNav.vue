<template>
  <nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
    <div>
      <NuxtLink to="/" class="text-xl font-bold">Waveger</NuxtLink>
    </div>
    
    <ul class="flex space-x-6">
      <li><NuxtLink to="/" class="hover:text-gray-300">Home</NuxtLink></li>
      <li><NuxtLink to="/chart/hot-100" class="hover:text-gray-300">Hot 100</NuxtLink></li>
      <li><NuxtLink to="/chart/billboard-200" class="hover:text-gray-300">Billboard 200</NuxtLink></li>
      <li><NuxtLink to="/chart/artist-100" class="hover:text-gray-300">Artist 100</NuxtLink></li>
    </ul>
  </nav>
</template>
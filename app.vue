<template>
  <div>
    <AppNav />
    <main>
      <NuxtPage />
    </main>
    <!-- Global audio controls -->
    <ClientOnly>
      <NowPlaying />
    </ClientOnly>
  </div>
</template>

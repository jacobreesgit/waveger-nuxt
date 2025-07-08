import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Disable retry on client to prevent hydration mismatches
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false
      }
    }
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.server) {
    nuxtApp.ssrContext!.nuxt.vueQueryState = dehydrate(queryClient)
  }

  if (import.meta.client) {
    const vueQueryState = nuxtApp.ssrContext?.nuxt.vueQueryState || nuxtApp.payload.vueQueryState
    if (vueQueryState) {
      hydrate(queryClient, vueQueryState)
    }
  }
})
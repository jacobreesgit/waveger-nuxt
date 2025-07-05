import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { ChartData } from '~/types'

export const useCharts = () => {
  const queryClient = useQueryClient()

  const useChartQuery = (
    chartId: Ref<string>, 
    options: {
      week?: Ref<string | undefined>
      includeAppleMusic?: Ref<boolean>
    } = {}
  ) => {
    const { week, includeAppleMusic = ref(true) } = options
    
    const queryKey = computed(() => {
      const key = ['chart', chartId.value]
      if (week?.value) {
        key.push(week.value)
      }
      return key
    })

    return useQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams()
        if (week?.value) params.append('week', week.value)
        if (!includeAppleMusic.value) params.append('apple_music', 'false')

        const response = await $fetch<ChartData>(`/api/charts/${chartId.value}?${params}`)
        return response
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      }
    })
  }

  const prefetchChart = async (chartId: string, week?: string) => {
    const queryKey = ['chart', chartId]
    if (week) queryKey.push(week)
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams()
        if (week) params.append('week', week)
        return await $fetch<ChartData>(`/api/charts/${chartId}?${params}`)
      },
      staleTime: 5 * 60 * 1000
    })
  }

  const invalidateCharts = () => {
    queryClient.invalidateQueries({ queryKey: ['chart'] })
  }

  return {
    useChartQuery,
    prefetchChart,
    invalidateCharts
  }
}
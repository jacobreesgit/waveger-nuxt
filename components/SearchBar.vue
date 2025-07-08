<template>
  <div class="relative w-full" ref="searchContainer">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon 
          name="heroicons:magnifying-glass-20-solid" 
          class="h-5 w-5 text-gray-400"
          :class="{ 'text-blue-500': isFocused }"
        />
      </div>
      
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search songs and artists..."
        class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        :class="{
          'ring-2 ring-blue-500 border-blue-500': isFocused,
          'border-gray-300': !isFocused
        }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        autocomplete="off"
        spellcheck="false"
      />
      
      <!-- Clear Button -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          v-if="searchQuery"
          @click="handleClear"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          type="button"
        >
          <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
        </button>
        
        <!-- Loading Spinner -->
        <div
          v-else-if="false"
          class="animate-spin h-4 w-4 border-2 border-gray-200 border-t-blue-500 rounded-full"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search songs and artists...'
})

interface Emits {
  (e: 'search', query: string): void
  (e: 'clear'): void
}

const emit = defineEmits<Emits>()

// Component state
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const isFocused = ref(false)

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const query = target.value
  searchQuery.value = query
  emit('search', query)
}

// Handle focus
const handleFocus = () => {
  isFocused.value = true
}

// Handle blur
const handleBlur = () => {
  isFocused.value = false
}

// Handle clear
const handleClear = () => {
  searchQuery.value = ''
  emit('clear')
  if (searchInput.value) {
    searchInput.value.value = ''
  }
}

// Handle keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleClear()
    searchInput.value?.blur()
  }
}

// Focus method for external use
const focusInput = () => {
  searchInput.value?.focus()
}

// Expose methods
defineExpose({
  focusInput,
  clearSearch: handleClear
})
</script>
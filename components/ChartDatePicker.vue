<template>
  <div class="flex items-center gap-2">
    <!-- Previous Week Button -->
    <UButton
      icon="i-heroicons-chevron-left-20-solid"
      variant="ghost"
      size="sm"
      :disabled="isLoading"
      @click="goToPreviousWeek"
    >
      Previous
    </UButton>

    <!-- Date Picker -->
    <UPopover>
      <UButton
        :label="displayDate"
        icon="i-heroicons-calendar-days-20-solid"
        variant="outline"
        size="sm"
        :disabled="isLoading"
        class="min-w-[140px]"
      />

      <template #content>
        <div class="p-4 bg-white">
          <UCalendar
            v-model="selectedCalendarDate"
            :max-date="maxDate"
            :min-date="minDate"
            :is-date-disabled="isDateDisabled"
            color="primary"
            size="sm"
            class="w-full"
            @update:model-value="handleDateChange"
          />
        </div>
      </template>
    </UPopover>

    <!-- Next Week Button -->
    <UButton
      icon="i-heroicons-chevron-right-20-solid"
      variant="ghost"
      size="sm"
      :disabled="isCurrentWeek || isLoading"
      :class="{ 'opacity-50': isCurrentWeek || isLoading }"
      @click="goToNextWeek"
    >
      Next
    </UButton>

    <!-- Today Button -->
    <UButton
      v-if="!isCurrentWeek"
      variant="solid"
      size="sm"
      :disabled="isLoading"
      @click="goToToday"
    >
      Today
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from "date-fns";
import type { CalendarDate } from "@internationalized/date";
import { parseDate } from "@internationalized/date";

const chartStore = useChartStore();

// Props
interface Props {
  isLoading?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
});

// Reactive store values
const { selectedDate, isCurrentWeek } = storeToRefs(chartStore);

// Convert string date to CalendarDate for the calendar component
const selectedCalendarDate = computed({
  get: () => {
    return parseDate(selectedDate.value);
  },
  set: (_value: CalendarDate) => {
    // This will be handled by handleDateChange
  },
});

// Display formatted date
const displayDate = computed(() => {
  const date = parseISO(selectedDate.value);
  return format(date, "MMM d, yyyy");
});

// Set reasonable date bounds
const today = new Date();
const maxDate = parseDate(today.toISOString().split("T")[0]);
const minDate = parseDate("2010-01-01"); // Charts likely don't go back before 2010

// Handle date selection from calendar
const handleDateChange = (date: unknown) => {
  if (
    date &&
    !Array.isArray(date) &&
    typeof date === "object" &&
    "toString" in date
  ) {
    const dateString = (date as { toString(): string }).toString();
    chartStore.setDate(dateString);
  }
};

// Check if a date should be disabled
const isDateDisabled = (date: unknown) => {
  if (!date || typeof date !== "object" || !("toString" in date)) return true;

  const dateString = (date as { toString(): string }).toString();
  const selectedDateObj = parseISO(dateString);

  // Disable future dates
  if (selectedDateObj > today) {
    return true;
  }

  // Disable dates that are too far in the past
  const minDateObj = parseISO(minDate.toString());
  if (selectedDateObj < minDateObj) {
    return true;
  }

  return false;
};

// Navigation methods
const goToPreviousWeek = () => {
  chartStore.goToPreviousWeek();
};

const goToNextWeek = () => {
  chartStore.goToNextWeek();
};

const goToToday = () => {
  chartStore.setToday();
};
</script>

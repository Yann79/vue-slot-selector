<template>
  <div class="meeting-selector">
    <div :class="cssClass.tabClass" class="tab">
      <div class="tab__pagination" :class="cssClass.tabPaginationPrevious">
        <slot name="button-previous">
          <button
            type="button"
            :disabled="options.disabledDate(date, firstDate) || loading"
            class="tab__pagination__button"
            :class="cssClass.tabPaginationPreviousButton"
            @click="previousDate">
            <arrow-icon direction="left" />
          </button>
        </slot>
      </div>
      <div class="tab__days">
        <div
          class="tab__day"
          :class="tabDaysClass(index)"
          v-for="(meetingsByDay, index) in meetingsByDays"
          :key="String(meetingsByDay.date)">
          <slot name="header" :meetings="meetingsByDay">
            <day-display
              class="tab__days__day-display"
              :class="cssClass.tabDayDisplay"
              :meetings-day="meetingsByDay"
              :months-label="options.monthsLabel"
              :days-label="options.daysLabel"
            />
          </slot>
          <meetings
            class="tab__days__meetings"
            :class="cssClass.tabMeetings"
            :meeting-class="cssClass.tabMeeting"
            :meeting-button-class="cssClass.tabMeetingButton"
            :meeting-empty-class="cssClass.tabMeetingEmpty"
            :meetings-day="meetingsByDay"
            :meeting-slot-selected="modelValue"
            @meeting-slot-click="meetingSlotClick">
            <template #meeting="{ meeting }" v-if="$slots.meeting">
              <slot name="meeting" :meeting="meeting" />
            </template>
          </meetings>
        </div>
        <div v-if="loading" class="tab__loading" :class="cssClass.tabLoading">
          <slot v-if="$slots['loading']" name="loading" />
          <div v-else class="tab__loading__text">
            <loader />
            {{ options.loadingLabel }}
          </div>
        </div>
      </div>
      <div class="tab__pagination" :class="cssClass.tabPaginationNext">
        <slot name="button-next">
          <button
            type="button"
            class="tab__pagination__button tab__pagination__button--right"
            :disabled="options.disabledDateAfter(date, lastDate) || loading"
            :class="cssClass.tabPaginationNextButton"
            @click="nextDate">
            <arrow-icon direction="right" />
          </button>
        </slot>
      </div>
    </div>
    <button type="button" class="button-1" v-on:click="selected()">Choisir</button>

  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import type { PropType } from 'vue';

import '@/assets/css/icons-font.css';

import axios from 'axios';
import Meetings from './Meetings.vue';
import DayDisplay from './DayDisplay.vue';
import ArrowIcon from './ArrowIcon.vue';
import Loader from './Loader.vue';

import type MeetingsDay from '../interfaces/MeetingsDay.interface';
import type MeetingSlot from '../interfaces/MeetingSlot.interface';
import type { RequiredCalendarOptions, CalendarOptions } from '../interfaces/CalendarOptions.interface';
import type ClassNames from '../interfaces/ClassNames.interface';

import defaultCalendarOptions from '../defaults/calendarOptions';
import defaultClassNames from '../defaults/classNames';

export default defineComponent({
  name: 'meetingSelector',
  components: {
    Meetings,
    DayDisplay,
    ArrowIcon,
    Loader,
  },
  props: {
    modelValue: {
      type: [Array, Object, null] as PropType<MeetingSlot[] | MeetingSlot | null>,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    firstDate: {
      type: Date,
      required: true,
    },
    lastDate: {
      type: Date,
      required: true,
    },
    meetingsDays: {
      type: Array as () => Array<MeetingsDay>,
      required: true,
    },
    calendarOptions: {
      type: Object as PropType<CalendarOptions>,
      default: () => ({}),
    },
    classNames: {
      type: Object as PropType<ClassNames>,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      default: false,
    },
    multi: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'previous-date',
    'next-date',
    'meeting-slot-selected',
    'change',
    'meeting-slot-unselected',
    'update:modelValue',
  ],
  setup(props, context) {
    const skip = ref(0);
    const isDisabled = ref(true);

    const options = computed((): RequiredCalendarOptions => ({
      ...defaultCalendarOptions,
      ...props.calendarOptions,
    }));

    const cssClass = computed((): ClassNames => ({
      ...defaultClassNames,
      ...props.classNames,
    }));

    const maxNbMeetings = computed((): number => {
      if (props.meetingsDays && props.meetingsDays.length) {
        return Math.max(...props.meetingsDays.map((meetingsDay) => meetingsDay.slots.length));
      }
      return 0;
    });

    const meetingsByDays = computed((): MeetingsDay[] => {
      const arrayIndex = Math.ceil(maxNbMeetings.value / options.value.limit)
        * options.value.limit;
      if (props.meetingsDays) {
        return props.meetingsDays.map((meetingsDay) => {
          const slots = new Array(arrayIndex).fill({ date: '' });
          slots.splice(0, meetingsDay.slots.length, ...meetingsDay.slots);
          const day = {
            ...meetingsDay,
            slots: slots.slice(skip.value, skip.value + options.value.limit),
          };
          return day;
        });
      }
      return [];
    });

    const days = computed((): string[] => {
      const { daysLabel } = options.value;
      if (props.meetingsDays) {
        return props.meetingsDays.map((meetingsDay) => {
          const date = new Date(meetingsDay.date);
          return daysLabel[date.getDay()];
        });
      }
      return [];
    });

    const nextMeetings = (): void => {
      skip.value += options.value.spacing;
    };

    const previousMeetings = (): void => {
      skip.value -= options.value.spacing;
    };

    const previousDate = (): void => {
      context.emit('previous-date');
    };

    const nextDate = (): void => {
      context.emit('next-date');
    };

    const tabDaysClass = (index: number): string => (index + 1 === meetingsByDays.value.length
      ? `tab__days--last ${cssClass.value.tabMeetings}`
      : cssClass.value.tabMeetings || '');

    const meetingSlotClick = (meetingSlotClicked: MeetingSlot): void => {
      if (props.multi && Array.isArray(props.modelValue)) {
        const selectedDate:number = new Date(meetingSlotClicked.date).getTime();
        const index:number = props.modelValue.findIndex((s: MeetingSlot) => {
          const date = new Date(s.date);
          return date.getTime() === selectedDate;
        });
        const slots = [...props.modelValue];
        if (index !== -1) {
          slots.splice(index, 1);
          context.emit('change', slots);
          context.emit('meeting-slot-selected', slots);
          context.emit('update:modelValue', slots);
        } else {
          slots.push(meetingSlotClicked);
          context.emit('change', slots);
          context.emit('meeting-slot-selected', slots);
          context.emit('update:modelValue', slots);
        }
        return;
      }
      if (props.modelValue) {
        const selectedDate = new Date(meetingSlotClicked.date);
        const date = new Date((props.modelValue as MeetingSlot).date);
        if (date.getTime() === selectedDate.getTime()) {
          context.emit('change', undefined);
          context.emit('meeting-slot-unselected');
          context.emit('update:modelValue');
          isDisabled.value = false;
          return;
        }
      }
      context.emit('change', meetingSlotClicked);
      context.emit('meeting-slot-selected', meetingSlotClicked);
      context.emit('update:modelValue', meetingSlotClicked);
    };

    context.expose({
      nextMeetings,
      previousMeetings,
      previousDate,
      nextDate,
      meetingSlotClick,
      isDisabled,
    });

    return {
      skip,
      options,
      cssClass,
      tabDaysClass,
      maxNbMeetings,
      meetingsByDays,
      days,
      nextMeetings,
      previousMeetings,
      previousDate,
      nextDate,
      meetingSlotClick,
      isDisabled,
    };
  },
  methods: {
    selected() {
      if (this.modelValue !== null) {
        const hours = this.modelValue.date.getHours() < 10 ? `0${this.modelValue.date.getHours()}` : this.modelValue.date.getHours();
        const displayHoraire = Number(hours) >= 12 ? 'PM' : 'AM';
        let horaireToSend = "";
        if (this.modelValue.AMorPM === 'ChangeAfter') {
           horaireToSend = displayHoraire;
        } else {
          horaireToSend = this.modelValue.AMorPM;
        }
        const date = new Date(this.modelValue.date);
        const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        axios.post('http://localhost:3000/api/meeting', {
          date: dateWithoutTime,
          horaire: horaireToSend,
        })
          .then((response: any) => {
            console.log(response);
          })
          .catch((error: any) => {
            console.log(error);
          });
      }
    },
  },
});
</script>

<style scoped lang="scss">
$color-border: #EBEEF5;
$color-button: #39ADEE;
$color-button-hover: #6696BB;

.meeting-selector {
  position: relative;
  .tab {
    display: flex;
    &__days {
      position: relative;
      padding: 0 5px;
      flex: 1;
      display: flex;
    }
    &__day {
      flex: 1 1 0;
      flex-wrap: nowrap;
      text-align: center;
      border-bottom: 1px solid $color-border;
      &__day-display {
        padding: 0 5px 5px 5px;
        border-bottom: 1px solid $color-border;
      }
    }
    &__pagination {
      width: 30px;
      &__button {
        margin-top: 8px;
        padding: 0;
        cursor: pointer;
        background-color: transparent;
        border: none;
        color: $color-button;
        &:hover {
          color: $color-button-hover;
        }
        &:disabled {
          cursor: not-allowed;
          opacity: 0.4;
          &:hover {
            opacity: 0.4;
          }
        }
        &--up {
          margin-top: 20px;
        }
        &--down {
          margin-top: 10px;
        }
        &:focus {
          outline: none;
        }
      }
    }
    &__loading {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      bottom: 0;
      top: 39px;
      left: 5px;
      right: 5px;
      background-color: $color-border;
      &__text {
        font-size: 20px;
      }
    }
  }
}
</style>
<style>
  .button-1 {
    background-color: #b0d7f4;
    border-radius: 8px;
    border-style: none;
    box-sizing: border-box;
    color: #FFFFFF;
    cursor: pointer;
    display: inline-block;
    font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    height: 40px;
    line-height: 20px;
    list-style: none;
    margin: 0;
    outline: none;
    padding: 10px 16px;
    position: relative;
    text-align: center;
    text-decoration: none;
    transition: color 100ms;
    vertical-align: baseline;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 1%;
  }

  .button-1:hover,
  .button-1:focus {
    background-color: #6e879a;
  }

</style>

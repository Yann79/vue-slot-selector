<!-- eslint-disable vue/max-len -->
<template>
  <div id="app">
    <vue-meeting-selector
      ref="meetingSelector"
      class="meeting-selector"
      v-model="meeting"
      :date="date"
      :firstDate="firstDate"
      :loading="false"
      :meetings-days="meetingsDays"
      @next-date="nextDate"
      @previous-date="previousDate">
      <!--<template
        #meeting="{ meeting }">
        <div>{{ meeting.date }}</div>
      </template> -->
    </vue-meeting-selector>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
} from 'vue';

import type { Ref } from 'vue';
import VueMeetingSelector from '@/components/VueMeetingSelector.vue';
import slotsGenerator from '@/helpers/slotsGenerator';
import type MeetingsDay from '@/interfaces/MeetingsDay.interface';
import type MeetingSlot from '@/interfaces/MeetingSlot.interface';
import type Time from '@/interfaces/Time.interface';
import data from './data.json';

export default defineComponent({
  components: {
    VueMeetingSelector,
  },
  setup() {
    const meeting: Ref<null | MeetingSlot> = ref(null);
    const meetingsDays: Ref<MeetingsDay[]> = ref([]);
    const nbDaysToDisplay = ref(5);
    const date = ref(data[0].date);
    let i = 0;

    const startDayFunction = (jsonData: any): Time[] => {
      if (jsonData.slots.length === 1) {
        if (['AM', 'AMPM'].includes(jsonData.slots[0].slot)) {
          return [{
            hours: 8,
            minutes: 0,
          },
          {
            hours: 12,
            minutes: 0,
          }];
        } if (jsonData.slots[0].slot === 'PM') {
          return [{
            hours: 14,
            minutes: 0,
          },
          {
            hours: 18,
            minutes: 0,
          }];
        }
      } else {
        return [{
          hours: 8,
          minutes: 0,
        },
        {
          hours: 18,
          minutes: 0,
        }];
      }
    };

    const initMeetingsDays = () => {
      for (i; i < nbDaysToDisplay.value; i += 1) {
        const horaireDay = startDayFunction(data[i]);
        const dateHoraire = data[i].date;
        const startDay = horaireDay[0];
        const endDay = horaireDay[1];
        const time = 250;
        meetingsDays.value.push(...slotsGenerator(new Date(dateHoraire), 1, startDay, endDay, time));
      }
      nbDaysToDisplay.value = i + 5;
    };

    initMeetingsDays();

    const meetingSelector:Ref<unknown> = ref(null);

    const up = (): void => {
      (
        meetingSelector.value as { previousMeetings: () => void }
      ).previousMeetings();
    };

    const down = (): void => {
      (
        meetingSelector.value as { nextMeetings: () => void }
      ).nextMeetings();
    };

    const nextDate = (): void => {
      meetingsDays.value = [];
      console.log(`i ${i}`);
      console.log(`nbr ${nbDaysToDisplay.value}`);
      nbDaysToDisplay.value = i + 5;
      for (i; i < nbDaysToDisplay.value; i += 1) {
        const horaireDay = startDayFunction(data[i]);
        const dateHoraire = data[i].date;
        const startDay = horaireDay[0];
        const endDay = horaireDay[1];
        const time = 250;
        meetingsDays.value.push(...slotsGenerator(new Date(dateHoraire), 1, startDay, endDay, time));
      }
      date.value = data[i].date;
    };

    const previousDate = (): void => {
      meetingsDays.value = [];
      nbDaysToDisplay.value = i - 5;
      i -= 10;
      console.log(`nbr ${nbDaysToDisplay.value}`);
      console.log(`i ${i}`);

      for (i; i < nbDaysToDisplay.value; i += 1) {
        const horaireDay = startDayFunction(data[i]);
        const dateHoraire = data[i].date;
        const startDay = horaireDay[0];
        const endDay = horaireDay[1];
        const time = 250;
        meetingsDays.value.push(...slotsGenerator(new Date(dateHoraire), 1, startDay, endDay, time));
      }
      console.log(`i apres ${i}`);

      date.value = data[i].date;
    };

    return {
      meeting,
      meetingsDays,
      date,
      meetingSelector,
      up,
      down,
      nextDate,
      previousDate,
    };
  },
  data() {
    return {
      firstDate: data[0].date,
    };
  },
});
</script>

<style lang="scss">
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
* {
  box-sizing: border-box;
}
.meeting-selector {
  width: 542px;
}
</style>

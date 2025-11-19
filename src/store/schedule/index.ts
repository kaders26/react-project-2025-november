/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

import type { ErrorBE } from '../../utils/types';
import type { ScheduleInstance } from '../../models/schedule';

export interface ScheduleState {
  errors: ErrorBE;
  loading: boolean;
  schedule: ScheduleInstance;
}

const initialState: ScheduleState = {
  loading: false,
  errors: {},
  schedule: {} as ScheduleInstance,
};

const scheduleReducer: any = {
  [types.FETCH_SCHEDULE_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<typeof state.schedule>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: {},
    schedule: payload,
  }),

  [types.FETCH_SCHEDULE_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),

  [types.UPDATE_ASSIGNMENT]: (
    state: ScheduleState,
    { payload }: Action<{ assignmentId: string; newStart: string; newEnd: string }>
  ): ScheduleState => {
    const updatedAssignments = state.schedule.assignments.map((assignment) => {
      if (assignment.id === payload.assignmentId) {
        return {
          ...assignment,
          shiftStart: payload.newStart,
          shiftEnd: payload.newEnd,
          isUpdated: true,
        };
      }
      return assignment;
    });

    // ❗ Schedule objesini tamamen yeni bir referans yap
    // Böylece React shallow comparison ile değişikliği algılar
    const newSchedule = {
      ...state.schedule,
      assignments: updatedAssignments,
    };

    // Deep clone ile tamamen yeni bir schedule objesi oluştur
    // structuredClone daha modern ve güvenli (Date, Map, Set destekler)
    const clonedSchedule = typeof structuredClone !== 'undefined' 
      ? structuredClone(newSchedule)
      : JSON.parse(JSON.stringify(newSchedule));

    return {
      ...state,
      schedule: clonedSchedule,
    };
  },
};

export default handleActions(scheduleReducer, initialState) as any;

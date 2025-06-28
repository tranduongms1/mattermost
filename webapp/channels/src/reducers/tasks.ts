import isEqual from 'lodash/isEqual';
import type {AnyAction} from 'redux';
import {combineReducers} from 'redux';

import type {Channel} from '@mattermost/types/channels';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import {PostTypes, UserTypes} from 'mattermost-redux/action_types';

import {ChannelStats, MyTaskStats, TechnicalStats} from 'types/store/tasks';

export const EMPTY_STATS = {
    troublesCount: 0,
    doneTroublesCount: 0,
    completedTroublesCount: 0,
    issuesCount: 0,
    doneIssuesCount: 0,
    completedIssuesCount: 0,
    plansCount: 0,
    donePlansCount: 0,
    completedPlansCount: 0,
    recurringTasksCount: 0,
} as TechnicalStats;

export const MY_EMPTY_STATS = {
    fromMeCount: 0,
    toMeCount: 0,
    isManagerCount: 0,
    doneCount: 0,
} as MyTaskStats;

function channelStats(state: RelationOneToOne<Channel, ChannelStats> = {}, action: AnyAction) {
    switch (action.type) {
    case 'RECEIVED_CHANNEL_TASK_STATS': {
        const stat: ChannelStats = action.data;

        if (isEqual(state[stat.channel_id], stat)) {
            return state;
        }

        return {
            ...state,
            [stat.channel_id]: {...EMPTY_STATS, ...state[stat.channel_id], ...stat},
        };
    }
    case PostTypes.RECEIVED_NEW_POST: {
        const {channel_id, type, props: {task_type, old_status, new_status}} = action.data;
        const stats: any = {...EMPTY_STATS, ...state[channel_id]};
        switch (type) {
        case 'custom_trouble':
            return {
                ...state,
                [channel_id]: {...stats, troublesCount: stats.troublesCount + 1},
            }
        case 'custom_issue':
            return {
                ...state,
                [channel_id]: {...stats, issuesCount: stats.issuesCount + 1},
            }
        case 'custom_plan':
            return {
                ...state,
                [channel_id]: {...stats, plansCount: stats.plansCount + 1},
            }
        case 'custom_task_updated':
            if (!['trouble', 'issue', 'plan'].includes(task_type)) return state;
            const taskType = task_type[0].toUpperCase() + task_type.slice(1);
            if (new_status === 'confirmed' && old_status === 'done') {
                return {
                    ...state,
                    [channel_id]: {
                        ...stats,
                        [`${task_type}sCount`]: stats[`${task_type}sCount`] + 1,
                        [`done${taskType}sCount`]: stats[`done${taskType}sCount`] - 1,
                    },
                }
            } else if (new_status === 'done') {
                return {
                    ...state,
                    [channel_id]: {
                        ...stats,
                        [`${task_type}sCount`]: stats[`${task_type}sCount`] - 1,
                        [`done${taskType}sCount`]: stats[`done${taskType}sCount`] + 1,
                    },
                }
            } else if (new_status === 'completed') {
                return {
                    ...state,
                    [channel_id]: {
                        ...stats,
                        [`done${taskType}sCount`]: stats[`done${taskType}sCount`] - 1,
                        [`completed${taskType}sCount`]: stats[`completed${taskType}sCount`] + 1,
                    },
                }
            }
        }
        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function technicalStats(state: TechnicalStats = EMPTY_STATS, action: AnyAction) {
    switch (action.type) {
    case 'RECEIVED_TECHNICAL_TASK_STATS': {
        const stat: TechnicalStats = action.data;

        if (isEqual(state, stat)) {
            return state;
        }

        return {...EMPTY_STATS, ...stat};
    }
    case PostTypes.RECEIVED_NEW_POST: {
        const {type, props: {task_type, old_status, new_status}} = action.data;
        const stats: any = {...EMPTY_STATS, ...state};
        switch (type) {
        case 'custom_trouble':
            return {
                ...stats,
                troublesCount: stats.troublesCount + 1,
            }
        case 'custom_issue':
            return {
                ...stats,
                issuesCount: stats.issuesCount + 1,
            }
        case 'custom_plan':
            return {
                ...stats,
                plansCount: stats.plansCount + 1,
            }
        case 'custom_task_updated':
            if (!['trouble', 'issue', 'plan'].includes(task_type)) return state;
            const taskType = task_type[0].toUpperCase() + task_type.slice(1);
            if (new_status === 'confirmed' && old_status === 'done') {
                return {
                    ...stats,
                    [`${task_type}sCount`]: stats[`${task_type}sCount`] + 1,
                    [`done${taskType}sCount`]: stats[`done${taskType}sCount`] - 1,
                }
            } else if (new_status === 'done') {
                return {
                    ...stats,
                    [`${task_type}sCount`]: stats[`${task_type}sCount`] - 1,
                    [`done${taskType}sCount`]: stats[`done${taskType}sCount`] + 1,
                }
            } else if (new_status === 'completed') {
                return {
                    ...stats,
                    [`done${taskType}sCount`]: stats[`done${taskType}sCount`] - 1,
                    [`completed${taskType}sCount`]: stats[`completed${taskType}sCount`] + 1,
                }
            }
        }
        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function myTaskStats(state: MyTaskStats = MY_EMPTY_STATS, action: AnyAction) {
    switch (action.type) {
    case 'RECEIVED_MY_TASK_STATS': {
        const stat: TechnicalStats = action.data;

        if (isEqual(state, stat)) {
            return state;
        }

        return {...MY_EMPTY_STATS, ...stat};
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({
    channelStats,
    technicalStats,
    myTaskStats,
});

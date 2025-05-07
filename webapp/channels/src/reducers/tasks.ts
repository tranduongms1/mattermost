import isEqual from 'lodash/isEqual';
import type {AnyAction} from 'redux';
import {combineReducers} from 'redux';

import type {Channel} from '@mattermost/types/channels';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import {PostTypes, UserTypes} from 'mattermost-redux/action_types';

import {ChannelStats} from 'types/store/tasks';

export const EMPTY_CHANNEL_STATS = {
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
} as ChannelStats;

function channelStats(state: RelationOneToOne<Channel, ChannelStats> = {}, action: AnyAction) {
    console.log(action);
    switch (action.type) {
    case 'RECEIVED_CHANNEL_TASKS_STATS': {
        const stat: ChannelStats = action.data;

        if (isEqual(state[stat.channel_id], stat)) {
            return state;
        }

        return {
            ...state,
            [stat.channel_id]: stat,
        };
    }
    case PostTypes.RECEIVED_NEW_POST: {
        const {type, channel_id} = action.data;
        let stats = state[channel_id] || EMPTY_CHANNEL_STATS;
        switch (type) {
        case 'custom_trouble':
            stats = {...stats, troublesCount: stats.troublesCount + 1};
            break;
        case 'custom_issue':
            stats = {...stats, issuesCount: stats.issuesCount + 1};
            break;
        case 'custom_plan':
            stats = {...stats, plansCount: stats.plansCount + 1};
           break;
        }
        return {...state, [channel_id]: stats};
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({
    channelStats,
});

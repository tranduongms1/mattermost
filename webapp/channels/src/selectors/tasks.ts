import {Channel} from '@mattermost/types/channels';
import {RelationOneToOne} from '@mattermost/types/utilities';

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';

import {EMPTY_STATS} from 'reducers/tasks';

import type {ChannelStats} from 'types/store/tasks';
import type {GlobalState} from 'types/store';

export function getChannelStats(state: GlobalState): RelationOneToOne<Channel, ChannelStats> {
    return state.tasks.channelStats;
}

export const getCurrentChannelStats: (state: GlobalState) => ChannelStats = createSelector(
    'getCurrentChannelStats',
    getCurrentChannelId,
    getChannelStats,
    (currentChannelId: string, allStats: RelationOneToOne<Channel, ChannelStats>): ChannelStats => {
        return allStats[currentChannelId] || EMPTY_STATS;
    },
);

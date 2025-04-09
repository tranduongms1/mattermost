import {Channel} from '@mattermost/types/channels';
import {RelationOneToOne} from '@mattermost/types/utilities';

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';

import type {ChannelStats} from 'types/store/channels';
import type {GlobalState} from 'types/store';

export const EMPTY_CHANNEL_STATS = {
    troublesCount: 0,
    doneTroublesCount: 0,
    completedTroublesCount: 0,
    issuesCount: 0,
    doneIssuesCount: 0,
    completedIssuesCount: 0,
    plansCount: 0,
    recurringTasksCount: 0,
};

export function getAllChannelStats(state: GlobalState): RelationOneToOne<Channel, ChannelStats> {
    return state.channels.stats;
}

export const getCurrentChannelStats: (state: GlobalState) => ChannelStats | undefined = createSelector(
    'getCurrentChannelStats',
    getAllChannelStats,
    getCurrentChannelId,
    (allChannelStats: RelationOneToOne<Channel, ChannelStats>, currentChannelId: string): ChannelStats => {
        return allChannelStats[currentChannelId];
    },
);

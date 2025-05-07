import {logError} from 'mattermost-redux/actions/errors';
import {forceLogoutIfNecessary} from 'mattermost-redux/actions/helpers';
import {Client4} from 'mattermost-redux/client';

import type {ActionFuncAsync} from 'mattermost-redux/types/actions';

import type {ChannelStats} from 'types/store/tasks';

export function getChannelStats(channelId: string): ActionFuncAsync<ChannelStats> {
    return async (dispatch, getState) => {
        let stats;
        try {
            stats = await (Client4 as any).doFetch(
                `${Client4.getChannelRoute(channelId)}/tasks/stats`,
                {method: 'get'},
            );
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: 'RECEIVED_CHANNEL_TASKS_STATS',
            data: stats,
        });

        return {data: stats};
    };
}
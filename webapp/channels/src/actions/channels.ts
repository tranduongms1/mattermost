import {logError} from 'mattermost-redux/actions/errors';
import {forceLogoutIfNecessary} from 'mattermost-redux/actions/helpers';
import {Client4} from 'mattermost-redux/client';

import type {ActionFuncAsync} from 'mattermost-redux/types/actions';

import type {ChannelStats} from 'types/store/channels';

export function getChannelStats(channelId: string, includeFileCount?: boolean): ActionFuncAsync<ChannelStats> {
    return async (dispatch, getState) => {
        let stat;
        try {
            stat = await (Client4 as any).doFetch(
                `${Client4.getChannelRoute(channelId)}/stats`,
                {method: 'get'},
            );
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: '',
            data: stat,
        });

        return {data: stat};
    };
}
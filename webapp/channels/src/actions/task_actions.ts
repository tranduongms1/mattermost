import {logError} from 'mattermost-redux/actions/errors';
import {forceLogoutIfNecessary} from 'mattermost-redux/actions/helpers';
import {Client4} from 'mattermost-redux/client';

import type {PostList} from '@mattermost/types/posts';

import {receivedPosts} from 'mattermost-redux/actions/posts';
import {batchFetchStatusesProfilesGroupsFromPosts} from 'mattermost-redux/actions/status_profile_polling';
import {Posts} from 'mattermost-redux/constants';
import type {ActionFuncAsync} from 'mattermost-redux/types/actions';

import type {ChannelStats, MyTaskStats, TechnicalStats} from 'types/store/tasks';

export function getTasksForChannel(channelId: string, type: string, statuses: string[], page = 0, perPage = Posts.POST_CHUNK_SIZE): ActionFuncAsync<PostList> {
    return async (dispatch, getState) => {
        let posts;
        try {
            let url = `${Client4.getChannelRoute(channelId)}/tasks?type=${type}&${statuses.map(s => 'status[]=' + s).join('&')}&page=${page}&per_page=${perPage}`;
            posts = await (Client4 as any).doFetch(url, {method: 'get'});
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedPosts(posts));
        dispatch(batchFetchStatusesProfilesGroupsFromPosts(posts.posts));

        return {data: posts};
    };
}

export function getMyTasks(type: string, statuses: string[], page = 0, perPage = Posts.POST_CHUNK_SIZE): ActionFuncAsync<PostList> {
    return async (dispatch, getState) => {
        let posts;
        try {
            let url = `${Client4.getUserRoute('me')}/tasks?type=${type}&${statuses.map(s => 'status[]=' + s).join('&')}&page=${page}&per_page=${perPage}`;
            posts = await (Client4 as any).doFetch(url, {method: 'get'});
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(receivedPosts(posts));
        dispatch(batchFetchStatusesProfilesGroupsFromPosts(posts.posts));

        return {data: posts};
    };
}

export function getChannelStats(channelId: string): ActionFuncAsync<ChannelStats> {
    return async (dispatch, getState) => {
        let stats;
        try {
            const getCount = async (type: string, statuses: string[]) => {
                const res = await (Client4 as any).doFetch(
                    `${Client4.getChannelRoute(channelId)}/tasks/count?type=${type}&${statuses.map(s => 'status[]='+s).join('&')}`,
                    {method: 'get'},
                );
                return res.count;
            }
            const result = await Promise.all([
                getCount('trouble', ['new', 'confirmed']),
                getCount('issue', ['new', 'confirmed']),
                getCount('plan', ['new', 'confirmed']),
                getCount('trouble', ['done']),
                getCount('issue', ['done']),
                getCount('plan', ['done']),
                getCount('trouble', ['completed']),
                getCount('issue', ['completed']),
                getCount('plan', ['completed']),
            ]);
            stats = {
                channel_id: channelId,
                troublesCount: result[0],
                issuesCount: result[1],
                plansCount: result[2],
                doneTroublesCount: result[3],
                doneIssuesCount: result[4],
                donePlansCount: result[5],
                completedTroublesCount: result[6],
                completedIssuesCount: result[7],
                completedPlansCount: result[8],
            } as ChannelStats;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: 'RECEIVED_CHANNEL_TASK_STATS',
            data: stats,
        });

        return {data: stats};
    };
}

export function getTechnicalStats(): ActionFuncAsync<TechnicalStats> {
    return async (dispatch, getState) => {
        let stats;
        try {
            const getCount = async (type: string, statuses: string[]) => {
                const res = await (Client4 as any).doFetch(
                    `${Client4.getUserRoute('me')}/tasks/count?type=${type}&${statuses.map(s => 'status[]='+s).join('&')}`,
                    {method: 'get'},
                );
                return res.count;
            }
            const result = await Promise.all([
                getCount('trouble', ['new', 'confirmed']),
                getCount('issue', ['new', 'confirmed']),
                getCount('plan', ['new', 'confirmed']),
                getCount('trouble', ['done']),
                getCount('issue', ['done']),
                getCount('plan', ['done']),
                getCount('trouble', ['completed']),
                getCount('issue', ['completed']),
                getCount('plan', ['completed']),
            ]);
            stats = {
                troublesCount: result[0],
                issuesCount: result[1],
                plansCount: result[2],
                doneTroublesCount: result[3],
                doneIssuesCount: result[4],
                donePlansCount: result[5],
                completedTroublesCount: result[6],
                completedIssuesCount: result[7],
                completedPlansCount: result[8],
            } as ChannelStats;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: 'RECEIVED_TECHNICAL_TASK_STATS',
            data: stats,
        });

        return {data: stats};
    };
}

export function getMyTaskStats(): ActionFuncAsync<MyTaskStats> {
    return async (dispatch, getState) => {
        let stats;
        try {
            const getCount = async (type: string, statuses: string[]) => {
                const res = await (Client4 as any).doFetch(
                    `${Client4.getUserRoute('me')}/tasks/count?type=${type}&${statuses.map(s => 'status[]='+s).join('&')}`,
                    {method: 'get'},
                );
                return res.count;
            }
            const result = await Promise.all([
                getCount('from_me', ['new', 'confirmed']),
                getCount('to_me', ['new', 'confirmed']),
                getCount('is_manager', ['new', 'confirmed']),
                getCount('all', ['done']),
                getCount('all', ['completed']),
            ]);
            stats = {
                fromMeCount: result[0],
                toMeCount: result[1],
                isManagerCount: result[2],
                doneCount: result[3],
                completedCount: result[4],
            } as MyTaskStats;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: 'RECEIVED_MY_TASK_STATS',
            data: stats,
        });

        return {data: stats};
    };
}

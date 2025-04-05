import type {AnyAction} from 'redux';
import {combineReducers} from 'redux';

import type {Channel} from '@mattermost/types/channels';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import {UserTypes} from 'mattermost-redux/action_types';

import {ChannelStats} from 'types/store/channels';

function stats(state: RelationOneToOne<Channel, ChannelStats> = {}, action: AnyAction) {
    switch (action.type) {
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({
    stats,
});

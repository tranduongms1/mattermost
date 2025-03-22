// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback} from 'react';

import type {Channel} from '@mattermost/types/channels';
import type {PreferenceType} from '@mattermost/types/preferences';

import type {ActionResult} from 'mattermost-redux/types/actions';

import {trackEvent} from 'actions/telemetry_actions';

import SidebarChannelLink from 'components/sidebar/sidebar_channel/sidebar_channel_link';
import Avatars from 'components/widgets/users/avatars';

import {getHistory} from 'utils/browser_history';
import Constants from 'utils/constants';

type Props = {
    channel: Channel;
    currentTeamName: string;
    currentUserId: string;
    redirectChannel: string;
    active: boolean;
    membersCount: number;
    memberIds: string[];
    actions: {
        savePreferences: (userId: string, preferences: PreferenceType[]) => Promise<ActionResult>;
    };
};

const SidebarGroupChannel = ({
    channel,
    currentUserId,
    actions,
    active,
    currentTeamName,
    redirectChannel,
    membersCount,
    memberIds,
}: Props) => {
    const handleLeaveChannel = useCallback((callback: () => void) => {
        const id = channel.id;
        const category = Constants.Preferences.CATEGORY_GROUP_CHANNEL_SHOW;

        actions.savePreferences(currentUserId, [{user_id: currentUserId, category, name: id, value: 'false'}]).then(callback);

        trackEvent('ui', 'ui_direct_channel_x_button_clicked');

        if (active) {
            getHistory().push(`/${currentTeamName}/channels/${redirectChannel}`);
        }
    }, [channel.id, actions, active, currentTeamName, redirectChannel, currentUserId]);

    const getIcon = () => {
        return (
            <div className='GroupChannel__profile-picture'>
                <Avatars
                    stacked
                    size='lg'
                    userIds={memberIds}
                    totalUsers={membersCount}
                />
            </div>
        );
    };

    return (
        <SidebarChannelLink
            channel={channel}
            link={`/${currentTeamName}/messages/${channel.name}`}
            label={channel.display_name}
            channelLeaveHandler={handleLeaveChannel}
            icon={getIcon()}
        />
    );
};

export default memo(SidebarGroupChannel);

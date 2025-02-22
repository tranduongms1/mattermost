// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';

import {Client4} from 'mattermost-redux/client';

import Markdown from 'components/markdown';
import ProfilePicture from 'components/profile_picture';
import BotTag from 'components/widgets/tag/bot_tag';
import GuestTag from 'components/widgets/tag/guest_tag';

import type {DMUser} from './channel_info_rhs';

const Username = styled.p`
    font-family: Metropolis, sans-serif;
    font-size: 18px;
    line-height: 24px;
    color: rgb(var(--center-channel-color-rgb));
    font-weight: 600;
    margin: 0;
`;

const UserInfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 12px;
`;

const UserAvatar = styled.div`
    .status {
        bottom: 0;
        right: 0;
        height: 18px;
        width: 18px;
        & svg {
            min-height: 14.4px;
        }
    }
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 8px;
`;

const UsernameContainer = styled.div`
    display: flex;
    gap: 8px
`;

const UserPosition = styled.div`
    line-height: 20px;

    p {
        margin-bottom: 0;
    }
`;

interface Props {
    channel: Channel;
    dmUser: DMUser;
}

const AboutAreaDM = ({channel, dmUser}: Props) => {
    return (
        <>
            <UserInfoContainer>
                <UserAvatar>
                    <ProfilePicture
                        src={Client4.getProfilePictureUrl(dmUser.user.id, dmUser.user.last_picture_update)}
                        isBot={dmUser.user.is_bot}
                        status={dmUser.status ? dmUser.status : undefined}
                        username={dmUser.display_name}
                        userId={dmUser.user.id}
                        channelId={channel.id}
                        size='xl'
                    />
                </UserAvatar>
                <UserInfo>
                    <UsernameContainer>
                        <Username>{dmUser.display_name}</Username>
                        {dmUser.user.is_bot && <BotTag/>}
                        {dmUser.is_guest && <GuestTag/>}
                    </UsernameContainer>
                    <UserPosition>
                        <Markdown message={dmUser.user.is_bot ? dmUser.user.bot_description : dmUser.user.position}/>
                    </UserPosition>
                </UserInfo>
            </UserInfoContainer>
        </>
    );
};

export default AboutAreaDM;

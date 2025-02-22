// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import Constants from 'utils/constants';

import AboutAreaDM from './about_area_dm';
import AboutAreaGM from './about_area_gm';
import type {DMUser} from './channel_info_rhs';

const Container = styled.div`
    overflow-wrap: anywhere;
    padding: 24px;
    padding-bottom: 12px;

    font-size: 14px;
    line-height: 20px;

    & .status-wrapper {
        height: 50px;
    }

    & .text-empty {
        padding: 0px;
        background: transparent;
        border: 0px;
        color: rgba(var(--center-channel-color-rgb), 0.75);
    }
`;

interface Props {
    channel: Channel;
    dmUser?: DMUser;
    gmUsers?: UserProfile[];
}

const AboutArea = ({channel, dmUser, gmUsers}: Props) => {
    return (
        <Container>
            {channel.type === Constants.DM_CHANNEL && dmUser && (
                <AboutAreaDM
                    channel={channel}
                    dmUser={dmUser}
                />
            )}
            {channel.type === Constants.GM_CHANNEL && gmUsers && (
                <AboutAreaGM
                    channel={channel}
                    gmUsers={gmUsers!}
                />
            )}
        </Container>
    );
};

export default AboutArea;

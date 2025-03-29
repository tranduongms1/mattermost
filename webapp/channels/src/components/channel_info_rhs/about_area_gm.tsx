// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import {Client4} from 'mattermost-redux/client';

import ProfilePicture from 'components/profile_picture';
import UserProfileElement from 'components/user_profile';

const Usernames = styled.p`
    font-family: Metropolis, sans-serif;
    font-size: 18px;
    line-height: 24px;
    color: rgb(var(--center-channel-color-rgb));
    font-weight: 600;
    margin: 0;
    text-align: center;
`;

const ProfilePictures = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
`;

interface ProfilePictureContainerProps {
    position: number;
}

const ProfilePictureContainer = styled.div<ProfilePictureContainerProps>`
    display: inline-block;
    position: relative;
    left: ${(props) => props.position * -15}px;

    & img {
        border: 2px solid white;
    }
`;

const UsersArea = styled.div`
    margin-bottom: 12px;
    &.ChannelPurpose--is-dm {
        margin-bottom: 16px;
    }
`;

interface Props {
    channel: Channel;
    gmUsers: UserProfile[];
}

const AboutAreaGM = ({channel, gmUsers}: Props) => {
    return (
        <UsersArea>
            <ProfilePictures>
                {gmUsers.map((user, idx) => (
                    <ProfilePictureContainer
                        key={user.id}
                        position={idx}
                    >
                        <ProfilePicture
                            src={Client4.getProfilePictureUrl(user.id, user.last_picture_update)}
                            size='xl'
                            userId={user.id}
                            username={user.username}
                            channelId={channel.id}
                        />
                    </ProfilePictureContainer>
                ))}
            </ProfilePictures>
            <Usernames>
                {gmUsers.map((user, i, {length}) => (
                    <React.Fragment key={user.id}>
                        <UserProfileElement
                            userId={user.id}
                            channelId={channel.id}
                        />
                        {(i + 1 !== length) && (<span>{', '}</span>)}
                    </React.Fragment>
                ))}
            </Usernames>
        </UsersArea>
    );
};

export default AboutAreaGM;

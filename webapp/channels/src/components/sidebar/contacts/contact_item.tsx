import React from 'react';
import styled from 'styled-components';

import type {UserProfile} from '@mattermost/types/users';

import {Client4} from 'mattermost-redux/client';

import CustomStatusEmoji from 'components/custom_status/custom_status_emoji';
import ProfilePicture from 'components/profile_picture';

import type {Contact} from './contacts';

const Avatar = styled.div`
    pointer-events: none;
    flex-basis: fit-content;
    flex-shrink: 0;
`;

const UserInfo = styled.div`
    display: flex;
    flex: 1;
    cursor: pointer;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const DisplayName = styled.span`
    display: inline;
    overflow: hidden;
    margin-left: 8px;
    color: var(--sidebar-text);
    font-size: 14px;
    gap: 8px;
    line-height: 20px;
    text-overflow: ellipsis;
`;

const SendMessage = styled.button`
    display: none;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    margin-left: 8px;
    background-color: transparent;
    border-radius: 4px;

    &:hover {
        background-color: rgba(var(--sidebar-color-rgb), 0.12);
    }

    .icon {
        color: var(--sidebar-text);
        font-size: 14px;
    };
`;

interface Props {
    className?: string;
    contact: Contact;
    actions: {
        openDirectMessage: (user: UserProfile) => void;
    };
}

const ContactItem = ({className, contact, actions}: Props) => {
    return (
        <div
            className={className}
            style={{height: '48px'}}
        >
            <span className='ProfileSpan'>
                <Avatar>
                    <ProfilePicture
                        size='sm'
                        status={contact.status}
                        isBot={contact.user.is_bot}
                        userId={contact.user.id}
                        username={contact.displayName}
                        src={Client4.getProfilePictureUrl(contact.user.id, contact.user.last_picture_update)}
                    />
                </Avatar>
                <UserInfo>
                    <DisplayName>
                        {contact.displayName}
                    </DisplayName>
                    <CustomStatusEmoji
                        userID={contact.user.id}
                        showTooltip={true}
                        emojiSize={16}
                        spanStyle={{
                            display: 'flex',
                            flex: '0 0 auto',
                            alignItems: 'center',
                        }}
                        emojiStyle={{
                            marginLeft: '8px',
                            alignItems: 'center',
                        }}
                    />
                </UserInfo>
            </span>
            <SendMessage onClick={() => actions.openDirectMessage(contact.user)}>
                <i className='icon icon-send'/>
            </SendMessage>
        </div>
    );
};

export default styled(ContactItem)`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px 16px;
    border-radius: 4px;

    &:hover {
        background: rgba(var(--sidebar-color-rgb), 0.08);
        color: rgba(var(--sidebar-color-rgb), 0.56);

        ${SendMessage} {
            display: block;
            flex: 0 0 auto;
        }
    }

    .ProfileSpan {
        display: flex;
        overflow: hidden;
        width: 100%;
        flex-direction: row;
        align-items: center;
        // This padding is to make sure the status icon doesnt get clipped off because of the overflow
        padding: 4px 0;
        margin-right: auto;
    }

    .MenuWrapper {
        font-size: 11px;
        font-weight: 600;
    }
`;

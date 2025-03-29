// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import type {MouseEvent, ReactNode, RefObject} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import type {IntlShape} from 'react-intl';

import type {Channel, ChannelMembership, ChannelNotifyProps} from '@mattermost/types/channels';
import type {UserCustomStatus, UserProfile} from '@mattermost/types/users';

import {memoizeResult} from 'mattermost-redux/utils/helpers';

import CustomStatusEmoji from 'components/custom_status/custom_status_emoji';
import CustomStatusText from 'components/custom_status/custom_status_text';
import EditChannelHeaderModal from 'components/edit_channel_header_modal';
import type {BaseOverlayTrigger} from 'components/overlay_trigger';
import Timestamp from 'components/timestamp';
import WithTooltip from 'components/with_tooltip';

import CallButton from 'plugins/call_button';
import ChannelHeaderPlug from 'plugins/channel_header_plug';
import {
    Constants,
    ModalIdentifiers,
    NotificationLevels,
    RHSStates,
} from 'utils/constants';
import {handleFormattedTextClick, isEmptyObject} from 'utils/utils';

import type {ModalData} from 'types/actions';
import type {RhsState} from 'types/store/rhs';

import ChannelHeaderTitle from './channel_header_title';
import ChannelInfoButton from './channel_info_button';
import HeaderIconWrapper from './components/header_icon_wrapper';

const headerMarkdownOptions = {singleline: true, mentionHighlight: false, atMentions: true};
const popoverMarkdownOptions = {singleline: false, mentionHighlight: false, atMentions: true};

export type Props = {
    teamId: string;
    currentUser: UserProfile;
    channel?: Channel;
    memberCount?: number;
    channelMember?: ChannelMembership;
    dmUser?: UserProfile;
    gmMembers?: UserProfile[];
    isReadOnly?: boolean;
    isMuted?: boolean;
    hasGuests?: boolean;
    rhsState?: RhsState;
    rhsOpen?: boolean;
    isQuickSwitcherOpen?: boolean;
    intl: IntlShape;
    pinnedPostsCount?: number;
    hasMoreThanOneTeam?: boolean;
    actions: {
        showPinnedPosts: (channelId?: string) => void;
        showChannelFiles: (channelId: string) => void;
        closeRightHandSide: () => void;
        getCustomEmojisInText: (text: string) => void;
        updateChannelNotifyProps: (userId: string, channelId: string, props: Partial<ChannelNotifyProps>) => void;
        goToLastViewedChannel: () => void;
        openModal: <P>(modalData: ModalData<P>) => void;
        showChannelMembers: (channelId: string, inEditingMode?: boolean) => void;
    };
    currentRelativeTeamUrl: string;
    announcementBarCount: number;
    customStatus?: UserCustomStatus;
    isCustomStatusEnabled: boolean;
    isCustomStatusExpired: boolean;
    isFileAttachmentsEnabled: boolean;
    isLastActiveEnabled: boolean;
    timestampUnits?: string[];
    lastActivityTimestamp?: number;
    hideGuestTags: boolean;
};

type State = {
    showChannelHeaderPopover: boolean;
    channelHeaderPoverWidth: number;
    leftOffset: number;
    topOffset: number;
};

class ChannelHeader extends React.PureComponent<Props, State> {
    toggleFavoriteRef: RefObject<HTMLButtonElement>;
    headerDescriptionRef: RefObject<HTMLSpanElement>;
    headerPopoverTextMeasurerRef: RefObject<HTMLDivElement>;
    headerOverlayRef: RefObject<BaseOverlayTrigger>;
    getHeaderMarkdownOptions: (channelNamesMap: Record<string, any>) => Record<string, any>;
    getPopoverMarkdownOptions: (channelNamesMap: Record<string, any>) => Record<string, any>;

    constructor(props: Props) {
        super(props);
        this.toggleFavoriteRef = React.createRef();
        this.headerDescriptionRef = React.createRef();
        this.headerPopoverTextMeasurerRef = React.createRef();
        this.headerOverlayRef = React.createRef();

        this.state = {
            showChannelHeaderPopover: false,
            channelHeaderPoverWidth: 0,
            leftOffset: 0,
            topOffset: 0,
        };

        this.getHeaderMarkdownOptions = memoizeResult((channelNamesMap: Record<string, any>) => (
            {...headerMarkdownOptions, channelNamesMap}
        ));
        this.getPopoverMarkdownOptions = memoizeResult((channelNamesMap: Record<string, any>) => (
            {...popoverMarkdownOptions, channelNamesMap}
        ));
    }

    componentDidMount() {
        this.props.actions.getCustomEmojisInText(this.props.channel ? this.props.channel.header : '');
    }

    componentDidUpdate(prevProps: Props) {
        const header = this.props.channel ? this.props.channel.header : '';
        const prevHeader = prevProps.channel ? prevProps.channel.header : '';
        if (header !== prevHeader) {
            this.props.actions.getCustomEmojisInText(header);
        }
    }

    handleClose = () => this.props.actions.goToLastViewedChannel();

    unmute = () => {
        const {actions, channel, channelMember, currentUser} = this.props;

        if (!channelMember || !currentUser || !channel) {
            return;
        }

        const options = {mark_unread: NotificationLevels.ALL};
        actions.updateChannelNotifyProps(currentUser.id, channel.id, options);
    };

    mute = () => {
        const {actions, channel, channelMember, currentUser} = this.props;

        if (!channelMember || !currentUser || !channel) {
            return;
        }

        const options = {mark_unread: NotificationLevels.MENTION};
        actions.updateChannelNotifyProps(currentUser.id, channel.id, options);
    };

    showPinnedPosts = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (this.props.rhsState === RHSStates.PIN) {
            this.props.actions.closeRightHandSide();
        } else {
            this.props.actions.showPinnedPosts();
        }
    };

    showChannelFiles = () => {
        if (this.props.rhsState === RHSStates.CHANNEL_FILES) {
            this.props.actions.closeRightHandSide();
        } else if (this.props.channel) {
            this.props.actions.showChannelFiles(this.props.channel.id);
        }
    };

    showEditChannelHeaderModal = () => {
        if (this.headerOverlayRef.current) {
            this.headerOverlayRef.current.hide();
        }

        const {actions, channel} = this.props;
        if (!channel) {
            return;
        }

        const modalData = {
            modalId: ModalIdentifiers.EDIT_CHANNEL_HEADER,
            dialogType: EditChannelHeaderModal,
            dialogProps: {channel},
        };

        actions.openModal(modalData);
    };

    showChannelHeaderPopover = (headerText: string) => {
        const headerDescriptionRect = this.headerDescriptionRef.current?.getBoundingClientRect();
        const headerPopoverTextMeasurerRect = this.headerPopoverTextMeasurerRef.current?.getBoundingClientRect();
        const announcementBarSize = 40;

        if (headerPopoverTextMeasurerRect && headerDescriptionRect) {
            if (headerPopoverTextMeasurerRect.width > headerDescriptionRect.width || headerText.match(/\n{2,}/g)) {
                const leftOffset = headerDescriptionRect.left - (this.props.hasMoreThanOneTeam ? 313 : 248);
                this.setState({showChannelHeaderPopover: true, leftOffset});
            }
        }

        // add 40px to take the global header into account
        const topOffset = (announcementBarSize * this.props.announcementBarCount) + 40;
        const channelHeaderPoverWidth = this.headerDescriptionRef.current?.clientWidth || 0 - (this.props.hasMoreThanOneTeam ? 64 : 0);

        this.setState({topOffset});
        this.setState({channelHeaderPoverWidth});
    };

    toggleChannelMembersRHS = () => {
        if (this.props.rhsState === RHSStates.CHANNEL_MEMBERS) {
            this.props.actions.closeRightHandSide();
        } else if (this.props.channel) {
            this.props.actions.showChannelMembers(this.props.channel.id);
        }
    };

    handleFormattedTextClick = (e: MouseEvent<HTMLSpanElement>) => handleFormattedTextClick(e, this.props.currentRelativeTeamUrl);

    renderCustomStatus = () => {
        const {customStatus, isCustomStatusEnabled, isCustomStatusExpired} = this.props;
        const isStatusSet = !isCustomStatusExpired && (customStatus?.text || customStatus?.emoji);
        if (!(isCustomStatusEnabled && isStatusSet)) {
            return null;
        }

        return (
            <div className='custom-emoji__wrapper'>
                <CustomStatusEmoji
                    userID={this.props.dmUser?.id}
                    showTooltip={true}
                    tooltipDirection='bottom'
                    emojiStyle={{
                        verticalAlign: 'top',
                        margin: '0 4px 1px',
                    }}
                />
                <CustomStatusText
                    text={customStatus?.text}
                    className='custom-emoji__text'
                />
            </div>
        );
    };

    render() {
        const {
            currentUser,
            gmMembers,
            channel,
            channelMember,
            isMuted: channelMuted,
            dmUser,
            rhsState,
            hasGuests,
            hideGuestTags,
        } = this.props;
        if (!channel) {
            return null;
        }

        const {formatMessage} = this.props.intl;
        const ariaLabelChannelHeader = this.props.intl.formatMessage({id: 'accessibility.sections.channelHeader', defaultMessage: 'channel header region'});

        let hasGuestsText: ReactNode = '';
        if (hasGuests && !hideGuestTags) {
            hasGuestsText = (
                <span className='has-guest-header'>
                    <span tabIndex={0}>
                        <FormattedMessage
                            id='channel_header.channelHasGuests'
                            defaultMessage='Channel has guests'
                        />
                    </span>
                </span>
            );
        }

        if (isEmptyObject(channel) ||
            isEmptyObject(channelMember) ||
            isEmptyObject(currentUser) ||
            (!dmUser && channel.type === Constants.DM_CHANNEL)
        ) {
            // Use an empty div to make sure the header's height stays constant
            return (
                <div className='channel-header'/>
            );
        }

        const isDirect = (channel.type === Constants.DM_CHANNEL);
        const isGroup = (channel.type === Constants.GM_CHANNEL);

        if (isGroup) {
            if (hasGuests && !hideGuestTags) {
                hasGuestsText = (
                    <span className='has-guest-header'>
                        <FormattedMessage
                            id='channel_header.groupMessageHasGuests'
                            defaultMessage='This group message has guests'
                        />
                    </span>
                );
            }
        }

        let dmHeaderTextStatus: ReactNode;
        if (isDirect && !dmUser?.delete_at && !dmUser?.is_bot) {
            dmHeaderTextStatus = (
                <span className='header-status__text'>
                    {this.renderCustomStatus()}
                </span>
            );

            if (this.props.isLastActiveEnabled && this.props.lastActivityTimestamp && this.props.timestampUnits) {
                dmHeaderTextStatus = (
                    <span className='header-status__text'>
                        <span className='last-active__text'>
                            <FormattedMessage
                                id='channel_header.lastActive'
                                defaultMessage='Active {timestamp}'
                                values={{
                                    timestamp: (
                                        <Timestamp
                                            value={this.props.lastActivityTimestamp}
                                            units={this.props.timestampUnits}
                                            useTime={false}
                                            style={'short'}
                                        />
                                    ),
                                }}
                            />
                        </span>
                        {this.renderCustomStatus()}
                    </span>
                );
            }
        }

        const channelFilesIconClass = classNames('channel-header__icon channel-header__icon--left btn btn-icon btn-xs ', {
            'channel-header__icon--active': rhsState === RHSStates.CHANNEL_FILES,
        });
        const channelFilesIcon = <i className='icon icon-file-text-outline'/>;
        const pinnedIconClass = classNames('channel-header__icon channel-header__icon--wide channel-header__icon--left btn btn-icon btn-xs', {
            'channel-header__icon--active': rhsState === RHSStates.PIN,
        });
        const pinnedIcon = this.props.pinnedPostsCount ? (
            <>
                <i
                    aria-hidden='true'
                    className='icon icon-pin-outline channel-header__pin'
                />
                <span
                    id='channelPinnedPostCountText'
                    className='icon__text'
                >
                    {this.props.pinnedPostsCount}
                </span>
            </>
        ) : (
            <i
                aria-hidden='true'
                className='icon icon-pin-outline channel-header__pin'
            />
        );

        const pinnedButton = this.props.pinnedPostsCount ? (
            <HeaderIconWrapper
                iconComponent={pinnedIcon}
                buttonClass={pinnedIconClass}
                buttonId={'channelHeaderPinButton'}
                onClick={this.showPinnedPosts}
                tooltip={this.props.intl.formatMessage({id: 'channel_header.pinnedPosts', defaultMessage: 'Pinned messages'})}
            />
        ) : (
            null
        );

        let memberListButton = null;
        if (!isDirect) {
            const membersIconClass = classNames('member-rhs__trigger channel-header__icon channel-header__icon--wide channel-header__icon--left btn btn-icon btn-xs', {
                'channel-header__icon--active': rhsState === RHSStates.CHANNEL_MEMBERS,
            });
            const membersIcon = this.props.memberCount ? (
                <>
                    <i
                        aria-hidden='true'
                        className='icon icon-account-outline channel-header__members'
                    />
                    <span
                        id='channelMemberCountText'
                        className='icon__text'
                    >
                        {this.props.memberCount}
                    </span>
                </>
            ) : (
                <>
                    <i
                        aria-hidden='true'
                        className='icon icon-account-outline channel-header__members'
                    />
                    <span
                        id='channelMemberCountText'
                        className='icon__text'
                    >
                        {'-'}
                    </span>
                </>
            );

            memberListButton = (
                <HeaderIconWrapper
                    iconComponent={membersIcon}
                    tooltip={this.props.intl.formatMessage({id: 'channel_header.channelMembers', defaultMessage: 'Members'})}
                    buttonClass={membersIconClass}
                    buttonId={'member_rhs'}
                    onClick={this.toggleChannelMembersRHS}
                />
            );
        }

        let headerTextContainer = (
            <div
                id='channelHeaderDescription'
                className='channel-header__description'
            >
                {dmHeaderTextStatus}
                {hasGuestsText}
            </div>
        );

        let muteTrigger;
        if (channelMuted) {
            muteTrigger = (
                <WithTooltip
                    id='channelMutedTooltip'
                    placement='bottom'
                    title={
                        <FormattedMessage
                            id='channelHeader.unmute'
                            defaultMessage='Unmute'
                        />
                    }
                >
                    <button
                        id='toggleMute'
                        onClick={this.unmute}
                        className={'channel-header__mute inactive btn btn-icon btn-xs'}
                        aria-label={formatMessage({id: 'generic_icons.muted', defaultMessage: 'Muted Icon'})}
                    >
                        <i className={'icon icon-bell-off-outline'}/>
                    </button>
                </WithTooltip>
            );
        }

        return (
            <div
                id='channel-header'
                aria-label={ariaLabelChannelHeader}
                role='banner'
                tabIndex={-1}
                data-channelid={`${channel.id}`}
                className='channel-header alt a11y__region'
                data-a11y-sort-order='8'
            >
                <div className='flex-parent'>
                    <div className='flex-child'>
                        <div
                            id='channelHeaderInfo'
                            className='channel-header__info'
                        >
                            <div
                                className='channel-header__title dropdown'
                            >
                                <ChannelHeaderTitle
                                    dmUser={dmUser}
                                    gmMembers={gmMembers}
                                />
                                <div
                                    className='channel-header__icons'
                                >
                                    {muteTrigger}
                                    {memberListButton}
                                    {pinnedButton}
                                    {this.props.isFileAttachmentsEnabled &&
                                        <HeaderIconWrapper
                                            iconComponent={channelFilesIcon}
                                            buttonClass={channelFilesIconClass}
                                            buttonId={'channelHeaderFilesButton'}
                                            onClick={this.showChannelFiles}
                                            tooltip={this.props.intl.formatMessage({id: 'channel_header.channelFiles', defaultMessage: 'Channel files'})}
                                        />
                                    }
                                </div>
                                {headerTextContainer}
                            </div>
                        </div>
                    </div>
                    <ChannelHeaderPlug
                        channel={channel}
                        channelMember={channelMember}
                    />
                    <CallButton/>
                    <ChannelInfoButton channel={channel}/>
                </div>
            </div>
        );
    }
}

export default injectIntl(ChannelHeader);

import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';
import type {ActionResult} from 'mattermost-redux/types/actions';

import LoadingSpinner from 'components/widgets/loading/loading_spinner';

import type {ChannelStats} from 'types/store/channels';

const MenuItemContainer = styled.div`
    padding: 8px 16px;
    flex: 1;
    display: flex;
`;

const Icon = styled.div`
    color: rgba(var(--center-channel-color-rgb), 0.64);
`;

const MenuItemText = styled.div`
    flex: 1;
    &:not(:first-child) {
        margin-left: 8px;
    }
`;

const RightSide = styled.div`
    display: flex;
    color: rgba(var(--center-channel-color-rgb), 0.75);
`;

const Badge = styled.div`
    font-size: 12px;
    line-height: 18px;
    width: 20px;
    display: flex;
    place-content: center;
`;

interface MenuItemProps {
    text: string;
    className?: string;
    opensSubpanel?: boolean;
    badge?: string | number | JSX.Element;
    onClick: () => void;
}

const menuItem = ({text, className, opensSubpanel, badge, onClick}: MenuItemProps) => {
    const hasRightSide = (badge !== undefined) || opensSubpanel;

    return (
        <div className={className}>
            <MenuItemContainer onClick={onClick}>
                <MenuItemText>
                    {text}
                </MenuItemText>

                {hasRightSide && (
                    <RightSide>
                        {badge !== undefined && (
                            <Badge>{badge}</Badge>
                        )}
                        {opensSubpanel && (
                            <Icon><i className='icon icon-chevron-right'/></Icon>
                        )}
                    </RightSide>
                )}
            </MenuItemContainer>
        </div>
    );
};

const MenuItem = styled(menuItem)`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    width: 100%;
    height: 40px;
    background-color: rgba(var(--center-channel-color-rgb), 0.04);

    &:hover {
       background: rgba(var(--center-channel-color-rgb), 0.08);
    }

    &:first-child {
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
    }

    &:last-child {
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
    }
`;

const Group = styled.div`
    width: 100%;
    padding: 8px 16px;
    margin-bottom: -20px;
`;

const GroupTitle = styled.div`
    color: #FFF;
    border-radius: 12px;
    width: fit-content;
    padding: 4px 16px 24px 16px;
`;

const GroupContent = styled.div`
    background: var(--center-channel-bg);
    border-radius: 16px;
    translate: 0 -20px;
`;

interface MenuProps {
    channel: Channel;
    channelStats: ChannelStats;

    className?: string;

    actions: {
        getChannelStats: (channelId: string) => Promise<ActionResult<ChannelStats>>;
        showChannelDoneTroubles: (channelId: string) => void;
        showChannelCompletedTroubles: (channelId: string) => void;
        showChannelDoneIssues: (channelId: string) => void;
        showChannelCompletedIssues: (channelId: string) => void;
    };
}

const Menu = ({channel, channelStats, className, actions}: MenuProps) => {
    const [loadingStats, setLoadingStats] = useState(true);
    const {doneTroublesCount, completedTroublesCount, doneIssuesCount, completedIssuesCount} = channelStats;

    useEffect(() => {
        actions.getChannelStats(channel.id).then(() => {
            setLoadingStats(false);
        });
        return () => {
            setLoadingStats(true);
        };
    }, [channel.id]);

    return (
        <div className={className}>
            <Group>
                <GroupTitle style={{ background: '#FF922D' }}>Trouble</GroupTitle>
                <GroupContent>
                    <MenuItem
                        text='Đã xử lý, chờ nghiệm thu'
                        opensSubpanel={true}
                        badge={loadingStats ? <LoadingSpinner/> : doneTroublesCount}
                        onClick={() => actions.showChannelDoneTroubles(channel.id)}
                    />
                    <MenuItem
                        text='Đã nghiệm thu xong'
                        opensSubpanel={true}
                        badge={loadingStats ? <LoadingSpinner/> : completedTroublesCount}
                        onClick={() => actions.showChannelCompletedTroubles(channel.id)}
                    />
                </GroupContent>
            </Group>
            <Group>
                <GroupTitle style={{ background: '#FAC300' }}>Sự cố</GroupTitle>
                <GroupContent>
                    <MenuItem
                        text='Đã báo xong, chờ nghiệm thu'
                        opensSubpanel={true}
                        badge={loadingStats ? <LoadingSpinner/> : doneIssuesCount}
                        onClick={() => actions.showChannelDoneIssues(channel.id)}
                    />
                    <MenuItem
                        text='Đã nghiệm thu xong'
                        opensSubpanel={true}
                        badge={loadingStats ? <LoadingSpinner/> : completedIssuesCount}
                        onClick={() => actions.showChannelCompletedIssues(channel.id)}
                    />
                </GroupContent>
            </Group>
        </div>
    );
};

const StyledMenu = styled(Menu)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
    padding: 8px 0;

    font-size: 14px;
    line-height: 20px;s
    background-color: rgba(var(--center-channel-color-rgb), 0.08);
`;

export default StyledMenu;

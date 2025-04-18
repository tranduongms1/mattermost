import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';

import {
    closeRightHandSide,
    showChannelDoneTasks,
    showChannelIssues,
    showChannelPlans,
    showChannelRecurringTasks,
    showChannelTroubles,
} from 'actions/views/rhs';
import {EMPTY_CHANNEL_STATS, getCurrentChannelStats} from 'selectors/channels';
import {getIsRhsOpen, getRhsState} from 'selectors/rhs';
import {isOfficialChannel} from 'utils/channel_utils';
import {RHSStates} from 'utils/constants';

import type {RhsState} from 'types/store/rhs';

import HeaderIconWrapper from './components/header_icon_wrapper';

export const Count = styled.span`
    position: absolute;
    top: -8px;
    right: -8px;
    padding: 3px;
    font-size: 10px;
    line-height: 1;
    min-width: 16px;
    color: white;
    background: red;
    border-radius: 100%;
`;

interface Props {
    channel: Channel;
}

const TechnicalActions = ({channel}: Props) => {
    const dispatch = useDispatch();
    const rhsState: RhsState = useSelector(getRhsState);
    const isRhsOpen: boolean = useSelector(getIsRhsOpen);
    const channelStats = useSelector(getCurrentChannelStats) || EMPTY_CHANNEL_STATS;
    const {issuesCount, troublesCount, plansCount, recurringTasksCount, doneTroublesCount, completedTroublesCount, doneIssuesCount, completedIssuesCount} = channelStats;
    const doneCount = doneTroublesCount + completedTroublesCount + doneIssuesCount + completedIssuesCount;

    const getButtonClass = useCallback((isActive: boolean) => {
        let buttonClass = 'channel-header__icon outline';
        if (isRhsOpen && isActive) {
            buttonClass += ' channel-header__icon--active-inverted';
        }
        return buttonClass;
    }, [isRhsOpen, rhsState]);

    const isTroubles = rhsState === RHSStates.CHANNEL_TROUBLES;

    const onTroublesClick = useCallback(() => {
        if (isRhsOpen && isTroubles) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelTroubles(channel.id));
        }
    }, [channel.id, isRhsOpen, isTroubles, dispatch]);

    const isIssues = rhsState === RHSStates.CHANNEL_ISSUES;

    const onIssuesClick = useCallback(() => {
        if (isRhsOpen && isIssues) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelIssues(channel.id));
        }
    }, [channel.id, isRhsOpen, isIssues, dispatch]);

    const isRecurringTasks = rhsState === RHSStates.CHANNEL_RECURRING_TASKS;

    const onRecurringTasksClick = useCallback(() => {
        if (isRhsOpen && isRecurringTasks) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelRecurringTasks(channel.id));
        }
    }, [channel.id, isRhsOpen, isRecurringTasks, dispatch]);

    const isPlans = rhsState === RHSStates.CHANNEL_PLANS;

    const onPlansClick = useCallback(() => {
        if (isRhsOpen && isPlans) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelPlans(channel.id));
        }
    }, [channel.id, isRhsOpen, isPlans, dispatch]);

    const isDoneTasks = [
        RHSStates.CHANNEL_DONE_TASKS,
        RHSStates.CHANNEL_DONE_TROUBLES,
        RHSStates.CHANNEL_COMPLETED_TROUBLES,
        RHSStates.CHANNEL_DONE_ISSUES,
        RHSStates.CHANNEL_COMPLETED_ISSUES,
    ].includes(rhsState as any);

    const onDoneTasksClick = useCallback(() => {
        if (isRhsOpen && isDoneTasks) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showChannelDoneTasks(channel.id));
        }
    }, [channel.id, isRhsOpen, isDoneTasks, dispatch]);

    if (!isOfficialChannel(channel)) return null;

    return (
        <React.Fragment>
            <HeaderIconWrapper
                buttonId='troubles'
                buttonClass={getButtonClass(isTroubles)}
                tooltip='Trouble'
                iconComponent={(
                    <React.Fragment>
                        <span>Trouble</span>
                        {issuesCount > 0 &&
                        <Count>{issuesCount}</Count>
                        }
                    </React.Fragment>
                )}
                onClick={onTroublesClick}
            />
            <HeaderIconWrapper
                buttonId='issues'
                buttonClass={getButtonClass(isIssues)}
                tooltip='Sự cố'
                iconComponent={(
                    <React.Fragment>
                        <span>Sự cố</span>
                        {troublesCount > 0 &&
                        <Count>{troublesCount}</Count>
                        }
                    </React.Fragment>
                )}
                onClick={onIssuesClick}
            />
            <HeaderIconWrapper
                buttonId='recurringTasks'
                buttonClass={getButtonClass(isRecurringTasks)}
                tooltip='Định kỳ'
                iconComponent={(
                    <React.Fragment>
                        <span>Định kỳ</span>
                        {recurringTasksCount > 0 &&
                        <Count>{recurringTasksCount}</Count>
                        }
                    </React.Fragment>
                )}
                onClick={onRecurringTasksClick}
            />
            <HeaderIconWrapper
                buttonId='plans'
                buttonClass={getButtonClass(isPlans)}
                tooltip='Kế hoạch'
                iconComponent={(
                    <React.Fragment>
                        <span>Kế hoạch</span>
                        {plansCount > 0 &&
                        <Count>{plansCount}</Count>
                        }
                    </React.Fragment>
                )}
                onClick={onPlansClick}
            />
            <HeaderIconWrapper
                buttonId='doneTasks'
                buttonClass={getButtonClass(isDoneTasks)}
                tooltip='Xong'
                iconComponent={(
                    <React.Fragment>
                        <span>Xong</span>
                        {doneCount > 0 &&
                        <Count>{doneCount}</Count>
                        }
                    </React.Fragment>
                )}
                onClick={onDoneTasksClick}
            />
        </React.Fragment>
    );
};

export default TechnicalActions;

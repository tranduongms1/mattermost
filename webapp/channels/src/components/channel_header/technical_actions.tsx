import React, {useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';

import {getChannelStats} from 'actions/task_actions';
import {closeRightHandSide, updateRhsStateWithStatuses} from 'actions/views/rhs';
import {getCurrentChannelStats} from 'selectors/tasks';
import {getIsRhsOpen, getRhsState, getSelectedChannelId, getStatuses} from 'selectors/rhs';
import {isOfficialChannel} from 'utils/channel_utils';
import {RHSStates} from 'utils/constants';

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
    const rhsState = useSelector(getRhsState);
    const isRhsOpen = useSelector(getIsRhsOpen);
    const currentChannelId = useSelector(getCurrentChannelId);
    const selectedChannelId = useSelector(getSelectedChannelId);
    const statuses = useSelector(getStatuses);
    const channelStats = useSelector(getCurrentChannelStats);
    const {issuesCount, troublesCount, plansCount, recurringTasksCount, doneTroublesCount, doneIssuesCount, donePlansCount} = channelStats;
    const doneCount = doneTroublesCount + doneIssuesCount + donePlansCount;

    useEffect(() => {
        dispatch(getChannelStats(currentChannelId));
    }, [currentChannelId]);

    const getButtonClass = useCallback((isActive: boolean) => {
        let buttonClass = 'channel-header__icon outline';
        if (isRhsOpen && isActive) {
            buttonClass += ' channel-header__icon--active-inverted';
        }
        return buttonClass;
    }, [isRhsOpen, rhsState]);

    const openRHS = useCallback((rhsState: string, statuses: string[]) => {
        dispatch(updateRhsStateWithStatuses(rhsState, statuses));
    }, []);

    const isTroubles = rhsState === RHSStates.CHANNEL_TROUBLES && statuses[0] === 'new';

    const onTroublesClick = useCallback(() => {
        if (isRhsOpen && isTroubles) {
            dispatch(closeRightHandSide());
        } else {
            openRHS(RHSStates.CHANNEL_TROUBLES, ['new', 'confirmed']);
        }
    }, [isRhsOpen, isTroubles, dispatch]);

    const isIssues = rhsState === RHSStates.CHANNEL_ISSUES && statuses[0] === 'new';

    const onIssuesClick = useCallback(() => {
        if (isRhsOpen && isIssues) {
            dispatch(closeRightHandSide());
        } else {
            openRHS(RHSStates.CHANNEL_ISSUES, ['new', 'confirmed']);
        }
    }, [isRhsOpen, isIssues, dispatch]);

    const isRecurringTasks = rhsState === RHSStates.CHANNEL_RECURRING_TASKS;

    const onRecurringTasksClick = useCallback(() => {
        if (isRhsOpen && isRecurringTasks) {
            dispatch(closeRightHandSide());
        } else {
            openRHS(RHSStates.CHANNEL_RECURRING_TASKS, ['new', 'confirmed']);
        }
    }, [isRhsOpen, isRecurringTasks, dispatch]);

    const isPlans = rhsState === RHSStates.CHANNEL_PLANS && statuses[0] === 'new';

    const onPlansClick = useCallback(() => {
        if (isRhsOpen && isPlans) {
            dispatch(closeRightHandSide());
        } else {
            openRHS(RHSStates.CHANNEL_PLANS, ['new', 'confirmed']);
        }
    }, [isRhsOpen, isPlans, dispatch]);

    const isDoneTasks = rhsState === RHSStates.CHANNEL_DONE_TASKS;

    const onDoneTasksClick = useCallback(() => {
        if (isRhsOpen && isDoneTasks) {
            dispatch(closeRightHandSide());
        } else {
            openRHS(RHSStates.CHANNEL_DONE_TASKS, []);
        }
    }, [isRhsOpen, isDoneTasks, dispatch]);

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
                        {troublesCount > 0 &&
                        <Count>{troublesCount}</Count>
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
                        {issuesCount > 0 &&
                        <Count>{issuesCount}</Count>
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

import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {getTechnicalStats} from 'actions/task_actions';
import {updateRhsStateWithStatuses} from 'actions/views/rhs';
import Header from 'components/sidebar_right/header';
import LoadingSpinner from 'components/widgets/loading/loading_spinner';
import {EMPTY_STATS} from 'reducers/tasks';
import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

const Menu = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
    padding: 8px 0;
    overflow-y: auto;

    font-size: 14px;
    line-height: 20px;s
    background-color: rgba(var(--center-channel-color-rgb), 0.08);
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

function TechnicalTasksRHS() {
    const dispatch = useDispatch();
    const stats = useSelector((state: GlobalState) => state.tasks.technicalStats);
    const loading = stats === EMPTY_STATS;

    useEffect(() => {
        dispatch(getTechnicalStats());
    }, []);

    const openRHS = (rhsState: string, statuses: string[]) => {
        dispatch(updateRhsStateWithStatuses(rhsState, statuses, RHSStates.TECHNICAL_TASKS));
    }

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title='Công việc kỹ thuật'
            />
            <Menu>
                <Group>
                    <GroupTitle style={{ background: '#FF922D' }}>Trouble</GroupTitle>
                    <GroupContent>
                        <MenuItem
                            text='Chờ xử lý'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.troublesCount}
                            onClick={() => openRHS(RHSStates.MY_TROUBLES, ['new', 'confirmed'])}
                        />
                        <MenuItem
                            text='Đã xử lý, chờ nghiệm thu'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.doneTroublesCount}
                            onClick={() => openRHS(RHSStates.MY_TROUBLES, ['done'])}
                        />
                        <MenuItem
                            text='Đã nghiệm thu xong'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.completedTroublesCount}
                            onClick={() => openRHS(RHSStates.MY_TROUBLES, ['completed'])}
                        />
                    </GroupContent>
                </Group>
                <Group>
                    <GroupTitle style={{ background: '#FAC300' }}>Sự cố</GroupTitle>
                    <GroupContent>
                        <MenuItem
                            text='Chờ xử lý'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.issuesCount}
                            onClick={() => openRHS(RHSStates.MY_ISSUES, ['new', 'confirmed'])}
                        />
                        <MenuItem
                            text='Đã báo xong, chờ nghiệm thu'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.doneIssuesCount}
                            onClick={() => openRHS(RHSStates.MY_ISSUES, ['done'])}
                        />
                        <MenuItem
                            text='Đã nghiệm thu xong'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.completedIssuesCount}
                            onClick={() => openRHS(RHSStates.MY_ISSUES, ['completed'])}
                        />
                    </GroupContent>
                </Group>
                <Group>
                    <GroupTitle style={{ background: '#039990' }}>Việc kế hoạch</GroupTitle>
                    <GroupContent>
                        <MenuItem
                            text='Đang triển khai'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.plansCount}
                            onClick={() => openRHS(RHSStates.MY_PLANS, ['new', 'confirmed'])}
                        />
                        <MenuItem
                            text='Đã báo xong, chờ nghiệm thu'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.donePlansCount}
                            onClick={() => openRHS(RHSStates.MY_PLANS, ['done'])}
                        />
                        <MenuItem
                            text='Đã nghiệm thu xong'
                            opensSubpanel={true}
                            badge={loading ? <LoadingSpinner/> : stats.completedPlansCount}
                            onClick={() => openRHS(RHSStates.MY_PLANS, ['completed'])}
                        />
                    </GroupContent>
                </Group>
            </Menu>
        </div>
    );
}

export default TechnicalTasksRHS;

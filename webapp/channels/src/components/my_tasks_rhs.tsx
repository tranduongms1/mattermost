import React, {useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {getMyTasks, getMyTaskStats} from 'actions/task_actions';
import {openModal} from 'actions/views/modals';
import HeaderIconWrapper from 'components/channel_header/components/header_icon_wrapper';
import CreateTaskModal from 'components/create_task_modal';
import PostListRHS from 'components/post_list_rhs';
import Header from 'components/sidebar_right/header';
import {ModalIdentifiers} from 'utils/constants';
import {useWebSocket} from 'utils/use_websocket';

import type {GlobalState} from 'types/store';

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

export const Tabs = styled.div`
    display: flex;
    width: 100%;
    padding: 12px 4px 0 4px;
    justify-content: space-evenly;
`;

export const Button = styled.button.attrs({className: 'btn btn-primary'})`
    margin: 4px 16px;
`;

export default function MyTasksRHS() {
    const dispatch = useDispatch();
    const [tabIndex, setTabIndex] = useState(1);
    const stats = useSelector((state: GlobalState) => state.tasks.myTaskStats);
    const {fromMeCount, toMeCount, isManagerCount, doneCount} = stats;

    useEffect(() => {
        dispatch(getMyTaskStats());
    }, []);

    let type = useMemo(() => {
        switch (tabIndex) {
        case 0:
            return 'from_me';
        case 1:
            return 'to_me';
        case 2:
            return 'is_manager';
        default:
            return 'task';
        }
    }, [tabIndex]);
    const statuses = useMemo(() => {
        switch (tabIndex) {
        case 3:
            return ['done'];
        case 4:
            return ['completed'];
        default:
            return ['new', 'confirmed'];
        }
    }, [tabIndex]);

    useEffect(() => {
        dispatch(getMyTasks(type, statuses));
    }, [type, statuses]);

    useWebSocket({
        handler: (msg) => {
            if (msg.event === 'posted') {
                const post = JSON.parse(msg.data.post);
                const {type, props: {task_type}} = post;
                if (type === 'custom_task' || (type === 'custom_task_updated' && task_type === 'task')) {
                    dispatch(getMyTaskStats());
                }
            }
        }
    });

    const getButtonClass = (isActive: boolean) => {
        let buttonClass = 'channel-header__icon outline';
        if (isActive) {
            buttonClass += ' channel-header__icon--active-inverted';
        }
        return buttonClass;
    }

    const openCreateTaskModal = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_TASK,
        dialogType: CreateTaskModal,
    }));

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title={'Việc cá nhân'}
            />
            <Tabs>
                <HeaderIconWrapper
                    buttonId='outTab'
                    buttonClass={getButtonClass(tabIndex === 0)}
                    tooltip='Tôi giao'
                    iconComponent={(
                        <React.Fragment>
                            <span>Tôi giao</span>
                            {fromMeCount > 0 &&
                            <Count>{fromMeCount}</Count>
                            }
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(0)}
                />
                <HeaderIconWrapper
                    buttonId='inTab'
                    buttonClass={getButtonClass(tabIndex === 1)}
                    tooltip='Cần làm'
                    iconComponent={(
                        <React.Fragment>
                            <span>Cần làm</span>
                            {toMeCount > 0 &&
                            <Count>{toMeCount}</Count>
                            }
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(1)}
                />
                <HeaderIconWrapper
                    buttonId='managerTab'
                    buttonClass={getButtonClass(tabIndex === 2)}
                    tooltip='Quản lý'
                    iconComponent={(
                        <React.Fragment>
                            <span>Quản lý</span>
                            {isManagerCount > 0 &&
                            <Count>{isManagerCount}</Count>
                            }
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(2)}
                />
                <HeaderIconWrapper
                    buttonId='doneTab'
                    buttonClass={getButtonClass(tabIndex === 3)}
                    tooltip='Nghiệm thu'
                    iconComponent={(
                        <React.Fragment>
                            <span>Nghiệm thu</span>
                            {doneCount > 0 &&
                            <Count>{doneCount}</Count>
                            }
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(3)}
                />
                <HeaderIconWrapper
                    buttonId='completedTab'
                    buttonClass={getButtonClass(tabIndex === 4)}
                    tooltip='Xong'
                    iconComponent={(
                        <span>Xong</span>
                    )}
                    onClick={() => setTabIndex(4)}
                />
            </Tabs>
            <PostListRHS
                type='custom_task'
                statuses={statuses}
                fromMe={tabIndex === 0}
                toMe={tabIndex === 1}
                isManager={tabIndex === 2}
            />
            <Button onClick={openCreateTaskModal}>
                Công việc mới
            </Button>
        </div>
    );
}

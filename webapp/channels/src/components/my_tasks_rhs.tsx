import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import styled from 'styled-components';

import {openModal} from 'actions/views/modals';
import HeaderIconWrapper from 'components/channel_header/components/header_icon_wrapper';
import CreateTaskModal from 'components/create_task_modal';
import PostListRHS from 'components/post_list_rhs';
import Header from 'components/sidebar_right/header';
import {ModalIdentifiers} from 'utils/constants';

export const Tabs = styled.div`
    display: flex;
    width: 100%;
    padding: 12px 4px;
    justify-content: space-evenly;
`;

export const Button = styled.button.attrs({className: 'btn btn-primary'})`
    margin: 4px 16px;
`;

export default function MyTasksRHS() {
    const dispatch = useDispatch();
    const [tabIndex, setTabIndex] = useState(0);

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
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(2)}
                />
                <HeaderIconWrapper
                    buttonId='doneTab'
                    buttonClass={getButtonClass(tabIndex === 3)}
                    tooltip='Xong'
                    iconComponent={(
                        <React.Fragment>
                            <span>Xong</span>
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(3)}
                />
                <HeaderIconWrapper
                    buttonId='draftTab'
                    buttonClass={getButtonClass(tabIndex === 4)}
                    tooltip='Nháp'
                    iconComponent={(
                        <React.Fragment>
                            <span>Nháp</span>
                        </React.Fragment>
                    )}
                    onClick={() => setTabIndex(4)}
                />
            </Tabs>
            <PostListRHS
                type='custom_task'
                statuses={[]}
            />
            <Button onClick={openCreateTaskModal}>
                Công việc mới
            </Button>
        </div>
    );
}

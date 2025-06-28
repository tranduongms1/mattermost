import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {getMyTasks} from 'actions/task_actions';
import {openModal} from 'actions/views/modals';
import CreatePlanModal from 'components/create_plan_modal';
import PostListRHS from 'components/post_list_rhs';
import Header from 'components/sidebar_right/header';
import {getPreviousRhsState, getStatuses} from 'selectors/rhs';
import {ModalIdentifiers, RHSStates} from 'utils/constants';

export const Button = styled.button.attrs({className: 'btn btn-primary'})`
    margin: 4px 16px;
`;

export default function MyPlansRHS() {
    const dispatch = useDispatch();
    const statuses = useSelector(getStatuses);
    const prevRhsState = useSelector(getPreviousRhsState);

    useEffect(() => {
        dispatch(getMyTasks('plan', statuses));
    }, [statuses]);

    let title;
    switch (statuses[0]) {
        case 'done':
            title = 'Kế hoạch chờ nghiệm thu';
            break;
        case 'completed':
            title = 'Kế hoạch đã nghiệm thu';
            break;
        default:
            title = 'Kế hoạch đang triển khai';
            break;
    }
    const hasPrevState = prevRhsState === RHSStates.TECHNICAL_TASKS;

    const openCreatePlanModal = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_PLAN,
        dialogType: CreatePlanModal,
    }));

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title={title}
                canGoBack={hasPrevState}
            />
            <PostListRHS
                type='custom_plan'
                statuses={statuses}
            />
            <Button onClick={openCreatePlanModal}>
                Tạo kế hoạch
            </Button>
        </div>
    );
}

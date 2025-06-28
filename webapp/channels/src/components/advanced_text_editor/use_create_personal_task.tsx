import React from 'react';
import {useDispatch} from 'react-redux';

import {openModal} from 'actions/views/modals';
import CreateTaskModal from 'components/create_task_modal';
import {ModalIdentifiers} from 'utils/constants';

import {IconContainer} from './formatting_bar/formatting_icon';

const useCreatePersonalTask = (location: string) => {
    const dispatch = useDispatch();

    const onClick = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_TASK,
        dialogType: CreateTaskModal,
    }));

    if (location !== 'CENTER') return null;

    return (
        <IconContainer
            type='button'
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx='12' cy='12' r='11' stroke='currentColor' strokeWidth='2'/>
                <line x1='12' y1='6' x2='12' y2='18' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/>
                <line x1='6' y1='12' x2='18' y2='12' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/>
            </svg>
        </IconContainer>
    );
};

export default useCreatePersonalTask;

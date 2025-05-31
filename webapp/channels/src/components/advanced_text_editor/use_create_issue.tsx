import React from 'react';
import {useDispatch} from 'react-redux';

import {openModal} from 'actions/views/modals';
import CreateIssueModal from 'components/create_issue_modal';
import {ModalIdentifiers} from 'utils/constants';

import {IconContainer} from './formatting_bar/formatting_icon';

const useCreateIssue = (location: string) => {
    const dispatch = useDispatch();

    const onClick = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_ISSUE,
        dialogType: CreateIssueModal,
    }));

    if (location !== 'CENTER') return null;

    return (
        <IconContainer
            type='button'
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 26 26" fill="none">
                <path d="M26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13Z" fill="#FAC300" />
                <path d="M13.9475 15H13.0525C12.7956 15 12.5805 14.8054 12.555 14.5498L11.555 4.54975C11.5255 4.25541 11.7567 4 12.0525 4H14.9475C15.2433 4 15.4745 4.25541 15.445 4.54975L14.445 14.5498C14.4195 14.8054 14.2044 15 13.9475 15Z" fill="#444444" />
                <path d="M16 19C16 20.3807 14.8807 21.5 13.5 21.5C12.1193 21.5 11 20.3807 11 19C11 17.6193 12.1193 16.5 13.5 16.5C14.8807 16.5 16 17.6193 16 19Z" fill="#444444" />
            </svg>
        </IconContainer>
    );
};

export default useCreateIssue;

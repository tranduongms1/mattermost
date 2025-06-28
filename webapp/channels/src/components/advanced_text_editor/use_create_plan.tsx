import React from 'react';
import {useDispatch} from 'react-redux';

import {Channel} from '@mattermost/types/channels';

import {openModal} from 'actions/views/modals';
import CreatePlanModal from 'components/create_plan_modal';
import {ModalIdentifiers} from 'utils/constants';
import {isOfficialChannel} from 'utils/channel_utils';

import {IconContainer} from './formatting_bar/formatting_icon';

const useCreatePlan = (channel: Channel | undefined, location: string) => {
    const dispatch = useDispatch();

    const onClick = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_PLAN,
        dialogType: CreatePlanModal,
    }));

    if (!channel || location !== 'CENTER') return null;
    if (!isOfficialChannel(channel)) return null;

    return (
        <IconContainer
            type='button'
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 16 16" fill="none">
                <path d="M13.642 1.6H10.3393C10.0074 0.672 9.13827 0 8.11111 0C7.08395 0 6.21482 0.672 5.88296 1.6H2.58025C1.71111 1.6 1 2.32 1 3.2V14.4C1 15.28 1.71111 16 2.58025 16H13.642C14.5111 16 15.2222 15.28 15.2222 14.4V3.2C15.2222 2.32 14.5111 1.6 13.642 1.6ZM8.11111 1.6C8.54568 1.6 8.90124 1.96 8.90124 2.4C8.90124 2.84 8.54568 3.2 8.11111 3.2C7.67654 3.2 7.32099 2.84 7.32099 2.4C7.32099 1.96 7.67654 1.6 8.11111 1.6ZM9.69136 12.8H4.16049V11.2H9.69136V12.8ZM12.0617 9.6H4.16049V8H12.0617V9.6ZM12.0617 6.4H4.16049V4.8H12.0617V6.4Z" fill="#039990" />
            </svg>
        </IconContainer>
    );
};

export default useCreatePlan;

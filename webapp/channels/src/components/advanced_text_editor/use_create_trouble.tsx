import React from 'react';
import {useDispatch} from 'react-redux';

import {openModal} from 'actions/views/modals';
import CreateTroubleModal from 'components/create_trouble_modal';
import {ModalIdentifiers} from 'utils/constants';

import {IconContainer} from './formatting_bar/formatting_icon';

const useCreateTrouble = (location: string) => {
    const dispatch = useDispatch();

    const onClick = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_TROUBLE,
        dialogType: CreateTroubleModal,
    }));

    if (location !== 'CENTER') return null;

    return (
        <IconContainer
            type='button'
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 26 26" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M13 26C20.1797 26 26 20.1797 26 13C26 5.8203 20.1797 0 13 0C5.8203 0 0 5.8203 0 13C0 20.1797 5.8203 26 13 26ZM9.62986 15.3399H12.5C12.7357 15.3399 12.8536 15.3399 12.9268 15.4131C13 15.4863 13 15.6041 13 15.8399V22.4297C13 23.3204 13 23.7657 13.1962 23.8089C13.3925 23.8522 13.5795 23.448 13.9537 22.6398L18.1851 13.5001C18.7768 12.222 19.0726 11.5829 18.7777 11.1214C18.4828 10.6599 17.7786 10.6599 16.3701 10.6599H13.5C13.2643 10.6599 13.1464 10.6599 13.0732 10.5866C13 10.5134 13 10.3956 13 10.1599V3.56998C13 2.67932 13 2.23399 12.8038 2.19077C12.6075 2.14755 12.4205 2.55167 12.0463 3.35992L7.81493 12.4996C7.22321 13.7777 6.92735 14.4168 7.22228 14.8783C7.51721 15.3399 8.22143 15.3399 9.62986 15.3399Z" fill="#FF7A00" />
            </svg>
        </IconContainer>
    );
};

export default useCreateTrouble;

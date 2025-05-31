import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import IconButton from '@mattermost/compass-components/components/icon-button';

import {closeRightHandSide, updateRhsState} from 'actions/views/rhs';
import {getRhsState} from 'selectors/rhs';
import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

const MyTasksButton = () => {
    const dispatch = useDispatch();
    const rhsState = useSelector((state: GlobalState) => getRhsState(state));

    const toggled = rhsState === RHSStates.MY_TASKS;

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (toggled) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(updateRhsState(RHSStates.MY_TASKS));
        }
    };

    return (
        <IconButton
            size={'sm'}
            icon={'product-playbooks'}
            toggled={toggled}
            onClick={onClick}
            inverted={true}
            compact={true}
        />
    );
}

export default MyTasksButton;

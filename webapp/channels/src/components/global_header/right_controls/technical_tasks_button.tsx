import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import IconButton from '@mattermost/compass-components/components/icon-button/IconButton.root';

import {closeRightHandSide, updateRhsState} from 'actions/views/rhs';
import {getRhsState, getSelectedChannelId} from 'selectors/rhs';
import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

const TechnicalTasksButton = () => {
    const dispatch = useDispatch();
    const rhsState = useSelector((state: GlobalState) => getRhsState(state));
    const selectedChannelId = useSelector((state: GlobalState) => getSelectedChannelId(state));

    const toggled = selectedChannelId === '' && (
        rhsState === RHSStates.TECHNICAL_TASKS ||
        rhsState === RHSStates.MY_TROUBLES ||
        rhsState === RHSStates.MY_ISSUES ||
        rhsState === RHSStates.MY_PLANS
    );

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (toggled) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(updateRhsState(RHSStates.TECHNICAL_TASKS));
        }
    };

    return (
        <IconButton
            size={'sm'}
            toggled={toggled}
            onClick={onClick}
            active={false}
            disabled={false}
            destructive={false}
            inverted={true}
            compact={true}
        >
            <svg xmlns='http://www.w3.org/2000/svg' width={16} height={16} viewBox='0 0 1000 1000' className='sc-hLBbgP cnncRF' fill='currentColor'>
                <path d='M878.8 288.6C878.8 369.8 812.7 435.9 731.5 435.9 714.2 435.9 697.8 432.5 682.7 427.1L203.7 905.6 114.5 816.4 426.3 504.5 351.4 429.6 321.5 459.5 262.2 400.1V519.3L232.3 549.1 83.3 400.1 113.2 370.3H231.9L172.6 310.9 321.5 161.9C370.8 112.7 450.8 112.7 500 161.9L410.8 251.2 470.1 310.5 440.2 340.4 515.1 415.3 593 337.4C587.5 322.3 584.2 305.9 584.2 288.6 584.2 207.4 650.2 141.3 731.5 141.3 755.9 141.3 778.6 148 798.8 158.6L685.2 272.2 747.9 334.9 861.5 221.3C872 241.5 878.8 264.2 878.8 288.6ZM575 653.6L664.3 564.3 916.7 816.7 827.4 906 575 653.6Z'/>
            </svg>
        </IconButton>
    );
}

export default TechnicalTasksButton;

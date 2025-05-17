import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';
import styled from 'styled-components';

import {closeRightHandSide, goBack} from 'actions/views/rhs';
import WithTooltip from 'components/with_tooltip';

interface Props {
    title: string;
    subtitle?: string;
    canGoBack?: boolean;
}

const HeaderTitle = styled.span`
    line-height: 2.4rem;
`;

const Header = ({title, subtitle, canGoBack}: Props) => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    return (
        <div className='sidebar--right__header'>
            <span className='sidebar--right__title'>

                {canGoBack && (
                    <button
                        className='sidebar--right__back btn btn-icon btn-sm'
                        onClick={() => dispatch(goBack())}
                        aria-label={formatMessage({id: 'rhs_header.back.icon', defaultMessage: 'Back Icon'})}
                    >
                        <i
                            className='icon icon-arrow-back-ios'
                        />
                    </button>
                )}

                <HeaderTitle>{title}</HeaderTitle>

                {subtitle &&
                    <span
                        className='style--none sidebar--right__title__subtitle'
                    >
                        {subtitle}
                    </span>
                }
            </span>

            <WithTooltip
                id='closeSidebarTooltip'
                placement='top'
                title={
                    <FormattedMessage
                        id='rhs_header.closeSidebarTooltip'
                        defaultMessage='Close'
                    />
                }
            >
                <button
                    id='rhsCloseButton'
                    type='button'
                    className='sidebar--right__close btn btn-icon btn-sm'
                    aria-label={formatMessage({id: 'rhs_header.closeTooltip.icon', defaultMessage: 'Close Sidebar Icon'})}
                    onClick={() => dispatch(closeRightHandSide())}
                >
                    <i
                        className='icon icon-close'
                    />
                </button>
            </WithTooltip>
        </div>
    );
};

export default Header;

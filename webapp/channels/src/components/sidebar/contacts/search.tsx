import React from 'react';
import {useIntl} from 'react-intl';
import styled from 'styled-components';

import Input from 'components/widgets/inputs/input/input';

const Container = styled.div`
    display: flex;
    padding: 12px 20px;

    .Input_fieldset {
        background: var(--sidebar-header-bg);
    }

    .form-control {
        background: transparent;
        color: var(--sidebar-header-text-color);

        &::placeholder {
            color: var(--sidebar-header-text-color-80);
        }
    }

    .icon {
        color: var(--sidebar-header-text-color);
    }
`

interface Props {
    className?: string;
    terms: string;
    onInput: (terms: string) => void;
}

const SearchBar = ({className, terms, onInput}: Props) => {
    const {formatMessage} = useIntl();

    let inputSuffix;
    if (terms.length > 0) {
        inputSuffix = (
            <button
                className='style--none'
                onClick={() => onInput('')}
            >
                <i className={'icon icon-close-circle'}/>
            </button>
        );
    }

    return (
        <Container>
            <Input
                value={terms}
                onInput={(e) => onInput(e.currentTarget.value)}
                inputPrefix={<i className={'icon icon-magnify'}/>}
                inputSuffix={inputSuffix}
                placeholder={formatMessage({
                    id: 'contacts.search_bar.placeholder',
                    defaultMessage: 'Search',
                })}
                useLegend={false}
            />
        </Container>
    );
};

export default SearchBar;

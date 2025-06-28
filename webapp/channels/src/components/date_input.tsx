import {DateTime} from 'luxon';
import type {Moment} from 'moment-timezone';
import moment from 'moment-timezone';
import React, {useEffect, useState, useCallback} from 'react';
import type {DayPickerProps} from 'react-day-picker';
import {useSelector} from 'react-redux';

import IconButton from '@mattermost/compass-components/components/icon-button'; // eslint-disable-line no-restricted-imports

import {getTheme} from 'mattermost-redux/selectors/entities/preferences';

import {getCurrentLocale} from 'selectors/i18n';

import CompassThemeProvider from 'components/compass_theme_provider/compass_theme_provider';
import DatePicker from 'components/date_picker';
import Input from 'components/widgets/inputs/input/input';

import Constants from 'utils/constants';
import {isKeyPressed} from 'utils/keyboard';
import {getCurrentMomentForTimezone} from 'utils/timezone';

type Props = {
    label: string;
    date?: Date;
    maxDate?: Date;
    handleChange: (date: Date) => void;
}

const DateInput: React.FC<Props> = (props: Props) => {
    const locale = useSelector(getCurrentLocale);
    const {label, date, handleChange} = props;
    const [isPopperOpen, setIsPopperOpen] = useState(false);
    const theme = useSelector(getTheme);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (isKeyPressed(event, Constants.KeyCodes.ESCAPE) && isPopperOpen) {
            setIsPopperOpen(false);
        }
    }, [isPopperOpen, setIsPopperOpen]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleDayChange = (day: Date) => {
        const dayWithTimezone = moment(day);
        handleChange(dayWithTimezone.startOf('day').toDate());
        setIsPopperOpen(false);
    };

    const currentTime = getCurrentMomentForTimezone().toDate();

    const formatDate = (date: Date): string => {
        return DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
    };

    const inputIcon = (
        <IconButton
            onClick={() => setIsPopperOpen(true)}
            icon={'calendar-outline'}
            className='calendar-icon'
            size={'sm'}
            aria-haspopup='grid'
        />
    );

    const datePickerProps: DayPickerProps = {
        initialFocus: isPopperOpen,
        mode: 'single',
        selected: date,
        defaultMonth: date || currentTime,
        onDayClick: handleDayChange,
        disabled: [{
            before: currentTime,
            after: props.maxDate,
        }],
        showOutsideDays: true,
    };

    return (
        <CompassThemeProvider theme={theme}>
            <DatePicker
                isPopperOpen={isPopperOpen}
                handlePopperOpenState={setIsPopperOpen}
                locale={locale}
                datePickerProps={datePickerProps}
            >
                <Input
                    className='date-input'
                    readOnly={true}
                    label={label}
                    value={date ? formatDate(date) : ''}
                    onClick={() => setIsPopperOpen(true)}
                    tabIndex={-1}
                    inputPrefix={inputIcon}
                />
            </DatePicker>
        </CompassThemeProvider>
    );
};

export default DateInput;

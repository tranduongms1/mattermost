import React from 'react';
import styled from 'styled-components';

import attitude1 from 'images/emoji/attitude_1.png';
import attitude2 from 'images/emoji/attitude_2.png';
import attitude3 from 'images/emoji/attitude_3.png';

export const customerAttitudes = [
    <span className="emoticon" style={{ backgroundImage: `url("${attitude1}")`, width: '24px', height: '24px' }} />,
    <span className="emoticon" style={{ backgroundImage: `url("${attitude2}")`, width: '24px', height: '24px' }} />,
    <span className="emoticon" style={{ backgroundImage: `url("${attitude3}")`, width: '24px', height: '24px' }} />,
];

const Container = styled.div`
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
    border: 1px solid var(--center-channel-color-32);
`;

const Attitude = styled.div`
    min-width: 6ch;
    width: 6ch;
    text-align: center;
`;

const CustomerName = styled.div`
    font-size: 14px;
    line-height: 16px;
    font-weight: bold;
    flex: 1 1 auto;
    text-align: center;
    padding: 8px;
    border-left: 1px solid var(--center-channel-color-32);
    border-right: 1px solid var(--center-channel-color-32);
`;

const Room = styled.div`
    min-width: 6ch;
    width: 6ch;
    text-align: center;
`;

export type Props = {
    customer_attitude: number;
    customer_name: string;
    room: string;
}

export default function CustomerInfo({
    customer_attitude,
    customer_name,
    room,
}: Props) {
    return (
        <Container>
            <Attitude>{customerAttitudes[customer_attitude - 1]}</Attitude>
            <CustomerName>{customer_name}</CustomerName>
            <Room>{room}</Room>
        </Container>
    );
}
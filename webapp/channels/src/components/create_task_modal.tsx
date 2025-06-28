import React, {useCallback, useRef, useState} from 'react';
import {FormGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import ReactSelect, {components} from 'react-select';
import styled from 'styled-components';

import {Client4} from 'mattermost-redux/client';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';
import {getTeammateNameDisplaySetting} from 'mattermost-redux/selectors/entities/preferences';
import {getProfilesInCurrentChannel} from 'mattermost-redux/selectors/entities/users';
import {displayUsername} from 'mattermost-redux/utils/user_utils';

import {removeDraft, updateDraft} from 'actions/views/drafts';
import useUploadFiles from 'components/advanced_text_editor/use_upload_files';
import type {UploadError} from 'components/advanced_text_editor/use_upload_files';
import Input from 'components/widgets/inputs/input/input';
import {makeGetPostDraft} from 'selectors/drafts';
import Constants from 'utils/constants';
import {getCurrentMomentForTimezone} from 'utils/timezone';
import {getUserIdFromChannelName} from 'utils/utils';

import type {GlobalState} from 'types/store';
import type {PostDraft} from 'types/store/draft';
import DateInput from './date_input';

const Card = styled.div`
    margin-bottom: 8px;
`

const Row = styled.div`
    display: flex;
    min-height: 34px;
    align-items: center;
`

const Prefix = styled.span`
    margin-left: 8px;
    color: rgba(var(--center-channel-color-rgb), 0.75);
`;

type Props = {
    onHide: () => void;
    onExited: () => void;
}

const CreateTaskModal = ({
    onHide,
    onExited,
}: Props) => {
    const dispatch = useDispatch();
    const channelId = useSelector(getCurrentChannelId);
    const channel = useSelector(getCurrentChannel);
    const getDraft = makeGetPostDraft('task', true);
    const savedDraft = useSelector((state: GlobalState) => {
        const draft = getDraft(state, channelId);
        const assignees = draft.props?.assignees || [];
        const managers = draft.props?.managers || [];
        const checklists = (draft.props?.checklists || []).filter((c: any) => c.title || c.items?.length);
        return {...draft, props: {...draft.props, assignees, managers, checklists}} as PostDraft;
    });
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});
    const teammateNameDisplaySetting = useSelector(getTeammateNameDisplaySetting);
    const users = useSelector(getProfilesInCurrentChannel);
    const currentDay = getCurrentMomentForTimezone().startOf('day').toDate();

    const [draft, setDraft] = useState(savedDraft);
    const [startDate, setStartDate] = useState(currentDay);
    const [endDate, setEndDate] = useState<any>();
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const {checklists} = draft.props;

    const getDisplayUsername = useCallback((user) => {
        return displayUsername(user, teammateNameDisplaySetting);
    }, [teammateNameDisplaySetting]);

    const handleDraftChange = useCallback((draftToChange: PostDraft, options: {instant?: boolean; show?: boolean} = {instant: false, show: false}) => {
        if (saveDraftFrame.current) {
            clearTimeout(saveDraftFrame.current);
        }

        setDraft(draftToChange);

        const saveDraft = () => {
            const key = `task_draft_${channelId}`;

            if (options.show) {
                dispatch(updateDraft(key, {...draftToChange, show: true}, draftToChange.rootId, true));
                return;
            }

            dispatch(updateDraft(key, draftToChange, draftToChange.rootId));
        };

        if (options.instant) {
            saveDraft();
        } else {
            saveDraftFrame.current = setTimeout(() => {
                saveDraft();
            }, Constants.SAVE_DRAFT_TIMEOUT);
        }

        storedDrafts.current[draftToChange.rootId || draftToChange.channelId] = draftToChange;
    }, [dispatch, channelId]);

    const changeMessage = useCallback((message: any) => {
        handleDraftChange({...draft, message}, {instant: true});
    }, [draft]);

    const changeProp = useCallback((name: string, value: any) => {
        handleDraftChange({...draft, props: {...draft.props, [name]: value}}, {instant: true});
    }, [draft]);

    const [attachmentPreview, fileUpload] = useUploadFiles(draft, 'task', channelId, false, storedDrafts, false, textboxRef, handleDraftChange, () => {}, setUploadError);

    const handleSubmit = useCallback(async () => {
        const {message, fileInfos} = draft;
        let {description, assignees, managers} = draft.props || {assignees: [], managers: []};
        if (channel?.type === 'D') {
            assignees = [{id: getUserIdFromChannelName(channel)}];
        }
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        if (!assignees?.length) {
            setSubmitError('Vui lòng chọn người thực hiện');
            return;
        }
        const checklists = draft.props.checklists
            .map((c: any) => ({...c, items: c.items.filter((i: any) => i.title)}))
            .filter((c: any) => c.title || (c.items && c.items.length));
        if (!checklists.length || checklists.some((c: any) => !c.title)) {
            setSubmitError('Vui lòng nhập nội dung');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            await (Client4 as any).doFetch(
                Client4.urlVersion + '/tasks',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message,
                        channel_id: channelId,
                        file_ids: fileInfos.map((f) => f.id),
                        props: {
                            title: message,
                            description,
                            assignee_ids: assignees.map((u: any) => u.id),
                            manager_ids: managers.map((u: any) => u.id),
                            start_date: startDate.getTime(),
                            end_date: endDate?.getTime(),
                            checklists,
                        },
                    }),
                }
            );
            alert(`Bạn đã giao việc thành công`);
            dispatch(removeDraft(`task_draft_${channelId}`, channelId, 'task'));
            onHide();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [dispatch, channelId, channel, draft, startDate, endDate]);

    const withPrefix = (text: string) => {
        return ({children, ...props}: any) => (
            <components.Control {...props}>
                <Prefix>{text}</Prefix>
                {children}
            </components.Control>
        );
    }

    return (
        <Modal
            show
            className='create-task-modal'
            onHide={onHide}
            onExited={onExited}
            enforceFocus
            role='dialog'
        >
            <Modal.Header closeButton>
                <Modal.Title componentClass='h1'>Công việc mới</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Card>
                    <FormGroup className='pt-1'>
                        <Input
                            name='title'
                            placeholder='Tiêu đề'
                            value={draft.message}
                            onChange={(e) => changeMessage(e.target.value)}
                        />
                    </FormGroup>
                    {(channel?.type !== 'D') &&
                    <div className='row'>
                        <FormGroup className='col-sm-6'>
                            <ReactSelect
                                className='react-select'
                                classNamePrefix='react-select'
                                isClearable={false}
                                isMulti={true}
                                options={users}
                                getOptionLabel={getDisplayUsername}
                                getOptionValue={(user) => user.id}
                                placeholder='Người thực hiện'
                                components={{
                                    Control: withPrefix('To:'),
                                    DropdownIndicator: null,
                                    IndicatorSeparator: null,
                                }}
                                value={draft.props.assignees}
                                onChange={(users) => changeProp('assignees', users)}
                            />
                        </FormGroup>
                        <FormGroup className='col-sm-6'>
                            <ReactSelect
                                className='react-select'
                                classNamePrefix='react-select'
                                isClearable={false}
                                isMulti={true}
                                options={users}
                                getOptionLabel={getDisplayUsername}
                                getOptionValue={(user) => user.id}
                                placeholder='Người quản lý'
                                components={{
                                    Control: withPrefix('CC:'),
                                    DropdownIndicator: null,
                                    IndicatorSeparator: null,
                                }}
                                value={draft.props.managers}
                                onChange={(users) => changeProp('managers', users)}
                            />
                        </FormGroup>
                    </div>
                    }
                    <div className='row'>
                        <FormGroup className='col-sm-6'>
                            <DateInput
                                label='Bắt đầu'
                                date={startDate}
                                handleChange={setStartDate}
                            />
                        </FormGroup>
                        <FormGroup className='col-sm-6'>
                            <DateInput
                                label='Kết thúc'
                                date={endDate}
                                handleChange={setEndDate}
                            />
                        </FormGroup>
                    </div>
                </Card>
                <FormGroup>
                    {attachmentPreview}
                    {uploadError &&
                        <span className='modal__error has-error control-label'>{uploadError.message}</span>
                    }
                </FormGroup>
                {checklists.map((checklist: any, checklistIdx: number) => (
                <Card key={checklistIdx}>
                    <Row>
                        <Input
                            placeholder='Nội dung'
                            value={checklist.title}
                            onChange={(e) => {
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {...checklist, title: e.target.value});
                                changeProp('checklists', s);
                            }}
                        />
                    </Row>
                    {Boolean(checklists.length > 1 && endDate) &&
                    <div className='row mt-2'>
                        <div className='col-sm-6 mb-3'>
                            <DateInput
                                label='Bắt đầu'
                                date={(checklist.start_date && new Date(checklist.start_date)) || startDate}
                                handleChange={(v) => {
                                    const s = checklists.slice();
                                    s.splice(checklistIdx, 1, {...checklist, start_date: v.getTime()});
                                    changeProp('checklists', s);
                                }}
                            />
                        </div>
                        <div className='col-sm-6 mb-3'>
                            <DateInput
                                label='Kết thúc'
                                date={checklist.end_date && new Date(checklist.end_date)}
                                maxDate={endDate}
                                handleChange={(v) => {
                                    const s = checklists.slice();
                                    s.splice(checklistIdx, 1, {...checklist, end_date: v.getTime()});
                                    changeProp('checklists', s);
                                }}
                            />
                        </div>
                    </div>
                    }
                    {checklist.items.map((item: any, itemIdx: number) => (
                    <Row key={itemIdx} className='mt-1 mb-1'>
                        <i className='icon icon-checkbox-blank-outline'/>
                        <input 
                            className='form-control'
                            placeholder='Chi tiết'
                            value={item.title}
                            onChange={(e) => {
                                const items = checklist.items.slice();
                                items.splice(itemIdx, 1, {title: e.target.value});
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {...checklist, items});
                                changeProp('checklists', s);
                            }}
                        />
                        <i
                            className='icon icon-close'
                            style={{cursor: 'pointer'}}
                            onClick={() => {
                                const items = checklist.items.slice();
                                items.splice(itemIdx, 1);
                                const s = checklists.slice();
                                s.splice(checklistIdx, 1, {...checklist, items});
                                changeProp('checklists', s);
                            }}
                        />
                    </Row>
                    ))}
                    <Row
                        className='mb-4'
                        style={{cursor: 'pointer'}}
                        onClick={() => {
                            const s = checklists.slice();
                            s.splice(checklistIdx, 1, {
                                ...checklist,
                                items: [...checklist.items, {title: ''}],
                            });
                            changeProp('checklists', s);
                        }}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm chi tiết</div>
                    </Row>
                </Card>
                ))}
                <Card>
                    <Row
                        style={{cursor: 'pointer'}}
                        onClick={() => {
                            changeProp('checklists', [...checklists, {title: '', items: []}]);
                        }}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm nội dung</div>
                    </Row>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                {submitError &&
                    <label className='modal__error has-error control-label'>
                        {submitError}
                    </label>
                }
                {fileUpload}
                <button
                    className='btn btn-primary'
                    disabled={submitting}
                    onClick={handleSubmit}
                >
                    {'Gửi'}
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreateTaskModal;

import React, {useCallback, useRef, useState} from 'react';
import {FormGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import ReactSelect, {components} from 'react-select';
import styled from 'styled-components';

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
    const getDraft = makeGetPostDraft('task', true);
    const savedDraft = useSelector((state: GlobalState) => {
        const draft = getDraft(state, channelId);
        const checklists = (draft.props.checklists || []).filter((c: any) => c.title || c.items?.length);
        return {...draft, props: {...draft.props, checklists}} as PostDraft;
    });
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});
    const teammateNameDisplaySetting = useSelector(getTeammateNameDisplaySetting);
    const users = useSelector(getProfilesInCurrentChannel);
    const currentTime = getCurrentMomentForTimezone();

    const [draft, setDraft] = useState(savedDraft);
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [startTime, setStartTime] = useState(currentTime);
    const [endTime, setEndTime] = useState(currentTime);
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
        const {message, fileInfos, props} = draft;
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        console.log(startTime.unix())
        console.log(endTime.unix())
        setSubmitting(true);
        setSubmitError('');
        try {
            // await (Client4 as any).doFetch(
            //     Client4.urlVersion + '/issues',
            //     {
            //         method: 'POST',
            //         body: JSON.stringify({
            //             type,
            //             title,
            //             description,
            //             channel_id: channel_id || channels[0].id,
            //             file_ids: draft.fileInfos.map((f) => f.id),
            //             customer_attitude,
            //             customer_name,
            //             room,
            //         }),
            //     }
            // );
            alert(`Bạn đã giao việc thành công`);
            dispatch(removeDraft(`task_draft_${channelId}`, channelId, 'task'));
            onHide();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [dispatch, channelId, draft, startTime, endTime]);

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
                    <div className='row'>
                        <FormGroup className='col-sm-6'>
                            <ReactSelect
                                isClearable={false}
                                isMulti={true}
                                options={users}
                                getOptionLabel={getDisplayUsername}
                                getOptionValue={(user) => user.id}
                                placeholder='Người thực hiện'
                                components={{
                                    Control: ({children, ...props}) => (
                                        <components.Control {...props}>
                                            <Prefix>To:</Prefix>
                                            {children}
                                        </components.Control>
                                    ),
                                    DropdownIndicator: null,
                                    IndicatorSeparator: null,
                                }}
                            />
                        </FormGroup>
                        <FormGroup className='col-sm-6'>
                            <ReactSelect
                                isClearable={false}
                                isMulti={true}
                                options={users}
                                getOptionLabel={getDisplayUsername}
                                getOptionValue={(user) => user.id}
                                placeholder='Người quản lý'
                                components={{
                                    Control: ({children, ...props}) => (
                                        <components.Control {...props}>
                                            <Prefix>CC:</Prefix>
                                            {children}
                                        </components.Control>
                                    ),
                                    DropdownIndicator: null,
                                    IndicatorSeparator: null,
                                }}
                            />
                        </FormGroup>
                    </div>
                    <div className='row'>
                        <FormGroup className='col-sm-6'>
                            <DateInput
                                label='Bắt đầu'
                                time={startTime}
                                handleChange={setStartTime}
                            />
                        </FormGroup>
                        <FormGroup className='col-sm-6'>
                            <DateInput
                                label='Kết thúc'
                                time={endTime}
                                handleChange={setEndTime}
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
                    {checklist.items.map((item: any, itemIdx: number) => (
                    <Row key={itemIdx} className='mt-1 mb-1'>
                        <i className='icon icon-checkbox-blank-outline'/>
                        <input 
                            className='form-control'
                            placeholder='Chi tiết'
                        />
                        <i
                            className='icon icon-close'
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

import React, {useCallback, useRef, useState} from 'react';
import {FormGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {Client4} from 'mattermost-redux/client';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';

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

const Title = styled.h5`
    font-size: 16px;
`

type Props = {
    onHide: () => void;
    onExited: () => void;
}

const CreatePlanModal = ({
    onHide,
    onExited,
}: Props) => {
    const dispatch = useDispatch();
    const channelId = useSelector(getCurrentChannelId);
    const getDraft = makeGetPostDraft('plan', true);
    const savedDraft = useSelector((state: GlobalState) => {
        const draft = getDraft(state, channelId);
        const checklists = (draft.props?.checklists || []).filter((c: any) => c.title);
        return {...draft, props: {...draft.props, checklists}} as PostDraft;
    });
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});
    const currentTime = getCurrentMomentForTimezone();

    const [draft, setDraft] = useState(savedDraft);
    const [startDate, setStartDate] = useState(currentTime);
    const [endDate, setEndDate] = useState(currentTime);
    const [troubles, setTroubles] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const {checklists} = draft.props;

    const handleDraftChange = useCallback((draftToChange: PostDraft, options: {instant?: boolean; show?: boolean} = {instant: false, show: false}) => {
        if (saveDraftFrame.current) {
            clearTimeout(saveDraftFrame.current);
        }

        setDraft(draftToChange);

        const saveDraft = () => {
            const key = `plan_draft_${channelId}`;

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

    const [attachmentPreview, fileUpload] = useUploadFiles(draft, 'plan', channelId, false, storedDrafts, false, textboxRef, handleDraftChange, () => {}, setUploadError);

    const handleSubmit = useCallback(async () => {
        const {message, fileInfos, props: {description, checklists}} = draft;
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            await (Client4 as any).doFetch(
                Client4.urlVersion + '/plans',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message,
                        channel_id: channelId,
                        file_ids: fileInfos.map((f) => f.id),
                        props: {
                            title: message,
                            description,
                            start_date: startDate.valueOf(),
                            end_date: endDate.valueOf(),
                            troubles,
                            issues,
                            checklists,
                        },
                    }),
                }
            );
            alert(`Bạn đã tạo kế hoạch thành công`);
            dispatch(removeDraft(`plan_draft_${channelId}`, channelId, 'plan'));
            onHide();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [dispatch, channelId, draft, startDate, endDate, troubles, issues]);

    return (
        <Modal
            show
            className='create-plan-modal'
            onHide={onHide}
            onExited={onExited}
            enforceFocus
            role='dialog'
        >
            <Modal.Header closeButton>
                <Modal.Title componentClass='h1'>Kế hoạch mới</Modal.Title>
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
                            <DateInput
                                label='Bắt đầu'
                                time={startDate}
                                handleChange={setStartDate}
                            />
                        </FormGroup>
                        <FormGroup className='col-sm-6'>
                            <DateInput
                                label='Kết thúc'
                                time={endDate}
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
                <Card>
                    <Row>
                        <Title>Công việc trouble</Title>
                    </Row>
                    <Row
                        onClick={() => {
                        }}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm trouble</div>
                    </Row>
                </Card>
                <Card>
                    <Row>
                        <Title>Công việc sự cố</Title>
                    </Row>
                    <Row
                        onClick={() => {
                        }}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm sự cố</div>
                    </Row>
                </Card>
                <Card>
                    <Row>
                        <Title>Công việc khác</Title>
                    </Row>
                    {checklists.map((item: any, itemIdx: number) => (
                    <Row key={itemIdx} className='mt-1 mb-1'>
                        <i className='icon icon-checkbox-blank-outline'/>
                        <input 
                            className='form-control'
                            placeholder='Chi tiết'
                            value={item.title}
                            onChange={(e) => {
                                const s = checklists.slice();
                                s.splice(itemIdx, 1, {...item, title: e.target.value});
                                changeProp('checklists', s);
                            }}
                        />
                        <i
                            className='icon icon-close'
                            onClick={() => {
                                const s = checklists.slice();
                                s.splice(itemIdx, 1);
                                changeProp('checklists', s);
                            }}
                        />
                    </Row>
                    ))}
                    <Row
                        onClick={() => {
                            const s = [...checklists, {title: ''}];
                            changeProp('checklists', s);
                        }}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm chi tiết</div>
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

export default CreatePlanModal;

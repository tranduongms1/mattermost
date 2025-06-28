import React, {useCallback, useRef, useState} from 'react';
import {Button, FormControl, FormGroup, InputGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';

import {Client4} from 'mattermost-redux/client';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';

import {removeDraft, updateDraft} from 'actions/views/drafts';
import useUploadFiles from 'components/advanced_text_editor/use_upload_files';
import type {UploadError} from 'components/advanced_text_editor/use_upload_files';
import Input from 'components/widgets/inputs/input/input';
import {makeGetPostDraft} from 'selectors/drafts';
import Constants from 'utils/constants';

import type {GlobalState} from 'types/store';
import type {PostDraft} from 'types/store/draft';

type Props = {
    onHide: () => void;
    onExited: () => void;
}

const CreateIssueModal = ({
    onHide,
    onExited,
}: Props) => {
    const dispatch = useDispatch();
    const channelId = useSelector(getCurrentChannelId);
    const getDraft = makeGetPostDraft('issue');
    const savedDraft = useSelector((state: GlobalState) => getDraft(state, channelId));
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});

    const [draft, setDraft] = useState(savedDraft);
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const channels = useSelector((state: GlobalState) => Object.values(state.entities.channels.channels).filter((channel) => channel.name.endsWith('ky-thuat')));

    const handleDraftChange = useCallback((draftToChange: PostDraft, options: {instant?: boolean; show?: boolean} = {instant: false, show: false}) => {
        if (saveDraftFrame.current) {
            clearTimeout(saveDraftFrame.current);
        }

        setDraft(draftToChange);

        const saveDraft = () => {
            const key = 'issue_draft';

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

        storedDrafts.current['issue'] = draftToChange;
    }, [dispatch]);

    const changeMessage = useCallback((message: any) => {
        handleDraftChange({...draft, message}, {instant: true});
    }, [draft]);

    const changeProp = useCallback((name: string, value: any) => {
        handleDraftChange({...draft, props: {...draft.props, [name]: value}}, {instant: true});
    }, [draft]);

    const [attachmentPreview, fileUpload] = useUploadFiles(draft, 'issue', channelId, false, storedDrafts, false, textboxRef, handleDraftChange, () => {}, setUploadError);

    const handleSubmit = useCallback(async () => {
        const {message, fileInfos} = draft;
        const {channel_id, description} = draft.props || {};
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        if (channels.length > 1 && !channel_id) {
            setSubmitError('Vui lòng chọn nhóm muốn gửi');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            await (Client4 as any).doFetch(
                Client4.urlVersion + '/issues',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message,
                        channel_id: channel_id || channels[0].id,
                        file_ids: fileInfos.map((f) => f.id),
                        props: {
                            title: message,
                            description,
                        },
                    }),
                }
            );
            alert(`Bạn đã báo sự cố thành công`);
            dispatch(removeDraft('issue_draft', channelId, 'issue'));
            onHide();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [dispatch, channels, channelId, draft]);

    return (
        <Modal
            show
            onHide={onHide}
            onExited={onExited}
            enforceFocus
            role='dialog'
        >
            <Modal.Header closeButton>
                <Modal.Title componentClass='h1'>Báo sự cố</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FormGroup className='pt-1'>
                    <Input
                        name='title'
                        placeholder='Tiêu đề'
                        defaultValue={draft.message}
                        onChange={(e) => changeMessage(e.target.value)}
                    />
                </FormGroup>
                <FormGroup>
                    <Input
                        name='description'
                        placeholder='Mô tả sự cố'
                        type='textarea'
                        defaultValue={draft.props?.description}
                        onChange={(e) => changeProp('description', e.target.value)}
                    />
                </FormGroup>
                <FormGroup>
                    <InputGroup>
                        <FormControl disabled placeholder='Id tài sản'/>
                        <InputGroup.Button>
                            <Button style={{height: '34px', padding: '0 12px', border: '1px solid rgba(var(--center-channel-color-rgb), 0.16)', backgroundColor: 'var(--center-channel-bg)'}}>
                                <i className="icon icon-arrow-left"/>
                                Chưa có ID
                            </Button>
                        </InputGroup.Button>
                    </InputGroup>
                </FormGroup>
                {channels.length > 1 &&
                <FormGroup>
                    <select
                        name='channel_id'
                        className='form-control'
                        defaultValue={draft.props?.channel_id}
                        onChange={(e) => changeProp("channel_id", e.target.value)}
                    >
                        <option>{'Chọn nhóm để gửi'}</option>
                        {channels.map(channel => (
                            <option key={channel.id} value={channel.id}>{channel.display_name}</option>
                        ))}
                    </select>
                </FormGroup>
                }
                <FormGroup>
                    {attachmentPreview}
                    {uploadError &&
                        <span className="modal__error has-error control-label">{uploadError.message}</span>
                    }
                </FormGroup>
            </Modal.Body>
            <Modal.Footer>
                {submitError &&
                    <label className="modal__error has-error control-label">
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

export default CreateIssueModal;

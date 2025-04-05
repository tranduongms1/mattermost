import React, {useCallback, useRef, useState} from 'react';
import {FormGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';

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

const CreatePlanModal = ({
    onHide,
    onExited,
}: Props) => {
    const dispatch = useDispatch();
    const channelId = useSelector(getCurrentChannelId);
    const getDraft = makeGetPostDraft('plan', true);
    const savedDraft = useSelector((state: GlobalState) => getDraft(state, channelId));
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});

    const [draft, setDraft] = useState(savedDraft);
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

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
        const {message, fileInfos, props} = draft;
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
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
            alert(`Bạn đã tạo kế hoạch thành công`);
            dispatch(removeDraft(`plan_draft_${channelId}`, channelId, 'plan'));
            onHide();
        } catch (e) {
            setSubmitError('Đã xảy ra lỗi vui lòng thử lại');
            setSubmitting(false);
        }
    }, [dispatch, channelId, draft]);

    return (
        <Modal
            show
            onHide={onHide}
            onExited={onExited}
            enforceFocus
            role='dialog'
        >
            <Modal.Header closeButton>
                <Modal.Title componentClass='h1'>Kế hoạch mới</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FormGroup className='pt-1'>
                    <Input
                        name='title'
                        placeholder='Tiêu đề'
                        value={draft.message}
                        onChange={(e) => changeMessage(e.target.value)}
                    />
                </FormGroup>
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

export default CreatePlanModal;

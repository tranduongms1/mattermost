import React, {useCallback, useMemo, useRef, useState} from 'react';
import {FormGroup, Modal} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {Client4} from 'mattermost-redux/client';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/common';

import {removeDraft, updateDraft} from 'actions/views/drafts';
import useUploadFiles from 'components/advanced_text_editor/use_upload_files';
import type {UploadError} from 'components/advanced_text_editor/use_upload_files';
import AutocompleteSelector from 'components/autocomplete_selector';
import MenuActionProvider from 'components/suggestion/menu_action_provider';
import ModalSuggestionList from 'components/suggestion/modal_suggestion_list';
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

const ListItem = styled.div`
    display: flex;
    align-items: center;

    .form-group {
        flex 1 1 auto;
        margin-bottom: 0;
    }
`;

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
        const troubles = (draft.props?.troubles || []).filter((id: string) => id);
        const issues = (draft.props?.issues || []).filter((id: string) => id);
        const checklists = (draft.props?.checklists || []).filter((c: any) => c.title);
        return {...draft, props: {...draft.props, troubles, issues, checklists}} as PostDraft;
    });
    const textboxRef = useRef<any>(null);
    const saveDraftFrame = useRef<NodeJS.Timeout>();
    const storedDrafts = useRef<Record<string, PostDraft | undefined>>({});
    const currentDate = getCurrentMomentForTimezone().startOf('day').toDate();
    const allTroubles = useSelector((state: GlobalState) => Object.values(state.entities.posts.posts).filter(p => p.type as any === 'custom_trouble' && p.channel_id === channelId && ['new', 'confirmed'].includes(p.props.status as string)));
    const allIssues = useSelector((state: GlobalState) => Object.values(state.entities.posts.posts).filter(p => p.type as any === 'custom_issue' && p.channel_id === channelId && ['new', 'confirmed'].includes(p.props.status as string)));

    const [draft, setDraft] = useState(savedDraft);
    const [startDate, setStartDate] = useState(currentDate);
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [uploadError, setUploadError] = useState<UploadError>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const {troubles, issues, checklists} = draft.props;

    const troubleProvider = useMemo(
        () => new MenuActionProvider(allTroubles.filter(p => !troubles.includes(p.id)) .map(p => ({text: p.message, value: p.id}))),
        [allTroubles, troubles],
    );

    const issueProvider = useMemo(
        () => new MenuActionProvider(allIssues.filter(p => !issues.includes(p.id)).map(p => ({text: p.message, value: p.id}))),
        [allIssues, issues],
    );

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
        const {message, fileInfos} = draft;
        const {description, troubles, issues} = draft.props || {troubles: [], issues: []};
        if (!message) {
            setSubmitError('Vui lòng nhập tiêu đề');
            return;
        }
        const checklists = draft.props.checklists.filter((c: any) => c.title);
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
                            start_date: startDate.getTime(),
                            end_date: endDate?.getTime(),
                            troubles: troubles.filter((v: any) => v),
                            issues: issues.filter((v: any) => v),
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
    }, [dispatch, channelId, draft, startDate, endDate]);

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
                    <div className='row mb-4'>
                        <div className='col-sm-6'>
                            <DateInput
                                label='Bắt đầu'
                                date={startDate}
                                handleChange={setStartDate}
                            />
                        </div>
                        <div className='col-sm-6'>
                            <DateInput
                                label='Kết thúc'
                                date={endDate}
                                handleChange={setEndDate}
                            />
                        </div>
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
                    {troubles.map((id: string, idx: number) => (
                        <ListItem key={idx}>
                            <AutocompleteSelector
                                providers={[troubleProvider]}
                                onSelected={(s: any) => {
                                    const arr = troubles.slice();
                                    arr.splice(idx, 1, s.value);
                                    changeProp('troubles', arr);
                                }}
                                placeholder='Chọn trouble'
                                value={allTroubles.find(p => p.id === id)?.message}
                                listComponent={ModalSuggestionList}
                                listPosition='bottom'
                            />
                            <i
                                className='icon icon-close'
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                    const s = troubles.slice();
                                    s.splice(idx, 1);
                                    changeProp('troubles', s);
                                }}
                            />
                        </ListItem>
                    ))}
                    <Row
                        style={{cursor: 'pointer'}}
                        onClick={() => changeProp('troubles', [...troubles, ''])}
                    >
                        <i className='icon icon-plus'/>
                        <div>Thêm trouble</div>
                    </Row>
                </Card>
                <Card>
                    <Row>
                        <Title>Công việc sự cố</Title>
                    </Row>
                    {issues.map((id: string, idx: number) => (
                        <ListItem key={idx}>
                            <AutocompleteSelector
                                providers={[issueProvider]}
                                onSelected={(s: any) => {
                                    const arr = issues.slice();
                                    arr.splice(idx, 1, s.value);
                                    changeProp('issues', arr);
                                }}
                                placeholder='Chọn sự cố'
                                value={allIssues.find(p => p.id === id)?.message}
                                listComponent={ModalSuggestionList}
                                listPosition='bottom'
                            />
                            <i
                                className='icon icon-close'
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                    const s = issues.slice();
                                    s.splice(idx, 1);
                                    changeProp('issues', s);
                                }}
                            />
                        </ListItem>
                    ))}
                    <Row
                        style={{cursor: 'pointer'}}
                        onClick={() => changeProp('issues', [...issues, ''])}
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
                            style={{cursor: 'pointer'}}
                            onClick={() => {
                                const s = checklists.slice();
                                s.splice(itemIdx, 1);
                                changeProp('checklists', s);
                            }}
                        />
                    </Row>
                    ))}
                    <Row
                        style={{cursor: 'pointer'}}
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

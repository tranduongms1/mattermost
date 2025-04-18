import type {Channel} from '@mattermost/types/channels';
import type {RelationOneToOne} from '@mattermost/types/utilities';

export type ChannelStats = {
    channel_id: string;
    troublesCount: number;
    doneTroublesCount: number;
    completedTroublesCount: number;
    issuesCount: number;
    doneIssuesCount: number;
    completedIssuesCount: number;
    plansCount: number;
    recurringTasksCount: number;
};

export type ChannelsState = {
    stats: RelationOneToOne<Channel, ChannelStats>;
};

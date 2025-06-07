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
    donePlansCount: number;
    completedPlansCount: number;
    recurringTasksCount: number;
};

export type TechnicalStats = {
    troublesCount: number;
    doneTroublesCount: number;
    completedTroublesCount: number;
    issuesCount: number;
    doneIssuesCount: number;
    completedIssuesCount: number;
    plansCount: number;
    donePlansCount: number;
    completedPlansCount: number;
    recurringTasksCount: number;
};

export type MyTaskStats = {
    fromMeCount: number;
    toMeCount: number;
    isManagerCount: number;
    doneCount: number;
    completedCount: number;
};

export type TasksState = {
    channelStats: RelationOneToOne<Channel, ChannelStats>;
    technicalStats: TechnicalStats;
    myTaskStats: MyTaskStats
};

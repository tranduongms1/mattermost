package api4

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/v8/channels/app"
	"github.com/mattermost/mattermost/server/v8/channels/audit"
)

func (api *API) InitTask() {
	api.BaseRoutes.Tasks.Handle("", api.APISessionRequired(createTask)).Methods(http.MethodPost)
	api.BaseRoutes.Task.Handle("", api.APISessionRequired(updateTask)).Methods(http.MethodPatch)
	api.BaseRoutes.TaskChecklist.Handle("/items/{item_idx:[0-9]+}", api.APISessionRequired(updateChecklistItem)).Methods(http.MethodPatch)
	api.BaseRoutes.TasksForChannel.Handle("", api.APISessionRequired(getTasksForChannel)).Methods(http.MethodGet)
}

func createTask(c *Context, w http.ResponseWriter, r *http.Request) {
	var post model.Post
	if jsonErr := json.NewDecoder(r.Body).Decode(&post); jsonErr != nil {
		c.SetInvalidParamWithErr("task", jsonErr)
		return
	}

	post.SanitizeInput()

	bot, err := c.App.GetSystemBot(c.AppContext)
	if err != nil {
		c.Err = err
		return
	}

	fileIds, err := c.App.CopyFileInfos(c.AppContext, bot.UserId, post.FileIds)
	if err != nil {
		c.Err = err
		return
	}
	post.FileIds = fileIds
	post.UserId = bot.UserId

	user, err := c.App.GetUser(c.AppContext.Session().UserId)
	if err != nil {
		c.Err = err
		return
	}
	post.Type = "custom_task"
	post.AddProp("creator_id", user.Id)
	post.AddProp("creator_name", user.GetFullName())
	post.AddProp("status", "new")

	auditRec := c.MakeAuditRecord("createTask", audit.Fail)
	defer c.LogAuditRecWithLevel(auditRec, app.LevelContent)
	audit.AddEventParameterAuditable(auditRec, "task", &post)

	hasPermission := false
	if c.App.SessionHasPermissionToChannel(c.AppContext, *c.AppContext.Session(), post.ChannelId, model.PermissionCreatePost) {
		hasPermission = true
	} else if channel, err := c.App.GetChannel(c.AppContext, post.ChannelId); err == nil {
		// Temporary permission check method until advanced permissions, please do not copy
		if strings.HasSuffix(channel.Name, "ky-thuat") {
			hasPermission = true
		}
	}

	if !hasPermission {
		c.SetPermissionError(model.PermissionCreatePost)
		return
	}

	if post.CreateAt != 0 && !c.App.SessionHasPermissionTo(*c.AppContext.Session(), model.PermissionManageSystem) {
		post.CreateAt = 0
	}

	rp, err := c.App.CreatePostAsUser(c.AppContext, c.App.PostWithProxyRemovedFromImageURLs(&post), c.AppContext.Session().Id, false)
	if err != nil {
		c.Err = err
		return
	}
	auditRec.Success()
	auditRec.AddEventResultState(rp)
	auditRec.AddEventObjectType("task")

	c.App.Srv().Platform().UpdateLastActivityAtIfNeeded(*c.AppContext.Session())
	c.ExtendSessionExpiryIfNeeded(w, r)

	w.WriteHeader(http.StatusCreated)

	// Note that rp has already had PreparePostForClient called on it by App.CreatePost
	if err := rp.EncodeJSON(w); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

func updateTask(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequirePostId()
	if c.Err != nil {
		return
	}

	var patch *struct {
		Priority *bool   `json:"priority,omitempty"`
		Status   *string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil || patch == nil {
		c.SetInvalidParamWithErr("taskPatch", err)
		return
	}

	task, appErr := c.App.GetSinglePost(c.AppContext, c.Params.PostId, false)
	if appErr != nil {
		c.Err = appErr
		return
	}

	oldStatus := task.GetProp("status").(string)
	if patch.Status != nil {
		newStatus := *patch.Status
		if (oldStatus == model.PostStatusNew && newStatus != model.PostStatusConfirmed && newStatus != model.PostStatusDone) ||
			(oldStatus == model.PostStatusConfirmed && newStatus != model.PostStatusDone) ||
			(oldStatus == model.PostStatusDone && newStatus != model.PostStatusConfirmed && newStatus != model.PostStatusCompleted) ||
			(oldStatus == model.PostStatusCompleted) {
			c.SetInvalidParam("status")
			return
		}
	}

	user, appErr := c.App.GetUser(c.AppContext.Session().UserId)
	if appErr != nil {
		c.Err = appErr
		return
	}
	displayName := user.GetDisplayName(model.ShowNicknameFullName)

	var typeName string
	switch task.Type {
	case "custom_trouble":
		typeName = "trouble"
	case "custom_issue":
		typeName = "sự cố"
	case "custom_plan":
		typeName = "kế hoạch"
	default:
		typeName = "công việc"
	}

	post := &model.Post{
		UserId:    task.UserId,
		ChannelId: task.ChannelId,
		RootId:    task.Id,
		Type:      "custom_task_updated",
	}

	if patch.Priority != nil && task.GetProp("priority") != *patch.Priority {
		task.AddProp("priority", *patch.Priority)
		task.AddProp("priority_by", user.Id)
		task.AddProp("priority_at", model.GetMillis())
		if *patch.Priority {
			post.Message = fmt.Sprintf("%s **yêu cầu ưu tiên** %s **%s**", displayName, typeName, task.Message)
		} else {
			post.Message = fmt.Sprintf("%s **bỏ ưu tiên** %s **%s**", displayName, typeName, task.Message)
		}
	}

	if patch.Status != nil {
		task.AddProp("status", *patch.Status)
		switch *patch.Status {
		case model.PostStatusConfirmed:
			if oldStatus != model.PostStatusDone {
				task.AddProp("confirmed_by", user.Id)
				task.AddProp("confirmed_at", model.GetMillis())
				post.Message = fmt.Sprintf("**%s** đã **xác nhận** %s **%s**", displayName, typeName, task.Message)
			} else {
				task.AddProp("restored", true)
				task.AddProp("restored_by", user.Id)
				task.AddProp("restored_at", model.GetMillis())
				post.Message = fmt.Sprintf("**%s** yêu cầu **làm lại** %s **%s**", displayName, typeName, task.Message)
			}
		case model.PostStatusDone:
			task.AddProp("done_by", user.Id)
			task.AddProp("done_at", model.GetMillis())
			task.DelProp("restored")
			post.Message = fmt.Sprintf("**%s** đã **báo xong** %s **%s**", displayName, typeName, task.Message)
		case model.PostStatusCompleted:
			task.AddProp("completed_by", user.Id)
			task.AddProp("completed_at", model.GetMillis())
			post.Message = fmt.Sprintf("**%s** đã **nghiệm thu** %s **%s**", displayName, typeName, task.Message)
		}
	}

	rpost, appErr := c.App.UpdatePost(c.AppContext, task, false)
	if appErr != nil {
		c.Err = appErr
		return
	}

	c.App.CreatePostMissingChannel(c.AppContext, post, false, false)

	if err := rpost.EncodeJSON(w); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

func getTasksForChannel(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireChannelId()
	if c.Err != nil {
		return
	}

	afterPost := r.URL.Query().Get("after")
	if afterPost != "" && !model.IsValidId(afterPost) {
		c.SetInvalidParam("after")
		return
	}

	beforePost := r.URL.Query().Get("before")
	if beforePost != "" && !model.IsValidId(beforePost) {
		c.SetInvalidParam("before")
		return
	}

	sinceString := r.URL.Query().Get("since")
	var since int64
	var parseError error
	if sinceString != "" {
		since, parseError = strconv.ParseInt(sinceString, 10, 64)
		if parseError != nil {
			c.SetInvalidParamWithErr("since", parseError)
			return
		}
	}
	skipFetchThreads := r.URL.Query().Get("skipFetchThreads") == "true"
	collapsedThreads := r.URL.Query().Get("collapsedThreads") == "true"
	collapsedThreadsExtended := r.URL.Query().Get("collapsedThreadsExtended") == "true"
	includeDeleted := r.URL.Query().Get("include_deleted") == "true"
	channelId := c.Params.ChannelId
	page := c.Params.Page
	perPage := c.Params.PerPage

	if !c.IsSystemAdmin() && includeDeleted {
		c.SetPermissionError(model.PermissionReadDeletedPosts)
		return
	}

	channel, err := c.App.GetChannel(c.AppContext, channelId)
	if err != nil {
		c.Err = err
		return
	}
	if !c.App.SessionHasPermissionToReadChannel(c.AppContext, *c.AppContext.Session(), channel) {
		c.SetPermissionError(model.PermissionReadChannelContent)
		return
	}

	if !*c.App.Config().TeamSettings.ExperimentalViewArchivedChannels {
		channel, appErr := c.App.GetChannel(c.AppContext, channelId)
		if appErr != nil {
			c.Err = appErr
			return
		}
		if channel.DeleteAt != 0 {
			c.Err = model.NewAppError("Api4.getPostsForChannel", "api.user.view_archived_channels.get_posts_for_channel.app_error", nil, "", http.StatusForbidden)
			return
		}
	}

	var list *model.PostList
	etag := ""

	if since > 0 {
		list, err = c.App.GetPostsSince(model.GetPostsSinceOptions{ChannelId: channelId, Time: since, SkipFetchThreads: skipFetchThreads, CollapsedThreads: collapsedThreads, CollapsedThreadsExtended: collapsedThreadsExtended, UserId: c.AppContext.Session().UserId})
	} else if afterPost != "" {
		etag = c.App.GetPostsEtag(channelId, collapsedThreads)

		if c.HandleEtag(etag, "Get Posts After", w, r) {
			return
		}

		list, err = c.App.GetPostsAfterPost(model.GetPostsOptions{ChannelId: channelId, PostId: afterPost, Page: page, PerPage: perPage, SkipFetchThreads: skipFetchThreads, CollapsedThreads: collapsedThreads, UserId: c.AppContext.Session().UserId, IncludeDeleted: includeDeleted})
	} else if beforePost != "" {
		etag = c.App.GetPostsEtag(channelId, collapsedThreads)

		if c.HandleEtag(etag, "Get Posts Before", w, r) {
			return
		}

		list, err = c.App.GetPostsBeforePost(model.GetPostsOptions{ChannelId: channelId, PostId: beforePost, Page: page, PerPage: perPage, SkipFetchThreads: skipFetchThreads, CollapsedThreads: collapsedThreads, CollapsedThreadsExtended: collapsedThreadsExtended, UserId: c.AppContext.Session().UserId, IncludeDeleted: includeDeleted})
	} else {
		etag = c.App.GetPostsEtag(channelId, collapsedThreads)

		if c.HandleEtag(etag, "Get Posts", w, r) {
			return
		}

		list, err = c.App.GetPostsPage(model.GetPostsOptions{ChannelId: channelId, Page: page, PerPage: perPage, SkipFetchThreads: skipFetchThreads, CollapsedThreads: collapsedThreads, CollapsedThreadsExtended: collapsedThreadsExtended, UserId: c.AppContext.Session().UserId, IncludeDeleted: includeDeleted})
	}

	if err != nil {
		c.Err = err
		return
	}

	if etag != "" {
		w.Header().Set(model.HeaderEtagServer, etag)
	}

	c.App.AddCursorIdsForPostList(list, afterPost, beforePost, since, page, perPage, collapsedThreads)
	clientPostList := c.App.PreparePostListForClient(c.AppContext, list)
	clientPostList, err = c.App.SanitizePostListMetadataForUser(c.AppContext, clientPostList, c.AppContext.Session().UserId)
	if err != nil {
		c.Err = err
		return
	}

	if err := clientPostList.EncodeJSON(w); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

func updateChecklistItem(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequirePostId()
	if c.Err != nil {
		return
	}
	props := mux.Vars(r)
	checklistIdx, _ := strconv.Atoi(props["checklist_idx"])
	itemIdx, _ := strconv.Atoi(props["item_idx"])

	var patch *struct {
		State *string `json:"state"`
	}
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil || patch == nil {
		c.SetInvalidParamWithErr("taskPatch", err)
		return
	}

	task, appErr := c.App.GetSinglePost(c.AppContext, c.Params.PostId, false)
	if appErr != nil {
		c.Err = appErr
		return
	}

	checklists := task.GetProp("checklists").([]any)
	checklist := checklists[checklistIdx].(map[string]any)
	item := checklist["items"].([]any)[itemIdx].(map[string]any)
	item["state"] = patch.State
	item["updated_at"] = model.GetMillis()
	item["updated_by"] = c.AppContext.Session().UserId
	task.AddProp("checklists", checklists)

	rpost, appErr := c.App.UpdatePost(c.AppContext, task, false)
	if appErr != nil {
		c.Err = appErr
		return
	}

	if err := json.NewEncoder(w).Encode(rpost.GetProp("checklists")); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

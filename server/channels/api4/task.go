package api4

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/v8/channels/app"
	"github.com/mattermost/mattermost/server/v8/channels/audit"
	sq "github.com/mattermost/squirrel"
)

func (api *API) InitTask() {
	api.BaseRoutes.Tasks.Handle("", api.APISessionRequired(createTask)).Methods(http.MethodPost)
	api.BaseRoutes.Task.Handle("", api.APISessionRequired(updateTask)).Methods(http.MethodPatch)
	api.BaseRoutes.TaskChecklist.Handle("/items/{item_idx:[0-9]+}", api.APISessionRequired(updateChecklistItem)).Methods(http.MethodPatch)
	api.BaseRoutes.TasksForChannel.Handle("", api.APISessionRequired(getTasksForChannel)).Methods(http.MethodGet)
	api.BaseRoutes.TasksForChannel.Handle("/count", api.APISessionRequired(countTasksForChannel)).Methods(http.MethodGet)
	api.BaseRoutes.MyTasks.Handle("", api.APISessionRequired(getMyTasks)).Methods(http.MethodGet)
	api.BaseRoutes.MyTasks.Handle("/count", api.APISessionRequired(countMyTasks)).Methods(http.MethodGet)
	api.BaseRoutes.MyTasks.Handle("/channels", api.APISessionRequired(getMyTaskChannels)).Methods(http.MethodGet)
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

	channel, err := c.App.GetChannel(c.AppContext, post.ChannelId)
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
	post.AddProp("channel_name", channel.DisplayName)
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
	post.AddProp("task_id", task.Id)
	post.AddProp("task_type", strings.TrimPrefix(task.Type, "custom_"))

	if patch.Priority != nil && task.GetProp("priority") != *patch.Priority {
		task.AddProp("priority", *patch.Priority)
		task.AddProp("priority_at", model.GetMillis())
		task.AddProp("priority_by", user.Id)
		task.AddProp("priority_by_name", user.GetDisplayName(model.ShowNicknameFullName))
		if *patch.Priority {
			post.Message = fmt.Sprintf("%s **yêu cầu ưu tiên** %s **%s**", displayName, typeName, task.Message)
		} else {
			post.Message = fmt.Sprintf("%s **bỏ ưu tiên** %s **%s**", displayName, typeName, task.Message)
		}
	}

	if patch.Status != nil {
		task.AddProp("status", *patch.Status)
		post.AddProp("old_status", oldStatus)
		post.AddProp("new_status", *patch.Status)
		switch *patch.Status {
		case model.PostStatusConfirmed:
			if oldStatus != model.PostStatusDone {
				task.AddProp("confirmed_at", model.GetMillis())
				task.AddProp("confirmed_by", user.Id)
				task.AddProp("confirmed_by_name", user.GetDisplayName(model.ShowNicknameFullName))
				post.Message = fmt.Sprintf("**%s** đã **xác nhận** %s **%s**", displayName, typeName, task.Message)
			} else {
				task.AddProp("restored_at", model.GetMillis())
				task.AddProp("restored_by", user.Id)
				task.AddProp("restored_by_name", user.GetDisplayName(model.ShowNicknameFullName))
				post.Message = fmt.Sprintf("**%s** yêu cầu **làm lại** %s **%s**", displayName, typeName, task.Message)
			}
		case model.PostStatusDone:
			task.AddProp("done_at", model.GetMillis())
			task.AddProp("done_by", user.Id)
			task.AddProp("done_by_name", user.GetDisplayName(model.ShowNicknameFullName))
			post.Message = fmt.Sprintf("**%s** đã **báo xong** %s **%s**", displayName, typeName, task.Message)
		case model.PostStatusCompleted:
			task.AddProp("completed_at", model.GetMillis())
			task.AddProp("completed_by", user.Id)
			task.AddProp("completed_by_name", user.GetDisplayName(model.ShowNicknameFullName))
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

	typeQuery := r.URL.Query().Get("type")
	switch typeQuery {
	case "trouble":
	case "issue":
	case "plan":
	default:
		c.SetInvalidParam("type")
		return
	}

	statuses := r.URL.Query()["status[]"]
	if len(statuses) == 0 {
		c.SetInvalidParam("status")
		return
	}

	channelId := c.Params.ChannelId
	page := c.Params.Page
	perPage := c.Params.PerPage

	channel, err := c.App.GetChannel(c.AppContext, channelId)
	if err != nil {
		c.Err = err
		return
	}
	if !c.App.SessionHasPermissionToReadChannel(c.AppContext, *c.AppContext.Session(), channel) {
		c.SetPermissionError(model.PermissionReadChannelContent)
		return
	}

	list, err := c.App.GetPostsPage(model.GetPostsOptions{
		ChannelId: channelId,
		Page:      page,
		PerPage:   perPage,
		Type:      "custom_" + typeQuery,
		Statuses:  statuses,
	})
	if err != nil {
		c.Err = err
		return
	}

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

func countTasksForChannel(c *Context, w http.ResponseWriter, r *http.Request) {
	c.RequireChannelId()
	if c.Err != nil {
		return
	}

	typeQuery := r.URL.Query().Get("type")
	switch typeQuery {
	case "trouble":
	case "issue":
	case "plan":
	default:
		c.SetInvalidParam("type")
		return
	}

	statuses := r.URL.Query()["status[]"]
	if len(statuses) == 0 {
		c.SetInvalidParam("status")
		return
	}

	store := c.App.Srv().Store().GetInternalMasterDB()
	query := sq.StatementBuilder.PlaceholderFormat(sq.Dollar).
		Select("COUNT(*)").
		From("Posts p").
		Where(sq.Eq{"p.ChannelId": c.Params.ChannelId}).
		Where("p.DeleteAt = 0").
		Where(sq.Eq{"p.Type": "custom_" + typeQuery}).
		Where(sq.Eq{"p.Props->>'status'": statuses})

	var count int64
	queryString, args, _ := query.ToSql()
	if err := store.QueryRow(queryString, args...).Scan(&count); err != nil {
		c.Err = model.NewAppError("countMyTasks", "api.task.count_my_tasks.app_error", nil, err.Error(), http.StatusInternalServerError)
		return
	}

	body := struct {
		Count int64 `json:"count"`
	}{count}
	err := json.NewEncoder(w).Encode(body)
	if err != nil {
		c.Logger.Warn("Error writing response", mlog.Err(err))
	}
}

func getMyTasks(c *Context, w http.ResponseWriter, r *http.Request) {
	postType := "custom_task"
	typeQuery := r.URL.Query().Get("type")
	switch typeQuery {
	case "trouble":
		postType = "custom_trouble"
	case "issue":
		postType = "custom_issue"
	case "plan":
		postType = "custom_plan"
	}

	statuses := r.URL.Query()["status[]"]
	if len(statuses) == 0 {
		c.SetInvalidParam("status")
		return
	}

	page := c.Params.Page
	perPage := c.Params.PerPage

	list, err := c.App.GetPostsPage(model.GetPostsOptions{
		UserId:    c.AppContext.Session().UserId,
		Page:      page,
		PerPage:   perPage,
		Type:      postType,
		Statuses:  statuses,
		FromMe:    typeQuery == "from_me",
		ToMe:      typeQuery == "to_me",
		IsManager: typeQuery == "is_manager",
	})
	if err != nil {
		c.Err = err
		return
	}

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

func countMyTasks(c *Context, w http.ResponseWriter, r *http.Request) {
	postType := "custom_task"
	typeQuery := r.URL.Query().Get("type")
	userId := c.AppContext.Session().UserId
	switch typeQuery {
	case "trouble":
		postType = "custom_trouble"
	case "issue":
		postType = "custom_issue"
	case "plan":
		postType = "custom_plan"
	}

	statuses := r.URL.Query()["status[]"]
	if len(statuses) == 0 {
		c.SetInvalidParam("status")
		return
	}

	store := c.App.Srv().Store().GetInternalMasterDB()
	query := sq.StatementBuilder.PlaceholderFormat(sq.Dollar).
		Select("COUNT(*)").
		From("Posts p").
		Where("p.DeleteAt = 0").
		Where(sq.Eq{"p.Type": postType}).
		Where(sq.Eq{"p.Props->>'status'": statuses})

	if typeQuery == "from_me" {
		query = query.Where(sq.Eq{"p.Props->>'creator_id'": userId})
	} else if typeQuery == "to_me" {
		query = query.Where("props->'assignee_ids' @> '\"" + userId + "\"'")
	} else if typeQuery == "is_manager" {
		query = query.Where("props->'manager_ids' @> '\"" + userId + "\"'")
	} else if postType == "custom_task" {
		query = query.Where(sq.Or{
			sq.Eq{"p.Props->>'creator_id'": userId},
			sq.Expr("props->'assignee_ids' @> '\"" + userId + "\"'"),
			sq.Expr("props->'manager_ids' @> '\"" + userId + "\"'"),
		})
	} else {
		channelMemberSubquery := fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM ChannelMembers cm
				WHERE cm.ChannelId = p.ChannelId
				AND cm.UserId = '%s'
			)
		`, userId)
		teamMemberSubquery := fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM Teams t
				JOIN TeamMembers tm ON t.Id = tm.TeamId
				JOIN Channels c ON c.Id = p.ChannelId
				WHERE tm.UserId = '%s'
				AND c.Name = t.Name || '-ky-thuat'
			)
		`, userId)
		query = query.Where(sq.Or{
			sq.Expr(channelMemberSubquery),
			sq.Expr(teamMemberSubquery),
		})
	}

	var count int64
	queryString, args, _ := query.ToSql()
	if err := store.QueryRow(queryString, args...).Scan(&count); err != nil {
		c.Err = model.NewAppError("countMyTasks", "api.task.count_my_tasks.app_error", nil, err.Error(), http.StatusInternalServerError)
		return
	}

	body := struct {
		Count int64 `json:"count"`
	}{count}
	err := json.NewEncoder(w).Encode(body)
	if err != nil {
		c.Logger.Warn("Error writing response", mlog.Err(err))
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

func getMyTaskChannels(c *Context, w http.ResponseWriter, r *http.Request) {
	userId := c.AppContext.Session().UserId
	channelMemberSubquery := fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM ChannelMembers cm
				WHERE cm.ChannelId = c.Id
				AND cm.UserId = '%s'
			)
		`, userId)
	teamMemberSubquery := fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM Teams t
				JOIN TeamMembers tm ON t.Id = tm.TeamId
				WHERE tm.UserId = '%s'
				AND c.Name = t.Name || '-ky-thuat'
			)
		`, userId)
	store := sqlx.NewDb(c.App.Srv().Store().GetInternalMasterDB(), model.DatabaseDriverPostgres)
	query := sq.StatementBuilder.PlaceholderFormat(sq.Dollar).
		Select("*").
		From("Channels c").
		Where(sq.Eq{"c.Type": "G"}).
		Where(sq.Like{"c.Name": "%-ky-thuat"}).
		Where(sq.Or{
			sq.Expr(channelMemberSubquery),
			sq.Expr(teamMemberSubquery),
		}).
		OrderBy("Id ASC")
	sql, args, err := query.ToSql()
	if err != nil {
		c.Err = model.NewAppError("getMyTaskChannels", "get_my_task_channels.app.error", nil, err.Error(), http.StatusInternalServerError)
		return
	}
	channels := model.ChannelList{}
	err = store.Select(&channels, sql, args...)
	if err != nil {
		c.Err = model.NewAppError("getMyTaskChannels", "get_my_task_channels.app.error", nil, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(channels); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

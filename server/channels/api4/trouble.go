package api4

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/v8/channels/app"
	"github.com/mattermost/mattermost/server/v8/channels/audit"
)

func (api *API) InitTrouble() {
	api.BaseRoutes.Troubles.Handle("", api.APISessionRequired(createTrouble)).Methods(http.MethodPost)
}

func createTrouble(c *Context, w http.ResponseWriter, r *http.Request) {
	var post model.Post
	if jsonErr := json.NewDecoder(r.Body).Decode(&post); jsonErr != nil {
		c.SetInvalidParamWithErr("trouble", jsonErr)
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
	post.Type = "custom_trouble"
	post.AddProp("creator_id", user.Id)
	post.AddProp("creator_name", user.GetFullName())
	post.AddProp("status", "new")

	auditRec := c.MakeAuditRecord("createTrouble", audit.Fail)
	defer c.LogAuditRecWithLevel(auditRec, app.LevelContent)
	audit.AddEventParameterAuditable(auditRec, "trouble", &post)

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
	auditRec.AddEventObjectType("trouble")

	c.App.Srv().Platform().UpdateLastActivityAtIfNeeded(*c.AppContext.Session())
	c.ExtendSessionExpiryIfNeeded(w, r)

	w.WriteHeader(http.StatusCreated)

	// Note that rp has already had PreparePostForClient called on it by App.CreatePost
	if err := rp.EncodeJSON(w); err != nil {
		c.Logger.Warn("Error while writing response", mlog.Err(err))
	}
}

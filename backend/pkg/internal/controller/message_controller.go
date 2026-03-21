package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	authctx "hack-sprinter/backend/pkg/context/auth"
	"hack-sprinter/backend/pkg/internal/usecase"
)

type MessageController struct {
	messageUsecase *usecase.MessageUsecase
}

func NewMessageController(messageUsecase *usecase.MessageUsecase) *MessageController {
	return &MessageController{messageUsecase: messageUsecase}
}

type sendMessageRequest struct {
	Content string `json:"content"`
}

func (c *MessageController) SendMessage(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	eventID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	var req sendMessageRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	msg, err := c.messageUsecase.SendMessage(ctx.Request().Context(), eventID, user.ID, req.Content)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrEventNotOngoing) {
			return echo.NewHTTPError(http.StatusBadRequest, "chat is only available during the event")
		}
		if errors.Is(err, usecase.ErrNotParticipant) {
			return echo.NewHTTPError(http.StatusForbidden, "only participants can send messages")
		}
		if errors.Is(err, usecase.ErrInvalidMessage) {
			return echo.NewHTTPError(http.StatusBadRequest, "message must be 1-500 characters")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to send message")
	}

	msg.UserName = user.Name
	return ctx.JSON(http.StatusCreated, msg)
}

func (c *MessageController) ListMessages(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	eventID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	sinceID := 0
	if s := ctx.QueryParam("since_id"); s != "" {
		if v, err := strconv.Atoi(s); err == nil {
			sinceID = v
		}
	}

	messages, err := c.messageUsecase.ListMessages(ctx.Request().Context(), eventID, user.ID, sinceID)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrNotParticipant) {
			return echo.NewHTTPError(http.StatusForbidden, "only participants can view messages")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list messages")
	}

	if messages == nil {
		return ctx.JSON(http.StatusOK, []interface{}{})
	}

	return ctx.JSON(http.StatusOK, messages)
}

package controller

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"

	authctx "hack-sprinter/backend/pkg/context/auth"
	"hack-sprinter/backend/pkg/internal/usecase"
)

type EventController struct {
	eventUsecase *usecase.EventUsecase
}

func NewEventController(eventUsecase *usecase.EventUsecase) *EventController {
	return &EventController{eventUsecase: eventUsecase}
}

type createEventRequest struct {
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	StartDatetime   time.Time  `json:"start_datetime"`
	EndDatetime     *time.Time `json:"end_datetime"`
	Category        string     `json:"category"`
	MaxParticipants int        `json:"max_participants"`
}

func (c *EventController) ListEvents(ctx echo.Context) error {
	pageStr := ctx.QueryParam("page")
	page := 1
	if pageStr != "" {
		p, err := strconv.Atoi(pageStr)
		if err == nil && p > 0 {
			page = p
		}
	}
	category := ctx.QueryParam("category")

	output, err := c.eventUsecase.ListEvents(ctx.Request().Context(), page, category)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list events")
	}

	return ctx.JSON(http.StatusOK, output)
}

func (c *EventController) CreateEvent(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var req createEventRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Title == "" || req.Description == "" || req.Category == "" || req.MaxParticipants == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "title, description, category, and max_participants are required")
	}

	event, err := c.eventUsecase.CreateEvent(ctx.Request().Context(), usecase.CreateEventInput{
		Title:           req.Title,
		Description:     req.Description,
		StartDatetime:   req.StartDatetime,
		EndDatetime:     req.EndDatetime,
		Category:        req.Category,
		MaxParticipants: req.MaxParticipants,
		OrganizerID:     user.ID,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidDuration) {
			return echo.NewHTTPError(http.StatusBadRequest, "duration must be within 12 hours")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create event")
	}

	return ctx.JSON(http.StatusCreated, event)
}

func (c *EventController) GetEvent(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	event, err := c.eventUsecase.GetEventByID(ctx.Request().Context(), id)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get event")
	}

	return ctx.JSON(http.StatusOK, event)
}

func (c *EventController) UpdateEvent(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	var req createEventRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	event, err := c.eventUsecase.UpdateEvent(ctx.Request().Context(), usecase.UpdateEventInput{
		ID:              id,
		Title:           req.Title,
		Description:     req.Description,
		StartDatetime:   req.StartDatetime,
		EndDatetime:     req.EndDatetime,
		Category:        req.Category,
		MaxParticipants: req.MaxParticipants,
		RequesterID:     user.ID,
		RequesterRole:   user.Role,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrForbidden) {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if errors.Is(err, usecase.ErrInvalidDuration) {
			return echo.NewHTTPError(http.StatusBadRequest, "duration must be within 12 hours")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update event")
	}

	return ctx.JSON(http.StatusOK, event)
}

func (c *EventController) DeleteEvent(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	if err := c.eventUsecase.DeleteEvent(ctx.Request().Context(), id, user.ID, user.Role); err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrForbidden) {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete event")
	}

	return ctx.NoContent(http.StatusNoContent)
}

func (c *EventController) ListMyEvents(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	events, err := c.eventUsecase.ListMyEvents(ctx.Request().Context(), user.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list events")
	}

	return ctx.JSON(http.StatusOK, events)
}

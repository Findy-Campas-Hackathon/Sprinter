package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	authctx "hack-sprinter/backend/pkg/context/auth"
	"hack-sprinter/backend/pkg/internal/usecase"
)

type ParticipantController struct {
	participantUsecase *usecase.ParticipantUsecase
}

func NewParticipantController(participantUsecase *usecase.ParticipantUsecase) *ParticipantController {
	return &ParticipantController{participantUsecase: participantUsecase}
}

func (c *ParticipantController) ListParticipants(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	participants, err := c.participantUsecase.ListParticipants(ctx.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list participants")
	}

	return ctx.JSON(http.StatusOK, participants)
}

func (c *ParticipantController) JoinEvent(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	participant, err := c.participantUsecase.JoinEvent(ctx.Request().Context(), id, user.ID)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrAlreadyJoined) {
			return echo.NewHTTPError(http.StatusConflict, "already joined this event")
		}
		if errors.Is(err, usecase.ErrEventFull) {
			return echo.NewHTTPError(http.StatusConflict, "event is full")
		}
		if errors.Is(err, usecase.ErrInvalidUser) {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid user - please login again")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to join event")
	}

	return ctx.JSON(http.StatusCreated, participant)
}

func (c *ParticipantController) CancelParticipation(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid event id")
	}

	if err := c.participantUsecase.CancelParticipation(ctx.Request().Context(), id, user.ID); err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "event not found")
		}
		if errors.Is(err, usecase.ErrEventOngoing) {
			return echo.NewHTTPError(http.StatusConflict, "開催中のイベントはキャンセルできません")
		}
		if errors.Is(err, usecase.ErrNotParticipant) {
			return echo.NewHTTPError(http.StatusNotFound, "not a participant")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to cancel participation")
	}

	return ctx.NoContent(http.StatusNoContent)
}

func (c *ParticipantController) ListMyParticipations(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	events, err := c.participantUsecase.ListMyParticipations(ctx.Request().Context(), user.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list participations")
	}

	return ctx.JSON(http.StatusOK, events)
}

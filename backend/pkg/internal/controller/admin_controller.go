package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"hack-sprinter/backend/pkg/internal/usecase"
)

type AdminController struct {
	adminUsecase *usecase.AdminUsecase
}

func NewAdminController(adminUsecase *usecase.AdminUsecase) *AdminController {
	return &AdminController{adminUsecase: adminUsecase}
}

func (c *AdminController) ListUsers(ctx echo.Context) error {
	users, err := c.adminUsecase.ListUsers(ctx.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list users")
	}
	return ctx.JSON(http.StatusOK, users)
}

func (c *AdminController) DeleteUser(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}

	if err := c.adminUsecase.DeleteUser(ctx.Request().Context(), id); err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete user")
	}

	return ctx.NoContent(http.StatusNoContent)
}

func (c *AdminController) ListAllEvents(ctx echo.Context) error {
	events, err := c.adminUsecase.ListAllEvents(ctx.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list events")
	}
	return ctx.JSON(http.StatusOK, events)
}

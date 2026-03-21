package controller

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	authctx "hack-sprinter/backend/pkg/context/auth"
	"hack-sprinter/backend/pkg/internal/usecase"
)

type AuthController struct {
	authUsecase *usecase.AuthUsecase
}

func NewAuthController(authUsecase *usecase.AuthUsecase) *AuthController {
	return &AuthController{authUsecase: authUsecase}
}

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type updateMeRequest struct {
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
}

func (c *AuthController) Register(ctx echo.Context) error {
	var req registerRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Password == "" || req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "password and name are required")
	}

	var email *string
	if req.Email != "" {
		email = &req.Email
	}

	output, err := c.authUsecase.Register(ctx.Request().Context(), usecase.RegisterInput{
		Email:    email,
		Password: req.Password,
		Name:     req.Name,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrEmailAlreadyExists) {
			return echo.NewHTTPError(http.StatusConflict, "email already exists")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to register")
	}

	return ctx.JSON(http.StatusCreated, output)
}

func (c *AuthController) Login(ctx echo.Context) error {
	var req loginRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	output, err := c.authUsecase.Login(ctx.Request().Context(), usecase.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCredentials) {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to login")
	}

	return ctx.JSON(http.StatusOK, output)
}

func (c *AuthController) GetMe(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	me, err := c.authUsecase.GetMe(ctx.Request().Context(), user.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	return ctx.JSON(http.StatusOK, me)
}

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
	"image/webp": ".webp",
}

const maxAvatarSize = 5 << 20 // 5MB

func (c *AuthController) UploadAvatar(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	file, err := ctx.FormFile("avatar")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "avatar file is required")
	}

	if file.Size > maxAvatarSize {
		return echo.NewHTTPError(http.StatusBadRequest, "file size must be less than 5MB")
	}

	src, err := file.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read file")
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read file")
	}
	contentType := http.DetectContentType(buf[:n])

	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "only JPEG, PNG, GIF, WebP images are allowed")
	}

	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read file")
	}

	uploadDir := "uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create upload directory")
	}

	filename := fmt.Sprintf("%d_%d%s", user.ID, time.Now().UnixNano(), ext)
	dstPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save file")
	}

	avatarURL := "/uploads/avatars/" + filename

	existingUser, err := c.authUsecase.GetMe(ctx.Request().Context(), user.ID)
	if err == nil && existingUser.AvatarURL != nil {
		old := *existingUser.AvatarURL
		if strings.HasPrefix(old, "/uploads/") {
			os.Remove(strings.TrimPrefix(old, "/"))
		}
	}

	updated, err := c.authUsecase.UpdateMe(ctx.Request().Context(), user.ID, usecase.UpdateMeInput{
		Name:      existingUser.Name,
		AvatarURL: &avatarURL,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update avatar")
	}

	return ctx.JSON(http.StatusOK, updated)
}

func (c *AuthController) UpdateMe(ctx echo.Context) error {
	user := authctx.GetUser(ctx.Request().Context())
	if user == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var req updateMeRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}

	// 空文字は「未設定」とみなす
	var avatarURL *string
	if req.AvatarURL != nil && *req.AvatarURL != "" {
		avatarURL = req.AvatarURL
	}

	updated, err := c.authUsecase.UpdateMe(ctx.Request().Context(), user.ID, usecase.UpdateMeInput{
		Name:      req.Name,
		AvatarURL: avatarURL,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update user")
	}

	return ctx.JSON(http.StatusOK, updated)
}

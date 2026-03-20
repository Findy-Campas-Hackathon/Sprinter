package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"

	authctx "hack-sprinter/backend/pkg/context/auth"
	"hack-sprinter/backend/pkg/constant"
)

func JWTAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "authorization header required")
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header format")
			}

			tokenStr := parts[1]
			secret := os.Getenv("JWT_SECRET")
			if secret == "" {
				secret = "secret"
			}

			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, echo.NewHTTPError(http.StatusUnauthorized, "unexpected signing method")
				}
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
			}

			userIDFloat, ok := claims["user_id"].(float64)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token: missing user_id")
			}

			email, _ := claims["email"].(string)

			user := &authctx.AuthUser{
				ID:    int(userIDFloat),
				Email: email,
				Role:  claims["role"].(string),
				Name:  claims["name"].(string),
			}

			ctx := authctx.SetUser(c.Request().Context(), user)
			c.SetRequest(c.Request().WithContext(ctx))

			return next(c)
		}
	}
}

func RequireAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user := authctx.GetUser(c.Request().Context())
			if user == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
			}
			if user.Role != constant.RoleAdmin {
				return echo.NewHTTPError(http.StatusForbidden, "admin access required")
			}
			return next(c)
		}
	}
}

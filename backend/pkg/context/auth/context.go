package auth

import (
	"context"
)

type contextKey string

const userContextKey contextKey = "auth_user"

type AuthUser struct {
	ID    int
	Email string
	Role  string
	Name  string
}

func SetUser(ctx context.Context, user *AuthUser) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

func GetUser(ctx context.Context) *AuthUser {
	user, _ := ctx.Value(userContextKey).(*AuthUser)
	return user
}

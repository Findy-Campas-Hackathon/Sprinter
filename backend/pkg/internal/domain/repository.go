package domain

import "context"

type UserRepository interface {
	FindByID(ctx context.Context, id string) (*User, error)
	FindAll(ctx context.Context) ([]*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	FindByName(ctx context.Context, name string) (*User, error)
}

package usecase

import (
	"context"

	"hack-sprinter/backend/pkg/internal/domain"
)

type UserUsecase struct {
	repo domain.UserRepository
}

func NewUserUsecase(repo domain.UserRepository) *UserUsecase {
	return &UserUsecase{repo: repo}
}

func (u *UserUsecase) GetByID(ctx context.Context, id string) (*domain.User, error) {
	return u.repo.FindByID(ctx, id)
}

func (u *UserUsecase) GetAll(ctx context.Context) ([]*domain.User, error) {
	return u.repo.FindAll(ctx)
}

func (u *UserUsecase) Create(ctx context.Context, user *domain.User) error {
	return u.repo.Create(ctx, user)
}

func (u *UserUsecase) Update(ctx context.Context, user *domain.User) error {
	return u.repo.Update(ctx, user)
}

func (u *UserUsecase) Delete(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

package usecase

import (
	"context"
	"fmt"

	"hack-sprinter/backend/pkg/internal/domain"
)

type AdminUsecase struct {
	userRepo  UserRepository
	eventRepo EventRepository
}

func NewAdminUsecase(userRepo UserRepository, eventRepo EventRepository) *AdminUsecase {
	return &AdminUsecase{userRepo: userRepo, eventRepo: eventRepo}
}

func (u *AdminUsecase) ListUsers(ctx context.Context) ([]*domain.User, error) {
	users, err := u.userRepo.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	return users, nil
}

func (u *AdminUsecase) DeleteUser(ctx context.Context, id int) error {
	_, err := u.userRepo.FindByID(ctx, id)
	if err != nil {
		return ErrNotFound
	}
	if err := u.userRepo.DeleteUser(ctx, id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

func (u *AdminUsecase) ListAllEvents(ctx context.Context) ([]*domain.Event, error) {
	events, err := u.eventRepo.ListAllEvents(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list all events: %w", err)
	}
	return events, nil
}

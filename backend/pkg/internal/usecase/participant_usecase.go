package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"hack-sprinter/backend/pkg/internal/domain"
)

type ParticipantRepository interface {
	JoinEvent(ctx context.Context, eventID, userID int) (*domain.Participant, error)
	CancelParticipation(ctx context.Context, eventID, userID int) error
	ListParticipants(ctx context.Context, eventID int) ([]*domain.Participant, error)
	CountParticipants(ctx context.Context, eventID int) (int, error)
	IsParticipant(ctx context.Context, eventID, userID int) (bool, error)
	ListEventsByParticipant(ctx context.Context, userID int) ([]*domain.Event, error)
}

type ParticipantUsecase struct {
	participantRepo ParticipantRepository
	eventRepo       EventRepository
}

func NewParticipantUsecase(participantRepo ParticipantRepository, eventRepo EventRepository) *ParticipantUsecase {
	return &ParticipantUsecase{
		participantRepo: participantRepo,
		eventRepo:       eventRepo,
	}
}

func (u *ParticipantUsecase) JoinEvent(ctx context.Context, eventID, userID int) (*domain.Participant, error) {
	event, err := u.eventRepo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, ErrNotFound
	}

	isParticipant, err := u.participantRepo.IsParticipant(ctx, eventID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check participation: %w", err)
	}
	if isParticipant {
		return nil, ErrAlreadyJoined
	}

	count, err := u.participantRepo.CountParticipants(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("failed to count participants: %w", err)
	}
	if count >= event.MaxParticipants {
		return nil, ErrEventFull
	}

	p, err := u.participantRepo.JoinEvent(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateParticipant) {
			return nil, ErrAlreadyJoined
		}
		if errors.Is(err, domain.ErrInvalidReference) {
			return nil, ErrInvalidUser
		}
		return nil, fmt.Errorf("failed to join event: %w", err)
	}
	return p, nil
}

func (u *ParticipantUsecase) CancelParticipation(ctx context.Context, eventID, userID int) error {
	event, err := u.eventRepo.GetEventByID(ctx, eventID)
	if err != nil {
		return ErrNotFound
	}

	now := time.Now()
	if now.After(event.StartDatetime) && (event.EndDatetime == nil || now.Before(*event.EndDatetime)) {
		return ErrEventOngoing
	}

	isParticipant, err := u.participantRepo.IsParticipant(ctx, eventID, userID)
	if err != nil {
		return fmt.Errorf("failed to check participation: %w", err)
	}
	if !isParticipant {
		return ErrNotParticipant
	}

	if err := u.participantRepo.CancelParticipation(ctx, eventID, userID); err != nil {
		return fmt.Errorf("failed to cancel participation: %w", err)
	}
	return nil
}

func (u *ParticipantUsecase) ListParticipants(ctx context.Context, eventID int) ([]*domain.Participant, error) {
	participants, err := u.participantRepo.ListParticipants(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("failed to list participants: %w", err)
	}
	return participants, nil
}

func (u *ParticipantUsecase) ListMyParticipations(ctx context.Context, userID int) ([]*domain.Event, error) {
	events, err := u.participantRepo.ListEventsByParticipant(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list participations: %w", err)
	}
	return events, nil
}

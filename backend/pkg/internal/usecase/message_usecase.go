package usecase

import (
	"context"
	"fmt"
	"time"

	"hack-sprinter/backend/pkg/internal/domain"
)

type MessageRepository interface {
	CreateMessage(ctx context.Context, eventID, userID int, content string) (*domain.Message, error)
	ListMessages(ctx context.Context, eventID int, sinceID int) ([]*domain.Message, error)
}

type MessageUsecase struct {
	messageRepo     MessageRepository
	eventRepo       EventRepository
	participantRepo ParticipantRepository
}

func NewMessageUsecase(messageRepo MessageRepository, eventRepo EventRepository, participantRepo ParticipantRepository) *MessageUsecase {
	return &MessageUsecase{
		messageRepo:     messageRepo,
		eventRepo:       eventRepo,
		participantRepo: participantRepo,
	}
}

func (u *MessageUsecase) SendMessage(ctx context.Context, eventID, userID int, content string) (*domain.Message, error) {
	event, err := u.eventRepo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, ErrNotFound
	}

	now := time.Now()
	isOngoing := !event.StartDatetime.After(now) && event.EndDatetime != nil && event.EndDatetime.After(now)
	if !isOngoing {
		return nil, ErrEventNotOngoing
	}

	isParticipant, err := u.participantRepo.IsParticipant(ctx, eventID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check participation: %w", err)
	}
	isOrganizer := event.OrganizerID == userID
	if !isParticipant && !isOrganizer {
		return nil, ErrNotParticipant
	}

	if len(content) == 0 || len(content) > 500 {
		return nil, ErrInvalidMessage
	}

	msg, err := u.messageRepo.CreateMessage(ctx, eventID, userID, content)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}
	return msg, nil
}

func (u *MessageUsecase) ListMessages(ctx context.Context, eventID, userID int, sinceID int) ([]*domain.Message, error) {
	event, err := u.eventRepo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, ErrNotFound
	}

	isParticipant, err := u.participantRepo.IsParticipant(ctx, eventID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check participation: %w", err)
	}
	isOrganizer := event.OrganizerID == userID
	if !isParticipant && !isOrganizer {
		return nil, ErrNotParticipant
	}

	messages, err := u.messageRepo.ListMessages(ctx, eventID, sinceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list messages: %w", err)
	}
	return messages, nil
}

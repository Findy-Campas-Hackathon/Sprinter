package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"hack-sprinter/backend/pkg/constant"
	"hack-sprinter/backend/pkg/internal/domain"
)

var (
	ErrInvalidDuration = errors.New("invalid duration")
)

type EventRepository interface {
	CreateEvent(ctx context.Context, e *domain.Event) (*domain.Event, error)
	GetEventByID(ctx context.Context, id int) (*domain.Event, error)
	UpdateEvent(ctx context.Context, e *domain.Event) (*domain.Event, error)
	DeleteEvent(ctx context.Context, id int) error
	ListEvents(ctx context.Context, page int, category string) ([]*domain.Event, int, error)
	ListAllEvents(ctx context.Context) ([]*domain.Event, error)
	ListEventsByOrganizer(ctx context.Context, organizerID int) ([]*domain.Event, error)
}

type EventUsecase struct {
	eventRepo EventRepository
}

func NewEventUsecase(eventRepo EventRepository) *EventUsecase {
	return &EventUsecase{eventRepo: eventRepo}
}

type CreateEventInput struct {
	Title           string
	Description     string
	StartDatetime   time.Time
	EndDatetime     *time.Time
	Category        string
	MaxParticipants int
	OrganizerID     int
}

type UpdateEventInput struct {
	ID              int
	Title           string
	Description     string
	StartDatetime   time.Time
	EndDatetime     *time.Time
	Category        string
	MaxParticipants int
	RequesterID     int
	RequesterRole   string
}

type ListEventsOutput struct {
	Events     []*domain.Event `json:"events"`
	TotalPages int             `json:"total_pages"`
	Page       int             `json:"page"`
	Total      int             `json:"total"`
}

func (u *EventUsecase) CreateEvent(ctx context.Context, input CreateEventInput) (*domain.Event, error) {
	if input.EndDatetime != nil {
		dur := input.EndDatetime.Sub(input.StartDatetime)
		// 0以下は禁止。最大12時間まで
		if dur <= 0 || dur > 12*time.Hour {
			return nil, ErrInvalidDuration
		}
	}

	e := &domain.Event{
		Title:           input.Title,
		Description:     input.Description,
		StartDatetime:   input.StartDatetime,
		EndDatetime:     input.EndDatetime,
		Category:        input.Category,
		MaxParticipants: input.MaxParticipants,
		OrganizerID:     input.OrganizerID,
	}

	created, err := u.eventRepo.CreateEvent(ctx, e)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}
	return created, nil
}

func (u *EventUsecase) GetEventByID(ctx context.Context, id int) (*domain.Event, error) {
	event, err := u.eventRepo.GetEventByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return event, nil
}

func (u *EventUsecase) UpdateEvent(ctx context.Context, input UpdateEventInput) (*domain.Event, error) {
	event, err := u.eventRepo.GetEventByID(ctx, input.ID)
	if err != nil {
		return nil, ErrNotFound
	}

	if event.OrganizerID != input.RequesterID && input.RequesterRole != constant.RoleAdmin {
		return nil, ErrForbidden
	}

	event.Title = input.Title
	event.Description = input.Description
	event.StartDatetime = input.StartDatetime
	event.EndDatetime = input.EndDatetime
	event.Category = input.Category
	event.MaxParticipants = input.MaxParticipants

	if input.EndDatetime != nil {
		dur := input.EndDatetime.Sub(input.StartDatetime)
		if dur <= 0 || dur > 12*time.Hour {
			return nil, ErrInvalidDuration
		}
	}

	updated, err := u.eventRepo.UpdateEvent(ctx, event)
	if err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}
	return updated, nil
}

func (u *EventUsecase) DeleteEvent(ctx context.Context, id, requesterID int, requesterRole string) error {
	event, err := u.eventRepo.GetEventByID(ctx, id)
	if err != nil {
		return ErrNotFound
	}

	if event.OrganizerID != requesterID && requesterRole != constant.RoleAdmin {
		return ErrForbidden
	}

	if err := u.eventRepo.DeleteEvent(ctx, id); err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}
	return nil
}

func (u *EventUsecase) ListEvents(ctx context.Context, page int, category string) (*ListEventsOutput, error) {
	if page < 1 {
		page = 1
	}

	events, total, err := u.eventRepo.ListEvents(ctx, page, category)
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	totalPages := (total + constant.PageSize - 1) / constant.PageSize
	if totalPages == 0 {
		totalPages = 1
	}

	return &ListEventsOutput{
		Events:     events,
		TotalPages: totalPages,
		Page:       page,
		Total:      total,
	}, nil
}

func (u *EventUsecase) ListAllEvents(ctx context.Context) ([]*domain.Event, error) {
	return u.eventRepo.ListAllEvents(ctx)
}

func (u *EventUsecase) ListMyEvents(ctx context.Context, organizerID int) ([]*domain.Event, error) {
	return u.eventRepo.ListEventsByOrganizer(ctx, organizerID)
}

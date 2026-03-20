package infrastructure

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"hack-sprinter/backend/pkg/constant"
	"hack-sprinter/backend/pkg/internal/domain"
)

type EventRepository struct {
	pool *pgxpool.Pool
}

func NewEventRepository(pool *pgxpool.Pool) *EventRepository {
	return &EventRepository{pool: pool}
}

func (r *EventRepository) CreateEvent(ctx context.Context, e *domain.Event) (*domain.Event, error) {
	query := `
		INSERT INTO events (title, description, start_datetime, end_datetime, category, max_participants, location_url, organizer_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, title, description, start_datetime, end_datetime, category, max_participants, location_url, organizer_id, created_at, updated_at
	`
	created := &domain.Event{}
	err := r.pool.QueryRow(ctx, query,
		e.Title, e.Description, e.StartDatetime, e.EndDatetime,
		e.Category, e.MaxParticipants, e.LocationURL, e.OrganizerID,
	).Scan(
		&created.ID, &created.Title, &created.Description,
		&created.StartDatetime, &created.EndDatetime,
		&created.Category, &created.MaxParticipants, &created.LocationURL,
		&created.OrganizerID, &created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}
	return created, nil
}

func (r *EventRepository) GetEventByID(ctx context.Context, id int) (*domain.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
		       e.category, e.max_participants, e.location_url, e.organizer_id,
		       u.name as organizer_name,
		       COUNT(p.id) as participant_count,
		       e.created_at, e.updated_at
		FROM events e
		JOIN users u ON e.organizer_id = u.id
		LEFT JOIN participants p ON e.id = p.event_id
		WHERE e.id = $1
		GROUP BY e.id, u.name
	`
	event := &domain.Event{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&event.ID, &event.Title, &event.Description,
		&event.StartDatetime, &event.EndDatetime,
		&event.Category, &event.MaxParticipants, &event.LocationURL,
		&event.OrganizerID, &event.OrganizerName, &event.ParticipantCount,
		&event.CreatedAt, &event.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("event not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	return event, nil
}

func (r *EventRepository) UpdateEvent(ctx context.Context, e *domain.Event) (*domain.Event, error) {
	query := `
		UPDATE events
		SET title=$1, description=$2, start_datetime=$3, end_datetime=$4,
		    category=$5, max_participants=$6, location_url=$7
		WHERE id=$8
		RETURNING id, title, description, start_datetime, end_datetime, category, max_participants, location_url, organizer_id, created_at, updated_at
	`
	updated := &domain.Event{}
	err := r.pool.QueryRow(ctx, query,
		e.Title, e.Description, e.StartDatetime, e.EndDatetime,
		e.Category, e.MaxParticipants, e.LocationURL, e.ID,
	).Scan(
		&updated.ID, &updated.Title, &updated.Description,
		&updated.StartDatetime, &updated.EndDatetime,
		&updated.Category, &updated.MaxParticipants, &updated.LocationURL,
		&updated.OrganizerID, &updated.CreatedAt, &updated.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}
	return updated, nil
}

func (r *EventRepository) DeleteEvent(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM events WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}
	return nil
}

func (r *EventRepository) ListEvents(ctx context.Context, page int, category string) ([]*domain.Event, int, error) {
	offset := (page - 1) * constant.PageSize

	countQuery := `SELECT COUNT(*) FROM events`
	listQuery := `
		SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
		       e.category, e.max_participants, e.location_url, e.organizer_id,
		       u.name as organizer_name,
		       COUNT(p.id) as participant_count,
		       e.created_at, e.updated_at
		FROM events e
		JOIN users u ON e.organizer_id = u.id
		LEFT JOIN participants p ON e.id = p.event_id
	`

	var args []interface{}
	if category != "" {
		countQuery += ` WHERE category = $1`
		listQuery += ` WHERE e.category = $1`
		args = append(args, category)
		listQuery += ` GROUP BY e.id, u.name ORDER BY e.start_datetime DESC LIMIT $2 OFFSET $3`
		args = append(args, constant.PageSize, offset)
	} else {
		listQuery += ` GROUP BY e.id, u.name ORDER BY e.start_datetime DESC LIMIT $1 OFFSET $2`
		args = append(args, constant.PageSize, offset)
	}

	var total int
	if category != "" {
		err := r.pool.QueryRow(ctx, countQuery, category).Scan(&total)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to count events: %w", err)
		}
	} else {
		err := r.pool.QueryRow(ctx, countQuery).Scan(&total)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to count events: %w", err)
		}
	}

	rows, err := r.pool.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list events: %w", err)
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		event := &domain.Event{}
		if err := rows.Scan(
			&event.ID, &event.Title, &event.Description,
			&event.StartDatetime, &event.EndDatetime,
			&event.Category, &event.MaxParticipants, &event.LocationURL,
			&event.OrganizerID, &event.OrganizerName, &event.ParticipantCount,
			&event.CreatedAt, &event.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}

	return events, total, nil
}

func (r *EventRepository) ListAllEvents(ctx context.Context) ([]*domain.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
		       e.category, e.max_participants, e.location_url, e.organizer_id,
		       u.name as organizer_name,
		       COUNT(p.id) as participant_count,
		       e.created_at, e.updated_at
		FROM events e
		JOIN users u ON e.organizer_id = u.id
		LEFT JOIN participants p ON e.id = p.event_id
		GROUP BY e.id, u.name
		ORDER BY e.start_datetime DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list all events: %w", err)
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		event := &domain.Event{}
		if err := rows.Scan(
			&event.ID, &event.Title, &event.Description,
			&event.StartDatetime, &event.EndDatetime,
			&event.Category, &event.MaxParticipants, &event.LocationURL,
			&event.OrganizerID, &event.OrganizerName, &event.ParticipantCount,
			&event.CreatedAt, &event.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}
	return events, nil
}

func (r *EventRepository) ListEventsByOrganizer(ctx context.Context, organizerID int) ([]*domain.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
		       e.category, e.max_participants, e.location_url, e.organizer_id,
		       u.name as organizer_name,
		       COUNT(p.id) as participant_count,
		       e.created_at, e.updated_at
		FROM events e
		JOIN users u ON e.organizer_id = u.id
		LEFT JOIN participants p ON e.id = p.event_id
		WHERE e.organizer_id = $1
		GROUP BY e.id, u.name
		ORDER BY e.start_datetime DESC
	`
	rows, err := r.pool.Query(ctx, query, organizerID)
	if err != nil {
		return nil, fmt.Errorf("failed to list events by organizer: %w", err)
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		event := &domain.Event{}
		if err := rows.Scan(
			&event.ID, &event.Title, &event.Description,
			&event.StartDatetime, &event.EndDatetime,
			&event.Category, &event.MaxParticipants, &event.LocationURL,
			&event.OrganizerID, &event.OrganizerName, &event.ParticipantCount,
			&event.CreatedAt, &event.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}
	return events, nil
}

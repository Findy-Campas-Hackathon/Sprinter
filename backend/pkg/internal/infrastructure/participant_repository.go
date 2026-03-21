package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"hack-sprinter/backend/pkg/internal/domain"
)

type ParticipantRepository struct {
	pool *pgxpool.Pool
}

func NewParticipantRepository(pool *pgxpool.Pool) *ParticipantRepository {
	return &ParticipantRepository{pool: pool}
}

func (r *ParticipantRepository) JoinEvent(ctx context.Context, eventID, userID int) (*domain.Participant, error) {
	query := `
		INSERT INTO participants (event_id, user_id)
		VALUES ($1, $2)
		RETURNING id, event_id, user_id, joined_at
	`
	p := &domain.Participant{}
	err := r.pool.QueryRow(ctx, query, eventID, userID).Scan(
		&p.ID, &p.EventID, &p.UserID, &p.JoinedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return nil, domain.ErrDuplicateParticipant
			}
			if pgErr.Code == "23503" || strings.Contains(pgErr.Message, "foreign key") {
				return nil, domain.ErrInvalidReference
			}
		}
		return nil, fmt.Errorf("failed to join event: %w", err)
	}
	return p, nil
}

func (r *ParticipantRepository) CancelParticipation(ctx context.Context, eventID, userID int) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM participants WHERE event_id=$1 AND user_id=$2`, eventID, userID)
	if err != nil {
		return fmt.Errorf("failed to cancel participation: %w", err)
	}
	return nil
}

func (r *ParticipantRepository) ListParticipants(ctx context.Context, eventID int) ([]*domain.Participant, error) {
	query := `
		SELECT p.id, p.event_id, p.user_id, u.name as user_name, u.avatar_url, p.joined_at
		FROM participants p
		JOIN users u ON p.user_id = u.id
		WHERE p.event_id = $1
		ORDER BY p.joined_at ASC
	`
	rows, err := r.pool.Query(ctx, query, eventID)
	if err != nil {
		return nil, fmt.Errorf("failed to list participants: %w", err)
	}
	defer rows.Close()

	var participants []*domain.Participant
	for rows.Next() {
		p := &domain.Participant{}
		if err := rows.Scan(&p.ID, &p.EventID, &p.UserID, &p.UserName, &p.AvatarURL, &p.JoinedAt); err != nil {
			return nil, fmt.Errorf("failed to scan participant: %w", err)
		}
		participants = append(participants, p)
	}
	return participants, nil
}

func (r *ParticipantRepository) CountParticipants(ctx context.Context, eventID int) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM participants WHERE event_id=$1`, eventID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count participants: %w", err)
	}
	return count, nil
}

func (r *ParticipantRepository) IsParticipant(ctx context.Context, eventID, userID int) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM participants WHERE event_id=$1 AND user_id=$2`, eventID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check participation: %w", err)
	}
	return count > 0, nil
}

func (r *ParticipantRepository) ListEventsByParticipant(ctx context.Context, userID int) ([]*domain.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
		       e.category, e.max_participants, e.organizer_id,
		       u.name as organizer_name,
		       COUNT(p2.id) as participant_count,
		       e.created_at, e.updated_at
		FROM participants p
		JOIN events e ON p.event_id = e.id
		JOIN users u ON e.organizer_id = u.id
		LEFT JOIN participants p2 ON e.id = p2.event_id
		WHERE p.user_id = $1
		GROUP BY e.id, u.name
		ORDER BY e.start_datetime DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list events by participant: %w", err)
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		event := &domain.Event{}
		if err := rows.Scan(
			&event.ID, &event.Title, &event.Description,
			&event.StartDatetime, &event.EndDatetime,
			&event.Category, &event.MaxParticipants,
			&event.OrganizerID, &event.OrganizerName, &event.ParticipantCount,
			&event.CreatedAt, &event.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}
	return events, nil
}

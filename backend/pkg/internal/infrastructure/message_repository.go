package infrastructure

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"hack-sprinter/backend/pkg/internal/domain"
)

type MessageRepository struct {
	pool *pgxpool.Pool
}

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) CreateMessage(ctx context.Context, eventID, userID int, content string) (*domain.Message, error) {
	query := `
		INSERT INTO messages (event_id, user_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, event_id, user_id, content, created_at
	`
	m := &domain.Message{}
	err := r.pool.QueryRow(ctx, query, eventID, userID, content).Scan(
		&m.ID, &m.EventID, &m.UserID, &m.Content, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}
	return m, nil
}

func (r *MessageRepository) ListMessages(ctx context.Context, eventID int, sinceID int) ([]*domain.Message, error) {
	query := `
		SELECT m.id, m.event_id, m.user_id, u.name, u.avatar_url, m.content, m.created_at
		FROM messages m
		JOIN users u ON m.user_id = u.id
		WHERE m.event_id = $1
	`
	var args []interface{}
	args = append(args, eventID)

	if sinceID > 0 {
		query += ` AND m.id > $2 ORDER BY m.created_at ASC`
		args = append(args, sinceID)
	} else {
		query += ` ORDER BY m.created_at ASC LIMIT 100`
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list messages: %w", err)
	}
	defer rows.Close()

	var messages []*domain.Message
	for rows.Next() {
		m := &domain.Message{}
		if err := rows.Scan(&m.ID, &m.EventID, &m.UserID, &m.UserName, &m.AvatarURL, &m.Content, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, m)
	}
	return messages, nil
}

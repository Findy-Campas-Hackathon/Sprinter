package infrastructure

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"hack-sprinter/backend/pkg/internal/domain"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) CreateUser(ctx context.Context, email *string, passwordHash, name string) (*domain.User, error) {
	query := `
		INSERT INTO users (email, password_hash, name, role)
		VALUES ($1, $2, $3, 'user')
		RETURNING id, email, password_hash, name, role, avatar_url, created_at, updated_at
	`
	user := &domain.User{}
	err := r.pool.QueryRow(ctx, query, email, passwordHash, name).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, avatar_url, created_at, updated_at
		FROM users WHERE email = $1
	`
	user := &domain.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, avatar_url, created_at, updated_at
		FROM users WHERE id = $1
	`
	user := &domain.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) ListUsers(ctx context.Context) ([]*domain.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, avatar_url, created_at, updated_at
		FROM users ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		user := &domain.User{}
		if err := rows.Scan(
			&user.ID, &user.Email, &user.PasswordHash, &user.Name,
			&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *UserRepository) DeleteUser(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

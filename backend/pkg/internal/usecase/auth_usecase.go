package usecase

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"hack-sprinter/backend/pkg/internal/domain"
)

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrNotFound           = errors.New("not found")
	ErrForbidden          = errors.New("forbidden")
	ErrAlreadyJoined      = errors.New("already joined")
	ErrEventFull          = errors.New("event is full")
	ErrNotParticipant     = errors.New("not a participant")
)

type UserRepository interface {
	CreateUser(ctx context.Context, email, passwordHash, name string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id int) (*domain.User, error)
	ListUsers(ctx context.Context) ([]*domain.User, error)
	DeleteUser(ctx context.Context, id int) error
}

type AuthUsecase struct {
	userRepo UserRepository
}

func NewAuthUsecase(userRepo UserRepository) *AuthUsecase {
	return &AuthUsecase{userRepo: userRepo}
}

type RegisterInput struct {
	Email    string
	Password string
	Name     string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthOutput struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

func (u *AuthUsecase) Register(ctx context.Context, input RegisterInput) (*AuthOutput, error) {
	existing, err := u.userRepo.FindByEmail(ctx, input.Email)
	if err == nil && existing != nil {
		return nil, ErrEmailAlreadyExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user, err := u.userRepo.CreateUser(ctx, input.Email, string(hash), input.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthOutput{Token: token, User: user}, nil
}

func (u *AuthUsecase) Login(ctx context.Context, input LoginInput) (*AuthOutput, error) {
	user, err := u.userRepo.FindByEmail(ctx, input.Email)
	if err != nil || user == nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthOutput{Token: token, User: user}, nil
}

func (u *AuthUsecase) GetMe(ctx context.Context, userID int) (*domain.User, error) {
	user, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrNotFound
	}
	return user, nil
}

func generateToken(user *domain.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"name":    user.Name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return signed, nil
}

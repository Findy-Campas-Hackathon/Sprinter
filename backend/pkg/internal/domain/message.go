package domain

import "time"

type Message struct {
	ID        int       `json:"id"`
	EventID   int       `json:"event_id"`
	UserID    int       `json:"user_id"`
	UserName  string    `json:"user_name,omitempty"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

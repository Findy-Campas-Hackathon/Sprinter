package domain

import "time"

type Participant struct {
	ID       int       `json:"id"`
	EventID  int       `json:"event_id"`
	UserID   int       `json:"user_id"`
	UserName string    `json:"user_name,omitempty"`
	JoinedAt time.Time `json:"joined_at"`
}

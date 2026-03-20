package domain

import "time"

type Event struct {
	ID                int        `json:"id"`
	Title             string     `json:"title"`
	Description       string     `json:"description"`
	StartDatetime     time.Time  `json:"start_datetime"`
	EndDatetime       *time.Time `json:"end_datetime"`
	Category          string     `json:"category"`
	MaxParticipants   int        `json:"max_participants"`
	LocationURL       *string    `json:"location_url"`
	OrganizerID       int        `json:"organizer_id"`
	OrganizerName     string     `json:"organizer_name,omitempty"`
	ParticipantCount  int        `json:"participant_count,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

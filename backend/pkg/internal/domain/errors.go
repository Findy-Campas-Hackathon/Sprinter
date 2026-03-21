package domain

import "errors"

var (
	ErrDuplicateParticipant = errors.New("duplicate participant")
	ErrInvalidReference     = errors.New("invalid user or event reference")
)

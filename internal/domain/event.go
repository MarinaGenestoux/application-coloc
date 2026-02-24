package domain

import (
	"context"
	"time"
)

// EventStatus represents the status of an event
type EventStatus string

const (
	EventStatusUpcoming  EventStatus = "upcoming"
	EventStatusOngoing   EventStatus = "ongoing"
	EventStatusCompleted EventStatus = "completed"
	EventStatusCancelled EventStatus = "cancelled"
)

// RSVPStatus represents a user's response to an event
type RSVPStatus string

const (
	RSVPStatusGoing    RSVPStatus = "going"
	RSVPStatusMaybe    RSVPStatus = "maybe"
	RSVPStatusNotGoing RSVPStatus = "not_going"
)

// Event represents a colocation event
type Event struct {
	ID              string       `json:"id" db:"id"`
	ColocationID    string       `json:"colocation_id" db:"colocation_id"`
	CreatedBy       string       `json:"created_by" db:"created_by"`
	CreatedByNom    string       `json:"created_by_nom" db:"created_by_nom"`
	CreatedByPrenom string       `json:"created_by_prenom" db:"created_by_prenom"`
	Title           string       `json:"title" db:"title"`
	Description     *string      `json:"description,omitempty" db:"description"`
	EventDate       time.Time    `json:"event_date" db:"event_date"`
	Location        *string      `json:"location,omitempty" db:"location"`
	Budget          *float64     `json:"budget,omitempty" db:"budget"`
	FundID          *string      `json:"fund_id,omitempty" db:"fund_id"`
	Status          EventStatus  `json:"status" db:"status"`
	CreatedAt       time.Time    `json:"created_at" db:"created_at"`
	UserRSVP        RSVPStatus   `json:"user_rsvp" db:"user_rsvp"`
	GoingCount      int          `json:"going_count" db:"going_count"`
	MaybeCount      int          `json:"maybe_count" db:"maybe_count"`
	NotGoingCount   int          `json:"not_going_count" db:"not_going_count"`
}

// EventParticipant represents a participant's RSVP
type EventParticipant struct {
	UserID       string     `json:"user_id" db:"user_id"`
	UserNom      string     `json:"user_nom" db:"user_nom"`
	UserPrenom   string     `json:"user_prenom" db:"user_prenom"`
	AvatarURL    *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	RSVPStatus   RSVPStatus `json:"rsvp_status" db:"rsvp_status"`
	RespondedAt  time.Time  `json:"responded_at" db:"responded_at"`
}

// DiscoveredEvent represents an event found by the AI discovery service
type DiscoveredEvent struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Date        string   `json:"date"`
	Location    string   `json:"location"`
	Price       *float64 `json:"price,omitempty"`
	URL         *string  `json:"url,omitempty"`
	Source      string   `json:"source"`
}

// DiscoverResult holds the result from the AI discovery service
type DiscoverResult struct {
	Events  []DiscoveredEvent `json:"events"`
	Summary string            `json:"summary"`
}

// EventDiscoverer defines the interface for AI-powered event discovery
type EventDiscoverer interface {
	DiscoverEvents(ctx context.Context, city, eventType string) (*DiscoverResult, error)
}

// EventRepository defines the interface for event persistence
type EventRepository interface {
	Create(ctx context.Context, event *Event) error
	GetByID(ctx context.Context, eventID, userID string) (*Event, error)
	ListByColocation(ctx context.Context, colocationID, userID string, status *string, startDate, endDate *time.Time, page, pageSize int) ([]Event, int, error)
	Update(ctx context.Context, event *Event) error
	Delete(ctx context.Context, eventID string) error
	UpdateStatus(ctx context.Context, eventID string, status EventStatus) error
	RSVP(ctx context.Context, eventID, userID string, status RSVPStatus) error
	GetParticipants(ctx context.Context, eventID string) ([]EventParticipant, error)
}

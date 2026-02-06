package service

import (
	"context"
	"fmt"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/auth"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/repository/postgres"
)

// EventService handles event business logic
type EventService struct {
	repo           *postgres.EventRepository
	colocationRepo domain.ColocationRepository
}

// NewEventService creates a new EventService
func NewEventService(repo *postgres.EventRepository, colocationRepo domain.ColocationRepository) *EventService {
	return &EventService{
		repo:           repo,
		colocationRepo: colocationRepo,
	}
}

// ensureMembership verifies user is a member and returns the userID
func (s *EventService) ensureMembership(ctx context.Context, colocationID string) (string, error) {
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		return "", err
	}

	isMember, err := s.colocationRepo.IsMember(ctx, colocationID, userID)
	if err != nil {
		return "", fmt.Errorf("erreur lors de la verification: %w", err)
	}
	if !isMember {
		return "", fmt.Errorf("vous n'etes pas membre de cette colocation")
	}

	return userID, nil
}

// Create creates a new event
func (s *EventService) Create(ctx context.Context, colocationID, title string, description *string, eventDate time.Time, location *string, budget *float64, fundID *string) (*domain.Event, error) {
	userID, err := s.ensureMembership(ctx, colocationID)
	if err != nil {
		return nil, err
	}

	if eventDate.Before(time.Now()) {
		return nil, fmt.Errorf("la date de l'evenement ne peut pas etre dans le passe")
	}

	event := &domain.Event{
		ColocationID: colocationID,
		CreatedBy:    userID,
		Title:        title,
		Description:  description,
		EventDate:    eventDate,
		Location:     location,
		Budget:       budget,
		FundID:       fundID,
		Status:       domain.EventStatusUpcoming,
	}

	if err := s.repo.Create(ctx, event); err != nil {
		return nil, fmt.Errorf("erreur lors de la creation: %w", err)
	}

	return s.repo.GetByID(ctx, event.ID, userID)
}

// GetByID retrieves an event by ID
func (s *EventService) GetByID(ctx context.Context, colocationID, eventID string) (*domain.Event, error) {
	userID, err := s.ensureMembership(ctx, colocationID)
	if err != nil {
		return nil, err
	}

	event, err := s.repo.GetByID(ctx, eventID, userID)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la recuperation: %w", err)
	}
	if event == nil || event.ColocationID != colocationID {
		return nil, fmt.Errorf("evenement introuvable")
	}

	return event, nil
}

// List lists events for a colocation
func (s *EventService) List(ctx context.Context, colocationID string, status *string, startDate, endDate *time.Time, page, pageSize int) ([]domain.Event, int, error) {
	userID, err := s.ensureMembership(ctx, colocationID)
	if err != nil {
		return nil, 0, err
	}

	page, pageSize = normalizePagination(page, pageSize)

	return s.repo.ListByColocation(ctx, colocationID, userID, status, startDate, endDate, page, pageSize)
}

// Update updates an event
func (s *EventService) Update(ctx context.Context, colocationID, eventID string, title *string, description *string, eventDate *time.Time, location *string, budget *float64, fundID *string, status *domain.EventStatus) (*domain.Event, error) {
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	event, err := s.repo.GetByID(ctx, eventID, userID)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la recuperation: %w", err)
	}
	if event == nil || event.ColocationID != colocationID {
		return nil, fmt.Errorf("evenement introuvable")
	}

	if event.CreatedBy != userID {
		return nil, fmt.Errorf("seul le createur peut modifier cet evenement")
	}

	if title != nil {
		event.Title = *title
	}
	if description != nil {
		event.Description = description
	}
	if eventDate != nil {
		if eventDate.Before(time.Now()) {
			return nil, fmt.Errorf("la date de l'evenement ne peut pas etre dans le passe")
		}
		event.EventDate = *eventDate
	}
	if location != nil {
		event.Location = location
	}
	if budget != nil {
		event.Budget = budget
	}
	if fundID != nil {
		event.FundID = fundID
	}
	if status != nil {
		event.Status = *status
	}

	if err := s.repo.Update(ctx, event); err != nil {
		return nil, fmt.Errorf("erreur lors de la mise a jour: %w", err)
	}

	return s.repo.GetByID(ctx, eventID, userID)
}

// Delete deletes an event
func (s *EventService) Delete(ctx context.Context, colocationID, eventID string) error {
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		return err
	}

	event, err := s.repo.GetByID(ctx, eventID, userID)
	if err != nil {
		return fmt.Errorf("erreur lors de la recuperation: %w", err)
	}
	if event == nil || event.ColocationID != colocationID {
		return fmt.Errorf("evenement introuvable")
	}

	if event.CreatedBy != userID {
		return fmt.Errorf("seul le createur peut supprimer cet evenement")
	}

	return s.repo.Delete(ctx, eventID)
}

// RSVP sets a user's RSVP status for an event
func (s *EventService) RSVP(ctx context.Context, colocationID, eventID string, status domain.RSVPStatus) error {
	userID, err := s.ensureMembership(ctx, colocationID)
	if err != nil {
		return err
	}

	event, err := s.repo.GetByID(ctx, eventID, userID)
	if err != nil {
		return fmt.Errorf("erreur lors de la recuperation: %w", err)
	}
	if event == nil || event.ColocationID != colocationID {
		return fmt.Errorf("evenement introuvable")
	}

	if event.Status == domain.EventStatusCancelled {
		return fmt.Errorf("impossible de repondre a un evenement annule")
	}

	return s.repo.RSVP(ctx, eventID, userID, status)
}

// GetParticipants retrieves all participants for an event
func (s *EventService) GetParticipants(ctx context.Context, colocationID, eventID string) ([]domain.EventParticipant, int, int, int, error) {
	userID, err := s.ensureMembership(ctx, colocationID)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	event, err := s.repo.GetByID(ctx, eventID, userID)
	if err != nil {
		return nil, 0, 0, 0, fmt.Errorf("erreur lors de la recuperation: %w", err)
	}
	if event == nil || event.ColocationID != colocationID {
		return nil, 0, 0, 0, fmt.Errorf("evenement introuvable")
	}

	participants, err := s.repo.GetParticipants(ctx, eventID)
	if err != nil {
		return nil, 0, 0, 0, fmt.Errorf("erreur lors de la recuperation des participants: %w", err)
	}

	// Count by status
	goingCount := 0
	maybeCount := 0
	notGoingCount := 0
	for _, p := range participants {
		switch p.RSVPStatus {
		case domain.RSVPStatusGoing:
			goingCount++
		case domain.RSVPStatusMaybe:
			maybeCount++
		case domain.RSVPStatusNotGoing:
			notGoingCount++
		}
	}

	return participants, goingCount, maybeCount, notGoingCount, nil
}

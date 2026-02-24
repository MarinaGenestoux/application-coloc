package service

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/application/constants"
	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

const (
	testEventID = "evt-001"
	testFundID  = "fund-001"
)

// --- MockEventRepository ---

type MockEventRepository struct {
	mock.Mock
}

func (m *MockEventRepository) Create(ctx context.Context, event *domain.Event) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockEventRepository) GetByID(ctx context.Context, eventID, userID string) (*domain.Event, error) {
	args := m.Called(ctx, eventID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Event), args.Error(1)
}

func (m *MockEventRepository) ListByColocation(ctx context.Context, colocationID, userID string, status *string, startDate, endDate *time.Time, page, pageSize int) ([]domain.Event, int, error) {
	args := m.Called(ctx, colocationID, userID, status, startDate, endDate, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]domain.Event), args.Int(1), args.Error(2)
}

func (m *MockEventRepository) Update(ctx context.Context, event *domain.Event) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockEventRepository) Delete(ctx context.Context, eventID string) error {
	args := m.Called(ctx, eventID)
	return args.Error(0)
}

func (m *MockEventRepository) UpdateStatus(ctx context.Context, eventID string, status domain.EventStatus) error {
	args := m.Called(ctx, eventID, status)
	return args.Error(0)
}

func (m *MockEventRepository) RSVP(ctx context.Context, eventID, userID string, status domain.RSVPStatus) error {
	args := m.Called(ctx, eventID, userID, status)
	return args.Error(0)
}

func (m *MockEventRepository) GetParticipants(ctx context.Context, eventID string) ([]domain.EventParticipant, error) {
	args := m.Called(ctx, eventID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.EventParticipant), args.Error(1)
}

// --- MockEventDiscoverer ---

type MockEventDiscoverer struct {
	mock.Mock
}

func (m *MockEventDiscoverer) DiscoverEvents(ctx context.Context, city, eventType string) (*domain.DiscoverResult, error) {
	args := m.Called(ctx, city, eventType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.DiscoverResult), args.Error(1)
}

// --- Helpers ---

func newEventMocks() (*MockEventRepository, *MockColocationRepository, *MockEventDiscoverer, *EventService) {
	eventRepo := new(MockEventRepository)
	colocRepo := new(MockColocationRepository)
	discoverer := new(MockEventDiscoverer)
	return eventRepo, colocRepo, discoverer, NewEventService(eventRepo, colocRepo, discoverer)
}

func sampleEvent() *domain.Event {
	return &domain.Event{
		ID:           testEventID,
		ColocationID: testColocationID,
		CreatedBy:    testUserID,
		Title:        "Soiree pizza",
		EventDate:    time.Now().Add(24 * time.Hour),
		Status:       domain.EventStatusUpcoming,
	}
}

// --- Tests: Create ---

func TestCreateEvent(t *testing.T) {
	t.Run("should_create_event", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		eventRepo.On("Create", ctx, mock.AnythingOfType("*domain.Event")).
			Return(nil).
			Run(func(args mock.Arguments) { args.Get(1).(*domain.Event).ID = testEventID })
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)

		result, err := svc.Create(ctx, testColocationID, "Soiree pizza", nil, time.Now().Add(24*time.Hour), nil, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, testEventID, result.ID)
		assert.Equal(t, "Soiree pizza", result.Title)
	})

	t.Run("should_reject_past_date", func(t *testing.T) {
		_, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)

		_, err := svc.Create(ctx, testColocationID, "Event", nil, time.Now().Add(-1*time.Hour), nil, nil, nil)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "dans le passe")
	})

	t.Run("should_reject_title_too_long", func(t *testing.T) {
		_, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)

		longTitle := string(make([]byte, constants.EventTitleMaxLength+1))
		_, err := svc.Create(ctx, testColocationID, longTitle, nil, time.Now().Add(24*time.Hour), nil, nil, nil)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "titre")
	})

	t.Run("should_reject_negative_budget", func(t *testing.T) {
		_, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)

		negativeBudget := -10.0
		_, err := svc.Create(ctx, testColocationID, "Event", nil, time.Now().Add(24*time.Hour), nil, &negativeBudget, nil)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "negatif")
	})

	t.Run("should_reject_non_member", func(t *testing.T) {
		_, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(false, nil)

		_, err := svc.Create(ctx, testColocationID, "Event", nil, time.Now().Add(24*time.Hour), nil, nil, nil)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "pas membre")
	})
}

// --- Tests: GetByID ---

func TestGetEventByID(t *testing.T) {
	t.Run("should_get_event", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)

		result, err := svc.GetByID(ctx, testColocationID, testEventID)

		require.NoError(t, err)
		assert.Equal(t, testEventID, result.ID)
	})

	t.Run("should_reject_wrong_colocation", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, "other-coloc", testUserID).Return(true, nil)
		event := sampleEvent()
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(event, nil)

		_, err := svc.GetByID(ctx, "other-coloc", testEventID)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "introuvable")
	})
}

// --- Tests: Update ---

func TestUpdateEvent(t *testing.T) {
	t.Run("should_update_title", func(t *testing.T) {
		eventRepo, _, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)
		eventRepo.On("Update", ctx, mock.AnythingOfType("*domain.Event")).Return(nil)

		updated := sampleEvent()
		updated.Title = "Nouveau titre"
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(updated, nil)

		newTitle := "Nouveau titre"
		result, err := svc.Update(ctx, testColocationID, testEventID, &newTitle, nil, nil, nil, nil, nil, nil)

		require.NoError(t, err)
		assert.Equal(t, "Nouveau titre", result.Title)
	})

	t.Run("should_reject_update_by_non_creator", func(t *testing.T) {
		eventRepo, _, _, svc := newEventMocks()
		otherUserCtx := testContextWithUserID("other-user")

		event := sampleEvent()
		eventRepo.On("GetByID", otherUserCtx, testEventID, "other-user").Return(event, nil)

		newTitle := "Hijack"
		_, err := svc.Update(otherUserCtx, testColocationID, testEventID, &newTitle, nil, nil, nil, nil, nil, nil)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "createur")
	})
}

// --- Tests: Delete ---

func TestDeleteEvent(t *testing.T) {
	t.Run("should_delete_event", func(t *testing.T) {
		eventRepo, _, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)
		eventRepo.On("Delete", ctx, testEventID).Return(nil)

		err := svc.Delete(ctx, testColocationID, testEventID)

		require.NoError(t, err)
		eventRepo.AssertCalled(t, "Delete", ctx, testEventID)
	})

	t.Run("should_reject_delete_by_non_creator", func(t *testing.T) {
		eventRepo, _, _, svc := newEventMocks()
		otherCtx := testContextWithUserID("other-user")

		eventRepo.On("GetByID", otherCtx, testEventID, "other-user").Return(sampleEvent(), nil)

		err := svc.Delete(otherCtx, testColocationID, testEventID)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "createur")
	})
}

// --- Tests: RSVP ---

func TestRSVP(t *testing.T) {
	t.Run("should_set_rsvp_going", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)
		eventRepo.On("RSVP", ctx, testEventID, testUserID, domain.RSVPStatusGoing).Return(nil)

		err := svc.RSVP(ctx, testColocationID, testEventID, domain.RSVPStatusGoing)

		require.NoError(t, err)
	})

	t.Run("should_reject_rsvp_on_cancelled_event", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		cancelled := sampleEvent()
		cancelled.Status = domain.EventStatusCancelled

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(cancelled, nil)

		err := svc.RSVP(ctx, testColocationID, testEventID, domain.RSVPStatusGoing)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "annule")
	})
}

// --- Tests: Discover ---

func TestDiscover(t *testing.T) {
	t.Run("should_discover_events", func(t *testing.T) {
		_, _, discoverer, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		expected := &domain.DiscoverResult{
			Events: []domain.DiscoveredEvent{
				{Title: "Concert Rock", Date: "2026-03-15", Location: "Rennes"},
			},
			Summary: "1 evenement trouve",
		}
		discoverer.On("DiscoverEvents", ctx, "Rennes", "concerts").Return(expected, nil)

		result, err := svc.Discover(ctx, "Rennes", "CONCERT")

		require.NoError(t, err)
		assert.Len(t, result.Events, 1)
		assert.Equal(t, "Concert Rock", result.Events[0].Title)
	})

	t.Run("should_reject_empty_city", func(t *testing.T) {
		_, _, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		_, err := svc.Discover(ctx, "", "CONCERT")

		require.Error(t, err)
		assert.Contains(t, err.Error(), "ville est obligatoire")
	})

	t.Run("should_reject_city_too_long", func(t *testing.T) {
		_, _, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		longCity := string(make([]byte, constants.EventCityMaxLength+1))
		_, err := svc.Discover(ctx, longCity, "CONCERT")

		require.Error(t, err)
		assert.Contains(t, err.Error(), "ville")
	})

	t.Run("should_use_default_label_for_unknown_type", func(t *testing.T) {
		_, _, discoverer, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		expected := &domain.DiscoverResult{Summary: "ok"}
		discoverer.On("DiscoverEvents", ctx, "Paris", "evenements").Return(expected, nil)

		result, err := svc.Discover(ctx, "Paris", "UNKNOWN_TYPE")

		require.NoError(t, err)
		assert.Equal(t, "ok", result.Summary)
	})

	t.Run("should_rate_limit_consecutive_calls", func(t *testing.T) {
		_, _, discoverer, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		expected := &domain.DiscoverResult{Summary: "ok"}
		discoverer.On("DiscoverEvents", ctx, "Lyon", "concerts").Return(expected, nil)

		// First call should succeed
		_, err := svc.Discover(ctx, "Lyon", "CONCERT")
		require.NoError(t, err)

		// Second call within cooldown should fail
		_, err = svc.Discover(ctx, "Lyon", "CONCERT")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "patienter")
	})

	t.Run("should_limit_max_concurrent_discoveries", func(t *testing.T) {
		_, _, discoverer, svc := newEventMocks()

		// Fill the semaphore
		for i := 0; i < constants.DiscoveryRateLimit; i++ {
			svc.discoverySem <- struct{}{}
		}

		ctx := testContextWithUserID(fmt.Sprintf("user-%d", 999))
		discoverer.On("DiscoverEvents", mock.Anything, mock.Anything, mock.Anything).
			Return(&domain.DiscoverResult{}, nil)

		_, err := svc.Discover(ctx, "Nantes", "CONCERT")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "trop de recherches")

		// Drain semaphore
		for i := 0; i < constants.DiscoveryRateLimit; i++ {
			<-svc.discoverySem
		}
	})
}

// --- Tests: GetParticipants ---

func TestGetParticipants(t *testing.T) {
	t.Run("should_count_by_status", func(t *testing.T) {
		eventRepo, colocRepo, _, svc := newEventMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		eventRepo.On("GetByID", ctx, testEventID, testUserID).Return(sampleEvent(), nil)
		eventRepo.On("GetParticipants", ctx, testEventID).Return([]domain.EventParticipant{
			{UserID: "u1", RSVPStatus: domain.RSVPStatusGoing},
			{UserID: "u2", RSVPStatus: domain.RSVPStatusGoing},
			{UserID: "u3", RSVPStatus: domain.RSVPStatusMaybe},
			{UserID: "u4", RSVPStatus: domain.RSVPStatusNotGoing},
		}, nil)

		participants, going, maybe, notGoing, err := svc.GetParticipants(ctx, testColocationID, testEventID)

		require.NoError(t, err)
		assert.Len(t, participants, 4)
		assert.Equal(t, 2, going)
		assert.Equal(t, 1, maybe)
		assert.Equal(t, 1, notGoing)
	})
}

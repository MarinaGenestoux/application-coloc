package handler

import (
	"context"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/application/constants"
	"github.com/MarinaGenestoux/application-coloc/internal/application/service"
	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/utils"
	pb "github.com/MarinaGenestoux/application-coloc/proto/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// EventHandler implements the EventService gRPC server
type EventHandler struct {
	pb.UnimplementedEventServiceServer
	service *service.EventService
}

// NewEventHandler creates a new EventHandler
func NewEventHandler(service *service.EventService) *EventHandler {
	return &EventHandler{service: service}
}

// CreateEvent creates a new event
func (h *EventHandler) CreateEvent(ctx context.Context, req *pb.CreateEventRequest) (*pb.Event, error) {
	if req.ColocationId == "" || req.Title == "" || req.EventDate == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id, title et event_date obligatoires")
	}

	eventDate, err := time.Parse("2006-01-02 15:04", req.EventDate)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "format event_date invalide (attendu: YYYY-MM-DD HH:MM)")
	}

	event, err := h.service.Create(ctx, req.ColocationId, req.Title, req.Description, eventDate, req.Location, req.Budget, req.FundId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	return eventToProto(event), nil
}

// GetEvent retrieves an event by ID
func (h *EventHandler) GetEvent(ctx context.Context, req *pb.GetEventRequest) (*pb.Event, error) {
	if req.ColocationId == "" || req.Id == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id et id obligatoires")
	}

	event, err := h.service.GetByID(ctx, req.ColocationId, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "%v", err)
	}

	return eventToProto(event), nil
}

// ListEvents lists events for a colocation
func (h *EventHandler) ListEvents(ctx context.Context, req *pb.ListEventsRequest) (*pb.ListEventsResponse, error) {
	if req.ColocationId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id obligatoire")
	}

	var statusFilter *string
	if req.Status != nil && *req.Status != pb.EventStatus_EVENT_STATUS_UNSPECIFIED {
		s := protoEventStatusToDomain(*req.Status)
		str := string(s)
		statusFilter = &str
	}

	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "format start_date invalide")
		}
		startDate = &t
	}
	if req.EndDate != nil && *req.EndDate != "" {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "format end_date invalide")
		}
		endDate = &t
	}

	page := int32(1)
	pageSize := int32(constants.DefaultPageSize)
	if req.Page != nil && *req.Page > 0 {
		page = *req.Page
	}
	if req.PageSize != nil && *req.PageSize > 0 {
		pageSize = *req.PageSize
	}

	events, totalCount, err := h.service.List(ctx, req.ColocationId, statusFilter, startDate, endDate, int(page), int(pageSize))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	var pbEvents []*pb.Event
	for _, e := range events {
		pbEvents = append(pbEvents, eventToProto(&e))
	}

	return &pb.ListEventsResponse{
		Events:     pbEvents,
		TotalCount: int32(totalCount),
		Page:       page,
		PageSize:   pageSize,
	}, nil
}

// UpdateEvent updates an event
func (h *EventHandler) UpdateEvent(ctx context.Context, req *pb.UpdateEventRequest) (*pb.Event, error) {
	if req.ColocationId == "" || req.Id == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id et id obligatoires")
	}

	var eventDate *time.Time
	if req.EventDate != nil && *req.EventDate != "" {
		t, err := time.Parse("2006-01-02 15:04", *req.EventDate)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "format event_date invalide")
		}
		eventDate = &t
	}

	var domainStatus *domain.EventStatus
	if req.Status != nil {
		s := protoEventStatusToDomain(*req.Status)
		domainStatus = &s
	}

	event, err := h.service.Update(ctx, req.ColocationId, req.Id, req.Title, req.Description, eventDate, req.Location, req.Budget, req.FundId, domainStatus)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	return eventToProto(event), nil
}

// DeleteEvent deletes an event
func (h *EventHandler) DeleteEvent(ctx context.Context, req *pb.DeleteEventRequest) (*pb.DeleteEventResponse, error) {
	if req.ColocationId == "" || req.Id == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id et id obligatoires")
	}

	if err := h.service.Delete(ctx, req.ColocationId, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	return &pb.DeleteEventResponse{Success: true}, nil
}

// RSVP sets RSVP status for an event
func (h *EventHandler) RSVP(ctx context.Context, req *pb.RSVPRequest) (*pb.RSVPResponse, error) {
	if req.ColocationId == "" || req.EventId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id et event_id obligatoires")
	}

	rsvpStatus := protoRSVPStatusToDomain(req.Status)
	if err := h.service.RSVP(ctx, req.ColocationId, req.EventId, rsvpStatus); err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	return &pb.RSVPResponse{Success: true}, nil
}

// GetParticipants retrieves participants for an event
func (h *EventHandler) GetParticipants(ctx context.Context, req *pb.GetParticipantsRequest) (*pb.GetParticipantsResponse, error) {
	if req.ColocationId == "" || req.EventId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "colocation_id et event_id obligatoires")
	}

	participants, goingCount, maybeCount, notGoingCount, err := h.service.GetParticipants(ctx, req.ColocationId, req.EventId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	var pbParticipants []*pb.EventParticipant
	for _, p := range participants {
		pbParticipants = append(pbParticipants, &pb.EventParticipant{
			UserId:      p.UserID,
			UserNom:     p.UserNom,
			UserPrenom:  p.UserPrenom,
			AvatarUrl:   p.AvatarURL,
			RsvpStatus:  domainRSVPStatusToProto(p.RSVPStatus),
			RespondedAt: utils.FormatFrenchDateTime(p.RespondedAt),
		})
	}

	return &pb.GetParticipantsResponse{
		Participants:   pbParticipants,
		GoingCount:     int32(goingCount),
		MaybeCount:     int32(maybeCount),
		NotGoingCount:  int32(notGoingCount),
	}, nil
}

// DiscoverEvents searches for real events using AI web search
func (h *EventHandler) DiscoverEvents(ctx context.Context, req *pb.DiscoverEventsRequest) (*pb.DiscoverEventsResponse, error) {
	if req.City == "" {
		return nil, status.Errorf(codes.InvalidArgument, "city est obligatoire")
	}
	if req.EventType == pb.DiscoverEventType_DISCOVER_EVENT_TYPE_UNSPECIFIED {
		return nil, status.Errorf(codes.InvalidArgument, "event_type est obligatoire")
	}

	eventTypeStr := protoDiscoverEventTypeToString(req.EventType)

	result, err := h.service.Discover(ctx, req.City, eventTypeStr)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "%v", err)
	}

	var pbEvents []*pb.DiscoveredEvent
	for _, e := range result.Events {
		pbEvent := &pb.DiscoveredEvent{
			Title:       e.Title,
			Description: e.Description,
			Date:        e.Date,
			Location:    e.Location,
			Price:       e.Price,
			Url:         e.URL,
			Source:      e.Source,
		}
		pbEvents = append(pbEvents, pbEvent)
	}

	return &pb.DiscoverEventsResponse{
		Events:        pbEvents,
		SearchSummary: result.Summary,
	}, nil
}

// Helper functions

func protoDiscoverEventTypeToString(t pb.DiscoverEventType) string {
	switch t {
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_CONCERT:
		return "CONCERT"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_EXPOSITION:
		return "EXPOSITION"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_FESTIVAL:
		return "FESTIVAL"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_SPORT:
		return "SPORT"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_THEATRE:
		return "THEATRE"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_GASTRONOMIE:
		return "GASTRONOMIE"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_MARCHE:
		return "MARCHE"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_CINEMA:
		return "CINEMA"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_CONFERENCE:
		return "CONFERENCE"
	case pb.DiscoverEventType_DISCOVER_EVENT_TYPE_SOIREE:
		return "SOIREE"
	default:
		return ""
	}
}

func eventToProto(e *domain.Event) *pb.Event {
	event := &pb.Event{
		Id:              e.ID,
		ColocationId:    e.ColocationID,
		CreatedBy:       e.CreatedBy,
		CreatedByNom:    e.CreatedByNom,
		CreatedByPrenom: e.CreatedByPrenom,
		Title:           e.Title,
		Description:     e.Description,
		EventDate:       e.EventDate.Format("2006-01-02 15:04"),
		Location:        e.Location,
		Budget:          e.Budget,
		FundId:          e.FundID,
		Status:          domainEventStatusToProto(e.Status),
		CreatedAt:       utils.FormatFrenchDateTime(e.CreatedAt),
		UserRsvp:        domainRSVPStatusToProto(e.UserRSVP),
		GoingCount:      int32(e.GoingCount),
		MaybeCount:      int32(e.MaybeCount),
		NotGoingCount:   int32(e.NotGoingCount),
	}
	return event
}

func domainEventStatusToProto(s domain.EventStatus) pb.EventStatus {
	switch s {
	case domain.EventStatusUpcoming:
		return pb.EventStatus_EVENT_STATUS_UPCOMING
	case domain.EventStatusOngoing:
		return pb.EventStatus_EVENT_STATUS_ONGOING
	case domain.EventStatusCompleted:
		return pb.EventStatus_EVENT_STATUS_COMPLETED
	case domain.EventStatusCancelled:
		return pb.EventStatus_EVENT_STATUS_CANCELLED
	default:
		return pb.EventStatus_EVENT_STATUS_UNSPECIFIED
	}
}

func protoEventStatusToDomain(s pb.EventStatus) domain.EventStatus {
	switch s {
	case pb.EventStatus_EVENT_STATUS_UPCOMING:
		return domain.EventStatusUpcoming
	case pb.EventStatus_EVENT_STATUS_ONGOING:
		return domain.EventStatusOngoing
	case pb.EventStatus_EVENT_STATUS_COMPLETED:
		return domain.EventStatusCompleted
	case pb.EventStatus_EVENT_STATUS_CANCELLED:
		return domain.EventStatusCancelled
	default:
		return domain.EventStatusUpcoming
	}
}

func domainRSVPStatusToProto(s domain.RSVPStatus) pb.RSVPStatus {
	switch s {
	case domain.RSVPStatusGoing:
		return pb.RSVPStatus_RSVP_STATUS_GOING
	case domain.RSVPStatusMaybe:
		return pb.RSVPStatus_RSVP_STATUS_MAYBE
	case domain.RSVPStatusNotGoing:
		return pb.RSVPStatus_RSVP_STATUS_NOT_GOING
	default:
		return pb.RSVPStatus_RSVP_STATUS_UNSPECIFIED
	}
}

func protoRSVPStatusToDomain(s pb.RSVPStatus) domain.RSVPStatus {
	switch s {
	case pb.RSVPStatus_RSVP_STATUS_GOING:
		return domain.RSVPStatusGoing
	case pb.RSVPStatus_RSVP_STATUS_MAYBE:
		return domain.RSVPStatusMaybe
	case pb.RSVPStatus_RSVP_STATUS_NOT_GOING:
		return domain.RSVPStatusNotGoing
	default:
		return domain.RSVPStatusGoing
	}
}

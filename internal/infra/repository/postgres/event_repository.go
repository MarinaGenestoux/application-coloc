package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EventRepository struct {
	pool *pgxpool.Pool
}

func NewEventRepository(pool *pgxpool.Pool) *EventRepository {
	return &EventRepository{pool: pool}
}

func (r *EventRepository) Create(ctx context.Context, event *domain.Event) error {
	query := `
		INSERT INTO events (id, colocation_id, created_by, title, description, event_date, location, budget, fund_id, status)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query,
		event.ColocationID, event.CreatedBy, event.Title, event.Description,
		event.EventDate, event.Location, event.Budget, event.FundID, event.Status,
	).Scan(&event.ID, &event.CreatedAt)
}

func (r *EventRepository) GetByID(ctx context.Context, eventID, userID string) (*domain.Event, error) {
	query := `
		SELECT
			e.id, e.colocation_id, e.created_by,
			u.nom as created_by_nom, u.prenom as created_by_prenom,
			e.title, e.description, e.event_date, e.location, e.budget,
			e.fund_id, e.status, e.created_at,
			COALESCE(er.rsvp_status, '') as user_rsvp,
			COUNT(CASE WHEN er2.rsvp_status = 'going' THEN 1 END)::int as going_count,
			COUNT(CASE WHEN er2.rsvp_status = 'maybe' THEN 1 END)::int as maybe_count,
			COUNT(CASE WHEN er2.rsvp_status = 'not_going' THEN 1 END)::int as not_going_count
		FROM events e
		INNER JOIN users u ON e.created_by = u.id
		LEFT JOIN event_rsvps er ON e.id = er.event_id AND er.user_id = $2
		LEFT JOIN event_rsvps er2 ON e.id = er2.event_id
		WHERE e.id = $1
		GROUP BY e.id, u.nom, u.prenom, er.rsvp_status
	`
	var event domain.Event
	var userRSVP string
	err := r.pool.QueryRow(ctx, query, eventID, userID).Scan(
		&event.ID, &event.ColocationID, &event.CreatedBy,
		&event.CreatedByNom, &event.CreatedByPrenom,
		&event.Title, &event.Description, &event.EventDate, &event.Location, &event.Budget,
		&event.FundID, &event.Status, &event.CreatedAt,
		&userRSVP, &event.GoingCount, &event.MaybeCount, &event.NotGoingCount,
	)
	if err != nil {
		return nil, err
	}
	if userRSVP != "" {
		event.UserRSVP = domain.RSVPStatus(userRSVP)
	}
	return &event, nil
}

func (r *EventRepository) ListByColocation(ctx context.Context, colocationID, userID string, status *string, startDate, endDate *time.Time, page, pageSize int) ([]domain.Event, int, error) {
	offset := (page - 1) * pageSize

	query := `
		SELECT
			e.id, e.colocation_id, e.created_by,
			u.nom as created_by_nom, u.prenom as created_by_prenom,
			e.title, e.description, e.event_date, e.location, e.budget,
			e.fund_id, e.status, e.created_at,
			COALESCE(er.rsvp_status, '') as user_rsvp,
			COUNT(CASE WHEN er2.rsvp_status = 'going' THEN 1 END)::int as going_count,
			COUNT(CASE WHEN er2.rsvp_status = 'maybe' THEN 1 END)::int as maybe_count,
			COUNT(CASE WHEN er2.rsvp_status = 'not_going' THEN 1 END)::int as not_going_count
		FROM events e
		INNER JOIN users u ON e.created_by = u.id
		LEFT JOIN event_rsvps er ON e.id = er.event_id AND er.user_id = $2
		LEFT JOIN event_rsvps er2 ON e.id = er2.event_id
		WHERE e.colocation_id = $1
	`
	args := []interface{}{colocationID, userID}
	argCount := 2

	if status != nil {
		argCount++
		query += fmt.Sprintf(" AND e.status = $%d", argCount)
		args = append(args, *status)
	}
	if startDate != nil {
		argCount++
		query += fmt.Sprintf(" AND e.event_date >= $%d", argCount)
		args = append(args, *startDate)
	}
	if endDate != nil {
		argCount++
		query += fmt.Sprintf(" AND e.event_date <= $%d", argCount)
		args = append(args, *endDate)
	}

	// Build count query with same filters (before adding GROUP BY / LIMIT)
	countQuery := "SELECT COUNT(*) FROM events e WHERE e.colocation_id = $1"
	countArgs := []interface{}{colocationID}
	countArgIdx := 1

	if status != nil {
		countArgIdx++
		countQuery += fmt.Sprintf(" AND e.status = $%d", countArgIdx)
		countArgs = append(countArgs, *status)
	}
	if startDate != nil {
		countArgIdx++
		countQuery += fmt.Sprintf(" AND e.event_date >= $%d", countArgIdx)
		countArgs = append(countArgs, *startDate)
	}
	if endDate != nil {
		countArgIdx++
		countQuery += fmt.Sprintf(" AND e.event_date <= $%d", countArgIdx)
		countArgs = append(countArgs, *endDate)
	}

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query += " GROUP BY e.id, u.nom, u.prenom, er.rsvp_status ORDER BY e.event_date ASC"

	argCount++
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []domain.Event
	for rows.Next() {
		var event domain.Event
		var userRSVP string
		err := rows.Scan(
			&event.ID, &event.ColocationID, &event.CreatedBy,
			&event.CreatedByNom, &event.CreatedByPrenom,
			&event.Title, &event.Description, &event.EventDate, &event.Location, &event.Budget,
			&event.FundID, &event.Status, &event.CreatedAt,
			&userRSVP, &event.GoingCount, &event.MaybeCount, &event.NotGoingCount,
		)
		if err != nil {
			return nil, 0, err
		}
		if userRSVP != "" {
			event.UserRSVP = domain.RSVPStatus(userRSVP)
		}
		events = append(events, event)
	}

	return events, total, nil
}

func (r *EventRepository) Update(ctx context.Context, event *domain.Event) error {
	query := `
		UPDATE events
		SET title = $1, description = $2, event_date = $3, location = $4, budget = $5, fund_id = $6, status = $7
		WHERE id = $8
	`
	_, err := r.pool.Exec(ctx, query,
		event.Title, event.Description, event.EventDate, event.Location, event.Budget, event.FundID, event.Status, event.ID,
	)
	return err
}

func (r *EventRepository) Delete(ctx context.Context, eventID string) error {
	query := "DELETE FROM events WHERE id = $1"
	_, err := r.pool.Exec(ctx, query, eventID)
	return err
}

func (r *EventRepository) UpdateStatus(ctx context.Context, eventID string, status domain.EventStatus) error {
	query := "UPDATE events SET status = $1 WHERE id = $2"
	_, err := r.pool.Exec(ctx, query, status, eventID)
	return err
}

func (r *EventRepository) RSVP(ctx context.Context, eventID, userID string, status domain.RSVPStatus) error {
	query := `
		INSERT INTO event_rsvps (event_id, user_id, rsvp_status, responded_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (event_id, user_id)
		DO UPDATE SET rsvp_status = $3, responded_at = NOW()
	`
	_, err := r.pool.Exec(ctx, query, eventID, userID, status)
	return err
}

func (r *EventRepository) GetParticipants(ctx context.Context, eventID string) ([]domain.EventParticipant, error) {
	query := `
		SELECT u.id, u.nom, u.prenom, u.avatar_url, er.rsvp_status, er.responded_at
		FROM event_rsvps er
		INNER JOIN users u ON er.user_id = u.id
		WHERE er.event_id = $1
		ORDER BY er.responded_at DESC
	`
	rows, err := r.pool.Query(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []domain.EventParticipant
	for rows.Next() {
		var p domain.EventParticipant
		err := rows.Scan(&p.UserID, &p.UserNom, &p.UserPrenom, &p.AvatarURL, &p.RSVPStatus, &p.RespondedAt)
		if err != nil {
			return nil, err
		}
		participants = append(participants, p)
	}

	return participants, nil
}

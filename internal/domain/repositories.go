package domain

import (
	"context"
	"time"
)

// AuthRepository defines the contract for authentication data access.
type AuthRepository interface {
	EmailExists(ctx context.Context, email string) (bool, error)
	CreateUser(ctx context.Context, user *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id string) (*User, error)
	SaveRefreshToken(ctx context.Context, userID, token string, expiresAt time.Time) error
	GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error)
	DeleteRefreshToken(ctx context.Context, token string) error
	DeleteUserRefreshTokens(ctx context.Context, userID string) error
	UpdateUser(ctx context.Context, user *User) error
	DeactivateUser(ctx context.Context, userID string) error
}

// ExpenseRepository defines the contract for expense data access.
type ExpenseRepository interface {
	Create(ctx context.Context, expense *Expense, splits []ExpenseSplitInput) error
	GetByID(ctx context.Context, id string) (*Expense, error)
	ListByColocation(ctx context.Context, colocationID string, categoryID, paidBy *string, startDate, endDate *time.Time, page, pageSize int) ([]Expense, int, error)
	Update(ctx context.Context, expense *Expense, splits []ExpenseSplitInput) error
	Delete(ctx context.Context, id string) error
	CreateRecurring(ctx context.Context, recurring *RecurringExpense, splits []ExpenseSplitInput) error
	GetRecurringByID(ctx context.Context, id string) (*RecurringExpense, error)
	ListRecurringByColocation(ctx context.Context, colocationID string) ([]RecurringExpense, error)
	UpdateRecurring(ctx context.Context, recurring *RecurringExpense, splits []ExpenseSplitInput) error
	DeleteRecurring(ctx context.Context, id string) error
	GetActiveRecurringDue(ctx context.Context, dueDate time.Time) ([]RecurringExpense, error)
	CreateFromRecurring(ctx context.Context, recurring *RecurringExpense) (*Expense, error)
	UpdateNextDueDate(ctx context.Context, id string, nextDueDate time.Time) error
	GetForecastData(ctx context.Context, colocationID string, months int) ([]MonthlyForecast, error)
}

// ColocationRepository defines the contract for colocation membership checks.
type ColocationRepository interface {
	IsMember(ctx context.Context, colocationID, userID string) (bool, error)
	ListMembers(ctx context.Context, colocationID string) ([]ColocationMember, error)
}

// CategoryRepository defines the contract for category validation.
type CategoryRepository interface {
	BelongsToColocation(ctx context.Context, categoryID, colocationID string) (bool, error)
}

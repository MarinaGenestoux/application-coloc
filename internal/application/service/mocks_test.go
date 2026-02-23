package service

import (
	"context"
	"time"

	"github.com/stretchr/testify/mock"
	"github.com/MarinaGenestoux/application-coloc/internal/domain"
)

// --- MockAuthRepository ---

type MockAuthRepository struct {
	mock.Mock
}

func (m *MockAuthRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	args := m.Called(ctx, email)
	return args.Bool(0), args.Error(1)
}

func (m *MockAuthRepository) CreateUser(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockAuthRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockAuthRepository) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockAuthRepository) SaveRefreshToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	args := m.Called(ctx, userID, token, expiresAt)
	return args.Error(0)
}

func (m *MockAuthRepository) GetRefreshToken(ctx context.Context, token string) (*domain.RefreshToken, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.RefreshToken), args.Error(1)
}

func (m *MockAuthRepository) DeleteRefreshToken(ctx context.Context, token string) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *MockAuthRepository) DeleteUserRefreshTokens(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockAuthRepository) DeactivateUser(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

// --- MockTokenManager ---

type MockTokenManager struct {
	mock.Mock
}

func (m *MockTokenManager) GenerateAccessToken(userID, email string) (string, error) {
	args := m.Called(userID, email)
	return args.String(0), args.Error(1)
}

func (m *MockTokenManager) GenerateRefreshToken() (string, error) {
	args := m.Called()
	return args.String(0), args.Error(1)
}

func (m *MockTokenManager) AccessTokenExpiry() int64 {
	args := m.Called()
	return args.Get(0).(int64)
}

func (m *MockTokenManager) RefreshTokenExpiry() time.Duration {
	args := m.Called()
	return args.Get(0).(time.Duration)
}

// --- MockPasswordHasher ---

type MockPasswordHasher struct {
	mock.Mock
}

func (m *MockPasswordHasher) HashPassword(password string) (string, error) {
	args := m.Called(password)
	return args.String(0), args.Error(1)
}

func (m *MockPasswordHasher) CheckPassword(password, hash string) bool {
	args := m.Called(password, hash)
	return args.Bool(0)
}

// --- MockExpenseRepository ---

type MockExpenseRepository struct {
	mock.Mock
}

func (m *MockExpenseRepository) Create(ctx context.Context, expense *domain.Expense, splits []domain.ExpenseSplitInput) error {
	args := m.Called(ctx, expense, splits)
	return args.Error(0)
}

func (m *MockExpenseRepository) GetByID(ctx context.Context, id string) (*domain.Expense, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Expense), args.Error(1)
}

func (m *MockExpenseRepository) ListByColocation(ctx context.Context, colocationID string, categoryID, paidBy *string, startDate, endDate *time.Time, page, pageSize int) ([]domain.Expense, int, float64, error) {
	args := m.Called(ctx, colocationID, categoryID, paidBy, startDate, endDate, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Get(2).(float64), args.Error(3)
	}
	return args.Get(0).([]domain.Expense), args.Int(1), args.Get(2).(float64), args.Error(3)
}

func (m *MockExpenseRepository) Update(ctx context.Context, expense *domain.Expense, splits []domain.ExpenseSplitInput) error {
	args := m.Called(ctx, expense, splits)
	return args.Error(0)
}

func (m *MockExpenseRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockExpenseRepository) CreateRecurring(ctx context.Context, recurring *domain.RecurringExpense, splits []domain.ExpenseSplitInput) error {
	args := m.Called(ctx, recurring, splits)
	return args.Error(0)
}

func (m *MockExpenseRepository) GetRecurringByID(ctx context.Context, id string) (*domain.RecurringExpense, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.RecurringExpense), args.Error(1)
}

func (m *MockExpenseRepository) ListRecurringByColocation(ctx context.Context, colocationID string) ([]domain.RecurringExpense, error) {
	args := m.Called(ctx, colocationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.RecurringExpense), args.Error(1)
}

func (m *MockExpenseRepository) UpdateRecurring(ctx context.Context, recurring *domain.RecurringExpense, splits []domain.ExpenseSplitInput) error {
	args := m.Called(ctx, recurring, splits)
	return args.Error(0)
}

func (m *MockExpenseRepository) DeleteRecurring(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockExpenseRepository) GetActiveRecurringDue(ctx context.Context, dueDate time.Time) ([]domain.RecurringExpense, error) {
	args := m.Called(ctx, dueDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.RecurringExpense), args.Error(1)
}

func (m *MockExpenseRepository) CreateFromRecurring(ctx context.Context, recurring *domain.RecurringExpense) (*domain.Expense, error) {
	args := m.Called(ctx, recurring)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Expense), args.Error(1)
}

func (m *MockExpenseRepository) UpdateNextDueDate(ctx context.Context, id string, nextDueDate time.Time) error {
	args := m.Called(ctx, id, nextDueDate)
	return args.Error(0)
}

func (m *MockExpenseRepository) GetForecastData(ctx context.Context, colocationID string, months int) ([]domain.MonthlyForecast, error) {
	args := m.Called(ctx, colocationID, months)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.MonthlyForecast), args.Error(1)
}

// --- MockColocationRepository ---

type MockColocationRepository struct {
	mock.Mock
}

func (m *MockColocationRepository) IsMember(ctx context.Context, colocationID, userID string) (bool, error) {
	args := m.Called(ctx, colocationID, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockColocationRepository) ListMembers(ctx context.Context, colocationID string) ([]domain.ColocationMember, error) {
	args := m.Called(ctx, colocationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.ColocationMember), args.Error(1)
}

// --- MockCategoryRepository ---

type MockCategoryRepository struct {
	mock.Mock
}

func (m *MockCategoryRepository) BelongsToColocation(ctx context.Context, categoryID, colocationID string) (bool, error) {
	args := m.Called(ctx, categoryID, colocationID)
	return args.Bool(0), args.Error(1)
}

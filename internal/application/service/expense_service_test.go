package service

import (
	"context"
	"testing"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/auth"
	"github.com/MarinaGenestoux/application-coloc/internal/infra/cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

const (
	testUserID       = "user-123"
	testColocationID = "coloc-456"
	testCategoryID   = "cat-789"
	testExpenseID    = "exp-001"
)

func testContextWithUserID(userID string) context.Context {
	return context.WithValue(context.Background(), auth.UserIDKey, userID)
}

func newExpenseMocks() (*MockExpenseRepository, *MockColocationRepository, *MockCategoryRepository, *ExpenseService) {
	expRepo := new(MockExpenseRepository)
	colocRepo := new(MockColocationRepository)
	catRepo := new(MockCategoryRepository)
	return expRepo, colocRepo, catRepo, NewExpenseService(expRepo, colocRepo, catRepo, cache.NewBalanceCache(time.Minute))
}

func sampleExpense() *domain.Expense {
	return &domain.Expense{
		ID:           testExpenseID,
		ColocationID: testColocationID,
		PaidBy:       testUserID,
		CategoryID:   testCategoryID,
		Title:        "Courses",
		Amount:       100.0,
		SplitType:    domain.SplitTypeEqual,
		ExpenseDate:  time.Now(),
	}
}

// Creer une depense

func TestCreateExpense(t *testing.T) {
	t.Run("should_create_expense", func(t *testing.T) {
		expRepo, colocRepo, catRepo, svc := newExpenseMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		catRepo.On("BelongsToColocation", ctx, testCategoryID, testColocationID).Return(true, nil)
		colocRepo.On("ListMembers", ctx, testColocationID).Return([]domain.ColocationMember{
			{UserID: "user-123"}, {UserID: "user-456"},
		}, nil)
		expRepo.On("Create", ctx, mock.AnythingOfType("*domain.Expense"), mock.AnythingOfType("[]domain.ExpenseSplitInput")).
			Return(nil).
			Run(func(args mock.Arguments) { args.Get(1).(*domain.Expense).ID = testExpenseID })
		expRepo.On("GetByID", ctx, testExpenseID).Return(sampleExpense(), nil)

		result, err := svc.Create(ctx, CreateExpenseInput{
			ColocationID: testColocationID,
			Title:        "Courses",
			Amount:       100.0,
			CategoryID:   testCategoryID,
			SplitType:    domain.SplitTypeEqual,
			ExpenseDate:  time.Now(),
		})

		require.NoError(t, err)
		assert.Equal(t, testExpenseID, result.ID)
		assert.Equal(t, 100.0, result.Amount)
	})

	t.Run("should_create_payer_only_expense_without_splits", func(t *testing.T) {
		expRepo, colocRepo, catRepo, svc := newExpenseMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		catRepo.On("BelongsToColocation", ctx, testCategoryID, testColocationID).Return(true, nil)
		colocRepo.On("ListMembers", ctx, testColocationID).Return([]domain.ColocationMember{
			{UserID: testUserID},
		}, nil)

		expRepo.On("Create", ctx, mock.AnythingOfType("*domain.Expense"), mock.AnythingOfType("[]domain.ExpenseSplitInput")).
			Return(nil).
			Run(func(args mock.Arguments) {
				splits := args.Get(2).([]domain.ExpenseSplitInput)
				assert.Len(t, splits, 0)
				args.Get(1).(*domain.Expense).ID = testExpenseID
			})

		personalExpense := sampleExpense()
		personalExpense.ID = testExpenseID
		personalExpense.SplitType = domain.SplitTypePayerOnly
		expRepo.On("GetByID", ctx, testExpenseID).Return(personalExpense, nil)

		result, err := svc.Create(ctx, CreateExpenseInput{
			ColocationID: testColocationID,
			Title:        "Remboursement",
			Amount:       90.0,
			CategoryID:   testCategoryID,
			SplitType:    domain.SplitTypePayerOnly,
			ExpenseDate:  time.Now(),
		})

		require.NoError(t, err)
		assert.Equal(t, domain.SplitTypePayerOnly, result.SplitType)
	})
}

// Modifier une depense

func TestUpdateExpense(t *testing.T) {
	t.Run("should_update_expense", func(t *testing.T) {
		expRepo, colocRepo, _, svc := newExpenseMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		colocRepo.On("ListMembers", ctx, testColocationID).Return([]domain.ColocationMember{
			{UserID: "user-123"}, {UserID: "user-456"},
		}, nil)

		newTitle := "Courses modifiees"
		expRepo.On("GetByID", ctx, testExpenseID).Return(sampleExpense(), nil).Once()
		expRepo.On("Update", ctx, mock.AnythingOfType("*domain.Expense"), mock.AnythingOfType("[]domain.ExpenseSplitInput")).Return(nil)
		updated := sampleExpense()
		updated.Title = newTitle
		expRepo.On("GetByID", ctx, testExpenseID).Return(updated, nil).Once()

		result, err := svc.Update(ctx, UpdateExpenseInput{
			ColocationID: testColocationID,
			ExpenseID:    testExpenseID,
			Title:        &newTitle,
		})

		require.NoError(t, err)
		assert.Equal(t, "Courses modifiees", result.Title)
	})
}

// Supprimer une depense

func TestDeleteExpense(t *testing.T) {
	t.Run("should_delete_expense", func(t *testing.T) {
		expRepo, colocRepo, _, svc := newExpenseMocks()
		ctx := testContextWithUserID(testUserID)

		colocRepo.On("IsMember", ctx, testColocationID, testUserID).Return(true, nil)
		expRepo.On("GetByID", ctx, testExpenseID).Return(sampleExpense(), nil)
		expRepo.On("Delete", ctx, testExpenseID).Return(nil)

		err := svc.Delete(ctx, testColocationID, testExpenseID)

		assert.NoError(t, err)
		expRepo.AssertCalled(t, "Delete", ctx, testExpenseID)
	})
}

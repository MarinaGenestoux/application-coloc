package service

import (
	"context"
	"testing"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func newAuthMocks() (*MockAuthRepository, *MockTokenManager, *MockPasswordHasher, *AuthService) {
	repo := new(MockAuthRepository)
	tm := new(MockTokenManager)
	hasher := new(MockPasswordHasher)
	return repo, tm, hasher, NewAuthService(repo, tm, hasher)
}

func mockTokenGeneration(repo *MockAuthRepository, tm *MockTokenManager, userID, email string) {
	tm.On("GenerateAccessToken", userID, email).Return("access-token", nil)
	tm.On("GenerateRefreshToken").Return("refresh-token", nil)
	tm.On("RefreshTokenExpiry").Return(168 * time.Hour)
	tm.On("AccessTokenExpiry").Return(int64(86400))
	repo.On("SaveRefreshToken", mock.Anything, userID, "refresh-token", mock.AnythingOfType("time.Time")).Return(nil)
}

// Inscription

func TestRegister(t *testing.T) {
	t.Run("should_register_user_and_return_tokens", func(t *testing.T) {
		repo, tm, hasher, svc := newAuthMocks()
		ctx := context.Background()

		repo.On("EmailExists", ctx, "jean@test.com").Return(false, nil)
		hasher.On("HashPassword", "password123").Return("hashed", nil)
		repo.On("CreateUser", ctx, mock.AnythingOfType("*domain.User")).Return(nil).
			Run(func(args mock.Arguments) {
				args.Get(1).(*domain.User).ID = "user-1"
			})
		mockTokenGeneration(repo, tm, "user-1", "jean@test.com")

		result, err := svc.Register(ctx, "jean@test.com", "password123", "Dupont", "Jean", nil)

		require.NoError(t, err)
		assert.Equal(t, "access-token", result.AccessToken)
		assert.Equal(t, "jean@test.com", result.User.Email)
	})
}

// Connexion

func TestLogin(t *testing.T) {
	t.Run("should_login_and_return_tokens", func(t *testing.T) {
		repo, tm, hasher, svc := newAuthMocks()
		ctx := context.Background()
		hash := "hashed-pw"

		repo.On("GetUserByEmail", ctx, "jean@test.com").Return(&domain.User{
			ID: "user-1", Email: "jean@test.com", PasswordHash: &hash,
		}, nil)
		hasher.On("CheckPassword", "password123", "hashed-pw").Return(true)
		mockTokenGeneration(repo, tm, "user-1", "jean@test.com")

		result, err := svc.Login(ctx, "jean@test.com", "password123")

		require.NoError(t, err)
		assert.Equal(t, "access-token", result.AccessToken)
		assert.Equal(t, "jean@test.com", result.User.Email)
	})
}

// Deconnexion

func TestLogout(t *testing.T) {
	t.Run("should_delete_refresh_token", func(t *testing.T) {
		repo, _, _, svc := newAuthMocks()
		ctx := context.Background()

		repo.On("DeleteRefreshToken", ctx, "my-refresh-token").Return(nil)

		err := svc.Logout(ctx, "my-refresh-token")

		assert.NoError(t, err)
		repo.AssertCalled(t, "DeleteRefreshToken", ctx, "my-refresh-token")
	})
}

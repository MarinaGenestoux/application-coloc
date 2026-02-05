package domain

import "time"

// TokenManager defines the contract for JWT token operations.
type TokenManager interface {
	GenerateAccessToken(userID, email string) (string, error)
	GenerateRefreshToken() (string, error)
	AccessTokenExpiry() int64
	RefreshTokenExpiry() time.Duration
}

// PasswordHasher defines the contract for password hashing operations.
type PasswordHasher interface {
	HashPassword(password string) (string, error)
	CheckPassword(password, hash string) bool
}

package auth

// BcryptPasswordHasher implements domain.PasswordHasher using bcrypt.
type BcryptPasswordHasher struct{}

// NewBcryptPasswordHasher creates a new BcryptPasswordHasher.
func NewBcryptPasswordHasher() *BcryptPasswordHasher {
	return &BcryptPasswordHasher{}
}

// HashPassword hashes a password using bcrypt.
func (h *BcryptPasswordHasher) HashPassword(password string) (string, error) {
	return HashPassword(password)
}

// CheckPassword compares a password with a bcrypt hash.
func (h *BcryptPasswordHasher) CheckPassword(password, hash string) bool {
	return CheckPassword(password, hash)
}

package cache

import (
	"sync"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
)

// BalanceCache cache simple en memoire pour les soldes
// Evite de recalculer les soldes a chaque requete
type BalanceCache struct {
	mu    sync.RWMutex
	data  map[string]cacheEntry
	ttl   time.Duration
}

type cacheEntry struct {
	balances  []domain.UserBalance
	expiresAt time.Time
}

// NewBalanceCache cree un nouveau cache avec une duree de vie (TTL)
func NewBalanceCache(ttl time.Duration) *BalanceCache {
	return &BalanceCache{
		data: make(map[string]cacheEntry),
		ttl:  ttl,
	}
}

// Get recupere les soldes en cache pour une colocation
func (c *BalanceCache) Get(colocationID string) ([]domain.UserBalance, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.data[colocationID]
	if !exists || time.Now().After(entry.expiresAt) {
		return nil, false
	}

	return entry.balances, true
}

// Set met en cache les soldes d'une colocation
func (c *BalanceCache) Set(colocationID string, balances []domain.UserBalance) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[colocationID] = cacheEntry{
		balances:  balances,
		expiresAt: time.Now().Add(c.ttl),
	}
}

// Invalidate supprime le cache pour une colocation
// A appeler lors de creation/modification/suppression de depense
func (c *BalanceCache) Invalidate(colocationID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, colocationID)
}

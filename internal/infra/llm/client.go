package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/MarinaGenestoux/application-coloc/internal/domain"
)

// cliTimeout limits how long we wait for the Claude CLI to respond
const cliTimeout = 2 * time.Minute

// Client runs Claude CLI for event discovery.
// Implements domain.EventDiscoverer.
type Client struct{}

// NewClient creates a new LLM client
func NewClient() *Client {
	return &Client{}
}

// cliResponse represents the JSON output from claude CLI --output-format json
type cliResponse struct {
	Type    string `json:"type"`
	Subtype string `json:"subtype"`
	Result  string `json:"result"`
	IsError bool   `json:"is_error"`
}

// DiscoverEvents searches for real events using Claude CLI with web search
func (c *Client) DiscoverEvents(ctx context.Context, city, eventType string) (*domain.DiscoverResult, error) {
	prompt := fmt.Sprintf(
		`Utilise l'outil WebSearch pour chercher "%s a %s" puis l'outil WebFetch sur les resultats pertinents pour trouver des evenements reels a venir.

IMPORTANT : Ta reponse finale doit etre UNIQUEMENT du JSON valide, rien d'autre. Pas de texte explicatif, pas de markdown. Juste le JSON brut suivant :

{"events":[{"title":"Nom","description":"Description courte","date":"YYYY-MM-DD","location":"Lieu, adresse","price":25.00,"url":"https://...","source":"Site source"}],"summary":"Resume des resultats"}

Regles : 3-8 evenements futurs, price=null si inconnu, url=null si indisponible.`,
		eventType, city,
	)

	cmdCtx, cancel := context.WithTimeout(context.Background(), cliTimeout)
	defer cancel()

	log.Printf("[LLM] Recherche: %s a %s", eventType, city)

	cmd := exec.CommandContext(cmdCtx, "claude", "-p", "--output-format", "json", "--allowedTools", "WebSearch,WebFetch")
	cmd.Stdin = strings.NewReader(prompt)
	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("erreur claude CLI (code %d): %s", exitErr.ExitCode(), string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("erreur execution claude CLI: %w", err)
	}

	var resp cliResponse
	if err := json.Unmarshal(output, &resp); err != nil {
		return parseRawText(string(output))
	}

	if resp.IsError {
		return nil, fmt.Errorf("erreur Claude: %s", resp.Result)
	}

	return parseRawText(resp.Result)
}

// parseRawText extracts structured events from Claude's text response
func parseRawText(text string) (*domain.DiscoverResult, error) {
	if text == "" {
		return nil, fmt.Errorf("reponse vide de Claude")
	}

	jsonStr := extractJSON(text)

	var result domain.DiscoverResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return &domain.DiscoverResult{
			Events:  nil,
			Summary: text,
		}, nil
	}

	return &result, nil
}

// extractJSON extracts JSON from text that may contain markdown code blocks
func extractJSON(text string) string {
	if start := strings.Index(text, "```json"); start != -1 {
		jsonStart := start + len("```json")
		if end := strings.Index(text[jsonStart:], "```"); end != -1 {
			return strings.TrimSpace(text[jsonStart : jsonStart+end])
		}
	}

	if start := strings.Index(text, "```"); start != -1 {
		codeStart := start + len("```")
		if end := strings.Index(text[codeStart:], "```"); end != -1 {
			candidate := strings.TrimSpace(text[codeStart : codeStart+end])
			if strings.HasPrefix(candidate, "{") {
				return candidate
			}
		}
	}

	if start := strings.Index(text, "{"); start != -1 {
		if end := strings.LastIndex(text, "}"); end > start {
			return text[start : end+1]
		}
	}

	return text
}

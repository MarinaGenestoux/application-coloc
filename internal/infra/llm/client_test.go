package llm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExtractJSON(t *testing.T) {
	t.Run("should_extract_from_json_code_block", func(t *testing.T) {
		input := "Here is the result:\n```json\n{\"events\":[]}\n```\nDone."
		result := extractJSON(input)
		assert.Equal(t, `{"events":[]}`, result)
	})

	t.Run("should_extract_from_generic_code_block", func(t *testing.T) {
		input := "Result:\n```\n{\"events\":[]}\n```"
		result := extractJSON(input)
		assert.Equal(t, `{"events":[]}`, result)
	})

	t.Run("should_extract_raw_json", func(t *testing.T) {
		input := `Some text {"events":[]} more text`
		result := extractJSON(input)
		assert.Equal(t, `{"events":[]}`, result)
	})

	t.Run("should_return_text_if_no_json", func(t *testing.T) {
		input := "No JSON here"
		result := extractJSON(input)
		assert.Equal(t, "No JSON here", result)
	})

	t.Run("should_handle_nested_json", func(t *testing.T) {
		input := `{"events":[{"title":"Test","nested":{"key":"val"}}],"summary":"ok"}`
		result := extractJSON(input)
		assert.Equal(t, input, result)
	})

	t.Run("should_ignore_non_json_code_block", func(t *testing.T) {
		input := "```\nnot json\n```\n{\"real\":true}"
		result := extractJSON(input)
		// Falls through to raw JSON extraction
		assert.Contains(t, result, `"real"`)
	})
}

# Refined Prompt of the Day and History Logic

## Overview
The refined system ensures that:
1. **Prompt of the day is always the latest record in history**
2. **Updating today's prompt also updates the latest history record**
3. **New daily prompts are inserted into history chronologically**

## Key Components

### 1. PromptSelector
- `selectDailyPrompt()`: Selects a new daily prompt and adds it to history
- `updateTodayPrompt(promptId)`: Updates today's prompt and refreshes the latest history record
- `getTodayPrompt()`: Gets today's prompt (creates one if doesn't exist)

### 2. DataManager
- `addToHistory(selection)`: Adds/updates history entry, maintaining chronological order
- `updateTodayInHistory(selection)`: Specifically updates today's entry as the latest record
- `loadHistory()`: Loads history sorted by date
- `saveHistory()`: Saves history to JSON file

### 3. API Endpoints

#### GET `/api/prompt/today`
- Returns today's selected prompt
- Creates a new selection if none exists for today

#### PUT `/api/prompt/today`
- Updates today's prompt with a new promptId
- Request body: `{ "promptId": "new-prompt-id" }`
- Updates the latest history record

#### POST `/api/prompt/select`
- Manually triggers daily prompt selection
- Useful for testing or manual prompt generation

#### GET `/api/prompts/history`
- Returns paginated history of daily selections
- Sorted by date descending (latest first)
- Query params: `page`, `limit`

## History Management Logic

### When a New Day Starts:
1. System checks if today has a selection
2. If not, `selectDailyPrompt()` is called
3. New selection is added to history chronologically
4. History maintains chronological order by date

### When Today's Prompt is Updated:
1. `updateTodayPrompt(promptId)` is called
2. System finds today's entry in history
3. Removes old today's entry
4. Adds updated entry, maintaining chronological order
5. Today's updated entry becomes the latest record

### Data Structure:
```typescript
interface DailySelection {
  date: string; // YYYY-MM-DD (China timezone)
  promptId: string;
  selectedAt: string; // ISO timestamp of selection/update
}
```

## Benefits of Refined Logic:
1. **Consistency**: Today's prompt is always the latest in history
2. **Flexibility**: Easy to update today's prompt without disrupting history
3. **Chronology**: History maintains proper date ordering
4. **Traceability**: Each selection/update is timestamped
5. **API Support**: Full CRUD operations for daily prompts

## Usage Examples:

### Get Today's Prompt:
```bash
curl -X GET http://localhost:3000/api/prompt/today
```

### Update Today's Prompt:
```bash
curl -X PUT http://localhost:3000/api/prompt/today \
  -H "Content-Type: application/json" \
  -d '{"promptId": "new-prompt-id"}'
```

### Manual Prompt Selection:
```bash
curl -X POST http://localhost:3000/api/prompt/select
```

### Get History:
```bash
curl -X GET "http://localhost:3000/api/prompts/history?page=1&limit=10"
```

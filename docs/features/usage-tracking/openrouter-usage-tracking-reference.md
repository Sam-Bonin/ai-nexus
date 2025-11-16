# OpenRouter Usage Tracking - Technical Reference

## Overview

This document outlines OpenRouter's API capabilities for tracking usage and costs, including both native analytics endpoints and approaches for local usage tracking.

## Authentication

OpenRouter uses two types of API keys:

1. **Inference API Key** - For making chat completion requests
2. **Provisioning API Key** - For accessing analytics and administrative endpoints

Most usage tracking can be accomplished with just an Inference API Key.

---

## Option 1: Per-Request Usage Data

### Retrieving Usage Information

OpenRouter provides usage data in two ways:

#### Method A: Include in Response

Add the `usage` parameter to your request:

```json
POST https://openrouter.ai/api/v1/chat/completions

{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [...],
  "usage": {
    "include": true
  }
}
```

**Response includes:**

```json
{
  "id": "gen-abc123xyz",
  "choices": [...],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350,
    "native_tokens_prompt": 150,
    "native_tokens_completion": 200,
    "total_cost": 0.00492
  }
}
```

**Important Notes:**
- Adds 200-300ms latency to the final response for calculation
- Works with both streaming and non-streaming requests
- `total_cost` is in credits (typically 1 credit = $1 USD)
- Native token counts use the model's actual tokenizer
- The returned token counts in the main response use GPT-4o tokenizer (normalized)
- **Billing is based on native token counts**, not normalized counts

#### Method B: Query After Request

Every completion response includes an `id` field. Use this to retrieve detailed generation statistics:

```javascript
GET https://openrouter.ai/api/v1/generation?id={generation_id}

Headers:
  Authorization: Bearer {inference_api_key}
```

**Response:**

```json
{
  "data": {
    "id": "gen-abc123xyz",
    "model": "anthropic/claude-sonnet-4.5",
    "streamed": false,
    "generation_time": 2,
    "created_at": "2025-11-15T20:29:18.574972+00:00",
    "tokens_prompt": 150,
    "tokens_completion": 200,
    "native_tokens_prompt": 150,
    "native_tokens_completion": 200,
    "num_media_prompt": null,
    "num_media_completion": null,
    "total_cost": 0.00492,
    "cache_discount": null
  }
}
```

**Use Cases:**
- Retrieve stats for requests that didn't include `usage: {include: true}`
- Audit historical requests
- Asynchronous usage tracking

---

## Option 2: Account-Level Analytics

### Credits & Balance Endpoint

Check remaining credits and usage limits:

```javascript
GET https://openrouter.ai/api/v1/auth/key

Headers:
  Authorization: Bearer {inference_api_key}
```

**Response:**

```json
{
  "data": {
    "label": "My API Key",
    "usage": 12.45,
    "limit": 100.00,
    "is_free_tier": false,
    "rate_limit": {
      "requests": 200,
      "interval": "10s"
    }
  }
}
```

**Fields:**
- `usage` - Total credits consumed by this key
- `limit` - Credit limit (null if unlimited)
- `is_free_tier` - Whether user has purchased credits
- `rate_limit` - Current rate limit configuration

**Limitations:**
- Shows cumulative usage, not broken down by time period
- No per-model breakdown
- No historical data

### Activity Analytics Endpoint

**⚠️ Requires Provisioning API Key** (separate from Inference key)

```javascript
GET https://openrouter.ai/api/v1/activity

Headers:
  Authorization: Bearer {provisioning_api_key}

Query Parameters:
  date: YYYY-MM-DD (optional, filter by single date)
```

**Capabilities:**
- Returns daily usage data for last 30 completed UTC days
- Grouped by model endpoint
- Includes token counts and costs

**Limitations:**
- Requires users to generate a second API key (Provisioning Key)
- Data is aggregated by UTC day boundaries
- Recommend waiting ~30 minutes after UTC boundary for complete previous day data (due to long-running requests like reasoning models)
- Response schema not fully documented in public API docs

**When to Use:**
- Cross-application usage tracking
- Official historical data needed
- Enterprise/power user scenarios

---

## Option 3: Local Usage Tracking

### Implementation Approach

Since per-request usage data is available via `usage.include`, you can build local analytics by:

1. Intercepting all API responses
2. Extracting usage data from each response
3. Storing in local database
4. Building custom analytics on stored data

### Data to Capture

**Per Request:**
```json
{
  "timestamp": "2025-11-15T14:30:00Z",
  "model": "anthropic/claude-sonnet-4.5",
  "generation_id": "gen-abc123",
  "prompt_tokens": 150,
  "completion_tokens": 200,
  "total_tokens": 350,
  "total_cost": 0.00492,
  "cached_tokens": 0
}
```

**Optional Metadata:**
```json
{
  "conversation_id": "conv-xyz",
  "user_id": "user-123",
  "duration_ms": 1250,
  "stream": true
}
```

### Storage Considerations

**Volume Estimation:**
- Average: ~100-200 bytes per request record
- Heavy user: 1000 requests/month = ~200KB/month
- Annual data: ~2.4MB

**Recommended Approaches:**
- **Web App:** IndexedDB or localStorage
- **Desktop App:** SQLite, LevelDB, or file-based JSON
- **Mobile App:** SQLite or Realm

### Aggregation Queries

Build analytics by querying stored data:

**Daily totals:**
```sql
SELECT 
  DATE(timestamp) as date,
  SUM(total_cost) as cost,
  SUM(total_tokens) as tokens,
  COUNT(*) as requests
FROM usage_logs
GROUP BY DATE(timestamp)
```

**By model:**
```sql
SELECT 
  model,
  SUM(total_cost) as cost,
  AVG(total_tokens) as avg_tokens
FROM usage_logs
WHERE timestamp >= date('now', '-30 days')
GROUP BY model
```

**Current month:**
```sql
SELECT 
  SUM(total_cost) as monthly_total
FROM usage_logs
WHERE strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
```

---

## Model Pricing Reference

Get current pricing for all models:

```javascript
GET https://openrouter.ai/api/v1/models
```

**Response includes:**
```json
{
  "data": [
    {
      "id": "anthropic/claude-sonnet-4.5",
      "name": "Claude Sonnet 4.5",
      "pricing": {
        "prompt": "0.000003",
        "completion": "0.000015",
        "request": "0",
        "image": "0"
      },
      "context_length": 200000,
      ...
    }
  ]
}
```

**Use Cases:**
- Display cost estimates before sending requests
- Calculate approximate costs for token counts
- Show cost comparisons between models

---

## Important Limitations & Considerations

### Token Counting Discrepancies

- **Returned usage counts** use GPT-4o tokenizer (normalized across models)
- **Actual billing** uses each model's native tokenizer
- For precise accounting, use `native_tokens_prompt` and `native_tokens_completion` fields
- Some providers don't return native counts; OpenRouter estimates when unavailable

### Streaming Responses

- Usage data is included in the **last SSE message** when streaming
- All previous techniques work with streaming, but timing differs
- The 200-300ms delay only affects the final chunk

### Caching

- `cached_tokens` field shows tokens read from cache
- Cached tokens typically cost less or nothing
- Cache writes are charged at normal input pricing
- Cache hits may have zero cost (provider-dependent)
- OpenRouter does not currently return tokens written to cache

### Cost Accuracy

- Costs are calculated based on native token counts
- `total_cost` is the definitive billed amount
- Manual calculation from pricing API may differ due to:
  - Caching discounts
  - Provider-specific features
  - Token count rounding

### Free Models

- Models with `:free` suffix have different limits
- Rate limited to 20 requests/minute
- Daily limits: 50 requests (or 1000 if you've purchased ≥10 credits)
- Usage tracking still works normally

### Rate Limits

- Rate limits are global per account, not per key
- Creating multiple keys doesn't increase limits
- Different models may have different limits
- Check `/api/v1/auth/key` for current limits

---

## Implementation Checklist

**For Local Tracking:**
- [ ] Add `usage: {include: true}` to all requests
- [ ] Extract usage data from all responses
- [ ] Store data with timestamp and model information
- [ ] Implement aggregation queries for analytics
- [ ] Handle edge cases (errors, partial responses, streaming)
- [ ] Periodic sync with `/api/v1/auth/key` for sanity checking

**For Official Analytics:**
- [ ] User generates Provisioning API Key
- [ ] Secure storage of provisioning key (separate from inference key)
- [ ] Implement `/api/v1/activity` endpoint calls
- [ ] Handle UTC timezone considerations
- [ ] Build UI for 30-day historical data

**Hybrid Approach:**
- [ ] Implement local tracking for real-time data
- [ ] Optionally support provisioning key for historical sync
- [ ] Reconcile local vs server data periodically

---

## Example: Complete Request with Usage Tracking

```javascript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://your-app.com",  // Optional: for OpenRouter leaderboard
    "X-Title": "Your App Name"                // Optional: for OpenRouter leaderboard
  },
  body: JSON.stringify({
    model: "anthropic/claude-sonnet-4.5",
    messages: [
      { role: "user", content: "Hello!" }
    ],
    usage: {
      include: true  // Enable usage tracking
    }
  })
});

const data = await response.json();

// Extract and store usage
const usageRecord = {
  timestamp: new Date().toISOString(),
  generation_id: data.id,
  model: "anthropic/claude-sonnet-4.5",
  prompt_tokens: data.usage.prompt_tokens,
  completion_tokens: data.usage.completion_tokens,
  total_tokens: data.usage.total_tokens,
  total_cost: data.usage.total_cost,
  cached_tokens: data.usage.cached_tokens || 0
};

// Store in your local database
await storeUsage(usageRecord);
```

---

## Additional Resources

- OpenRouter API Documentation: https://openrouter.ai/docs
- Models & Pricing: https://openrouter.ai/models
- Rate Limits Reference: https://openrouter.ai/docs/api-reference/limits
- Usage Accounting Guide: https://openrouter.ai/docs/use-cases/usage-accounting

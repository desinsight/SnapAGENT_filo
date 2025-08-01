# API Key Configuration
This project now uses environment variables for API key management.

## Setup
1. Copy .env file to your local environment
2. Add your API keys:
   - OPENAI_API_KEY=your_openai_key_here
   - ANTHROPIC_API_KEY=your_anthropic_key_here
3. Restart all services

## Security
- API keys are no longer stored in config.json files
- All services read from environment variables
- No API keys are logged to console

## Files Updated
- All config.json files: API keys removed
- OpenAIService.js: Environment variable priority
- AIInterface.js: Environment variable only
- ai-cli.js: Environment variable priority with fallback prompts
- claudeService.js: Environment variable only
- Settings.jsx: Displays instructions for .env configuration
- test_claude.js: Environment variable only


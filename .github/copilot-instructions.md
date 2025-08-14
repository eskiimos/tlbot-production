<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Total Lookas Telegram Bot - Copilot Instructions

## Project Overview
This is a TypeScript Telegram bot for Total Lookas company that handles merchandise ordering through WebApp integration with Prisma ORM and PostgreSQL database.

## Key Technologies
- **Telegraf**: Telegram Bot Framework
- **TypeScript**: Typed JavaScript
- **Prisma ORM**: Database toolkit with PostgreSQL
- **Express.js**: Health check endpoint
- **Docker**: Containerization

## Coding Standards
- Use TypeScript with strict mode enabled
- Follow async/await patterns for database operations
- Implement proper error handling with try-catch blocks
- Use Prisma Client for all database interactions
- Maintain consistent logging for debugging

## Database Models
- User: Telegram user information
- Message: All bot interactions
- WebAppData: Orders from web application
- Session: User session management

## Bot Commands Structure
- `/start` - Main welcome menu with inline keyboard
- `/webapp` - Direct catalog access
- `/help` - Bot information
- `/contacts` - Company contacts

## WebApp Integration
- Handle `web_app_data` events
- Parse and validate JSON data from WebApp
- Store orders in WebAppData model
- Send notifications to admin chat

## Environment Variables
- TELEGRAM_BOT_TOKEN (required)
- DATABASE_URL (required)
- NEXT_PUBLIC_APP_URL (optional)
- ADMIN_CHAT_ID (optional)
- NODE_ENV (optional)

## Development Guidelines
- Always use TypeScript types for Telegraf contexts
- Implement middleware for user creation/updates
- Use Prisma transactions for complex operations
- Handle WebApp data parsing carefully
- Implement graceful shutdown handlers

## Error Handling
- Catch and log all errors
- Provide user-friendly error messages
- Never expose sensitive information in error responses
- Use health check endpoint for monitoring

## Testing Considerations
- Test all bot commands
- Verify WebApp data handling
- Check database operations
- Validate error scenarios
- Test Docker deployment

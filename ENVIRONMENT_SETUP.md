# Environment Configuration Guide

This guide explains how to run the Kanban application in different environments.

## Available Environments

### 1. **Development** (Default)
- **Configuration**: `environment.ts`
- **API URL**: `http://localhost:3000/api`
- **Log Level**: `debug` (all logs)
- **Use for**: Regular development work

### 2. **Local** 
- **Configuration**: `environment.local.ts`
- **API URL**: `http://localhost:3000/api`
- **Log Level**: `debug` (all logs)
- **Use for**: Local testing and debugging

### 3. **Production**
- **Configuration**: `environment.production.ts`
- **API URL**: `/api` (relative path)
- **Log Level**: `error` (errors only)
- **Use for**: Production deployments

## Commands

### Development Server
```bash
# Start development server (default)
npm start

# Start with specific environment
npm run start:local    # Uses environment.local.ts
npm run start:prod     # Uses environment.production.ts (not recommended for dev)
```

### Building
```bash
# Production build (default)
npm run build

# Build for specific environments
npm run build:dev      # Development build
npm run build:local    # Local testing build  
npm run build:prod     # Production build (optimized)
```

### Watching Changes
```bash
npm run watch          # Watch mode for development
```

## Environment Files

### `src/environments/environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  logLevel: 'debug'
};
```

### `src/environments/environment.production.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  logLevel: 'error'
};
```

### `src/environments/environment.local.ts` (Local Testing)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  logLevel: 'debug'
};
```

## Logging Levels

The application supports different logging levels:

- **`error`**: Only errors (production)
- **`warn`**: Errors and warnings
- **`info`**: Errors, warnings, and info messages
- **`debug`**: All messages (development)

## How It Works

1. **File Replacement**: Angular automatically replaces `environment.ts` with the appropriate environment file during build
2. **Configuration**: The `angular.json` file contains `fileReplacements` settings
3. **Services**: All services use `environment.apiUrl` for API calls
4. **Logging**: LoggerService respects the `environment.logLevel` setting

## Verification

When the app starts, check the browser console for:
```
🔧 Environment Configuration: {
  production: false,
  apiUrl: "http://localhost:3000/api", 
  logLevel: "debug"
}
```

## Production Deployment

For production deployment:

1. **Build**: `npm run build:prod`
2. **API Setup**: Ensure your API is available at the same domain (or update `apiUrl`)
3. **Serve**: Serve the built files from `/dist/frontend`

## Customization

To add new environments:

1. Create new environment file (e.g., `environment.staging.ts`)
2. Add configuration to `angular.json` under `configurations`
3. Add npm script to `package.json`
4. Update this documentation

## Troubleshooting

**API Connection Issues**:
- Verify backend is running on correct port
- Check CORS settings in backend
- Confirm `apiUrl` matches your backend location

**Environment Not Loading**:
- Check `angular.json` file replacements
- Verify file names match exactly
- Clear browser cache and rebuild
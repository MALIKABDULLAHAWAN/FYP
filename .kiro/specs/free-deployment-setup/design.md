# Design Document: Free Deployment Setup

## Overview

This design outlines the technical implementation for deploying a full-stack Django REST API and React frontend application to free hosting platforms. The system will provide automated deployment pipelines, environment configuration management, and production-ready security configurations while maintaining zero hosting costs.

The deployment architecture separates concerns between backend API services and frontend static assets, leveraging platform-specific optimizations for each tier. The backend will be deployed to container-based platforms (Railway, Render, or Heroku) with managed PostgreSQL databases, while the frontend will be deployed to static hosting platforms (Vercel, Netlify, or GitHub Pages) with CDN distribution.

## Architecture

### Deployment Topology

```mermaid
graph TB
    subgraph "Frontend Deployment"
        FE[React Frontend]
        CDN[CDN/Edge Network]
        STATIC[Static Assets]
    end
    
    subgraph "Backend Deployment"
        API[Django API]
        DB[(PostgreSQL)]
        MEDIA[Media Storage]
    end
    
    subgraph "CI/CD Pipeline"
        GH[GitHub Repository]
        FE_BUILD[Frontend Build]
        BE_BUILD[Backend Build]
    end
    
    subgraph "Hosting Platforms"
        VERCEL[Vercel/Netlify]
        RAILWAY[Railway/Render]
    end
    
    GH --> FE_BUILD
    GH --> BE_BUILD
    FE_BUILD --> VERCEL
    BE_BUILD --> RAILWAY
    
    FE --> CDN
    CDN --> STATIC
    API --> DB
    API --> MEDIA
    
    VERCEL --> FE
    RAILWAY --> API
    
    FE -.->|HTTPS API Calls| API
```

### Platform Selection Strategy

**Backend Hosting Options:**
- **Railway**: Preferred for automatic deployments, built-in PostgreSQL, generous free tier
- **Render**: Alternative with similar features, good PostgreSQL integration
- **Heroku**: Fallback option, established platform with extensive documentation

**Frontend Hosting Options:**
- **Vercel**: Preferred for React applications, excellent performance, automatic deployments
- **Netlify**: Alternative with similar features, good for static sites
- **GitHub Pages**: Fallback option for simple deployments

### Security Architecture

The deployment implements defense-in-depth security:

1. **Transport Security**: HTTPS enforcement on both frontend and backend
2. **API Security**: JWT authentication, CORS configuration, rate limiting
3. **Data Security**: Encrypted environment variables, secure database connections
4. **Infrastructure Security**: Platform-managed SSL certificates, security headers

## Components and Interfaces

### Backend Deployment Component

**Purpose**: Manages Django application deployment to container platforms

**Key Responsibilities:**
- Environment configuration management
- Database connection and migration handling
- Static file serving with WhiteNoise
- Security header configuration
- Health check endpoint provision

**Interface:**
```python
class BackendDeploymentManager:
    def configure_production_settings(self) -> Dict[str, Any]
    def setup_database_connection(self) -> None
    def run_migrations(self) -> bool
    def configure_static_files(self) -> None
    def setup_security_headers(self) -> None
    def create_health_check_endpoint(self) -> str
```

### Frontend Deployment Component

**Purpose**: Manages React application build and deployment to static hosting

**Key Responsibilities:**
- Production build optimization
- Environment variable injection
- API endpoint configuration
- Asset optimization and caching
- Client-side routing configuration

**Interface:**
```javascript
class FrontendDeploymentManager {
    buildForProduction(config: BuildConfig): BuildResult
    configureApiEndpoints(backendUrl: string): void
    optimizeAssets(): AssetManifest
    setupClientRouting(): RoutingConfig
    generateCacheHeaders(): CacheConfig
}
```

### Environment Manager Component

**Purpose**: Centralizes environment variable management across platforms

**Key Responsibilities:**
- Secure credential storage
- Environment-specific configuration
- Variable validation and defaults
- Cross-platform compatibility

**Interface:**
```python
class EnvironmentManager:
    def load_environment_config(self, environment: str) -> Dict[str, str]
    def validate_required_variables(self, variables: List[str]) -> bool
    def get_database_url(self, platform: str) -> str
    def get_cors_origins(self, environment: str) -> List[str]
    def setup_platform_variables(self, platform: str) -> None
```

### CI/CD Pipeline Component

**Purpose**: Orchestrates automated deployment processes

**Key Responsibilities:**
- Source code monitoring
- Test execution
- Build process management
- Deployment coordination
- Health verification

**Interface:**
```yaml
class DeploymentPipeline:
    trigger_conditions: List[GitEvent]
    test_suite: TestConfiguration
    build_steps: List[BuildStep]
    deployment_targets: List[Platform]
    verification_checks: List[HealthCheck]
```

## Data Models

### Deployment Configuration Model

```python
@dataclass
class DeploymentConfig:
    """Configuration for deployment across platforms"""
    
    # Platform Selection
    backend_platform: Literal['railway', 'render', 'heroku']
    frontend_platform: Literal['vercel', 'netlify', 'github-pages']
    
    # Environment Settings
    environment: Literal['development', 'staging', 'production']
    debug_mode: bool
    
    # Database Configuration
    database_url: str
    database_ssl_mode: str
    connection_pool_size: int
    
    # Security Settings
    secret_key: str
    allowed_hosts: List[str]
    cors_origins: List[str]
    csrf_trusted_origins: List[str]
    
    # API Configuration
    api_base_url: str
    jwt_access_lifetime: int
    jwt_refresh_lifetime: int
    
    # Static Assets
    static_url: str
    media_url: str
    cdn_url: Optional[str]
    
    # Monitoring
    health_check_path: str
    log_level: str
```

### Build Configuration Model

```typescript
interface BuildConfig {
    // Build Settings
    buildCommand: string;
    outputDirectory: string;
    nodeVersion: string;
    
    // Environment Variables
    apiBaseUrl: string;
    environment: 'development' | 'staging' | 'production';
    
    // Optimization Settings
    minification: boolean;
    sourceMap: boolean;
    chunkSplitting: boolean;
    
    // Caching Configuration
    staticCacheDuration: number;
    apiCacheDuration: number;
    
    // Routing Configuration
    clientSideRouting: boolean;
    fallbackRoute: string;
}
```

### Platform Integration Model

```python
@dataclass
class PlatformConfig:
    """Platform-specific configuration settings"""
    
    # Railway Configuration
    railway_project_id: Optional[str]
    railway_service_name: Optional[str]
    railway_environment: Optional[str]
    
    # Render Configuration
    render_service_id: Optional[str]
    render_environment_group: Optional[str]
    
    # Vercel Configuration
    vercel_project_id: Optional[str]
    vercel_team_id: Optional[str]
    
    # Netlify Configuration
    netlify_site_id: Optional[str]
    netlify_team_slug: Optional[str]
    
    # GitHub Pages Configuration
    github_repository: Optional[str]
    github_branch: Optional[str]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining correctness properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing:

### Property Reflection

After analyzing all acceptance criteria, I identified several properties suitable for property-based testing. However, many criteria involve infrastructure configuration and deployment processes that are better suited for integration tests. Let me consolidate the properties to eliminate redundancy:

**Redundancy Analysis:**
- Properties 2.6 and 9.3 both test cache headers - can be combined into one comprehensive property
- Properties 4.1, 4.2, 4.3, 4.4, and 4.5 all test CORS behavior - can be combined into comprehensive CORS properties
- Properties 6.3, 6.4, 6.5, and 6.6 all test security configurations - can be combined into security property groups

**Final Properties for Testing:**

### Property 1: Static File Serving Consistency
*For any* static file request (CSS, JS, images, fonts), the WhiteNoise middleware SHALL serve the file with correct MIME type and appropriate cache headers
**Validates: Requirements 1.5, 2.6, 9.3**

### Property 2: Migration Safety and Automation
*For any* database state and migration set, when the backend service starts, migrations SHALL complete successfully without data loss and seed required initial data
**Validates: Requirements 1.6, 5.2, 5.5**

### Property 3: Build Optimization Consistency
*For any* frontend asset configuration (JavaScript, CSS, images), the build system SHALL apply appropriate optimizations (minification, compression, code splitting) consistently
**Validates: Requirements 2.2, 9.1, 9.4**

### Property 4: Client-Side Routing Fallback
*For any* route path (valid or invalid), the frontend service SHALL handle client-side routing with proper fallback to the main application entry point
**Validates: Requirements 2.5**

### Property 5: Environment Configuration Security
*For any* sensitive configuration data (API keys, database URLs, tokens), the Environment Manager SHALL encrypt the data in storage and load it correctly across different environments
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Environment Validation Completeness
*For any* set of environment variables with missing or invalid required values, the Environment Manager SHALL detect and report all validation failures before deployment
**Validates: Requirements 3.6**

### Property 7: CORS Configuration Correctness
*For any* origin domain, the backend service SHALL allow requests from authorized frontend domains and reject requests from unauthorized domains, always including appropriate CORS headers
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 8: Deployment Failure Handling
*For any* deployment failure condition (migration errors, test failures, health check failures), the deployment pipeline SHALL halt the process and provide appropriate error reporting
**Validates: Requirements 5.3, 7.3**

### Property 9: Security Header Consistency
*For any* HTTP request to the backend service, security headers (HSTS, Content-Type nosniff, X-Frame-Options) and secure configurations (sessions, CSRF, JWT) SHALL be applied consistently
**Validates: Requirements 6.3, 6.4, 6.5, 6.6**

### Property 10: Health Monitoring Accuracy
*For any* service state (healthy, degraded, failed), the health check endpoints and monitoring systems SHALL accurately report the current status and handle errors gracefully
**Validates: Requirements 8.1, 8.2, 8.4, 8.5, 8.6**

### Property 11: Resource Loading Optimization
*For any* frontend resource (critical or non-critical), the loading strategy SHALL apply appropriate techniques (lazy loading for non-critical, immediate loading for critical) consistently
**Validates: Requirements 9.6**

## Error Handling

### Deployment Error Scenarios

**Migration Failures:**
- Database connection errors during migration
- Schema conflicts in migration scripts
- Data integrity violations during migration
- Timeout errors for long-running migrations

**Build Failures:**
- Frontend build compilation errors
- Asset optimization failures
- Environment variable injection errors
- Dependency resolution failures

**Configuration Errors:**
- Missing required environment variables
- Invalid database connection strings
- Incorrect CORS origin configurations
- SSL certificate provisioning failures

**Runtime Errors:**
- Database connection pool exhaustion
- File upload size limit violations
- JWT token validation failures
- Health check endpoint failures

### Error Recovery Strategies

**Graceful Degradation:**
- Frontend continues to function with cached data when API is unavailable
- Backend serves static error pages when database is unreachable
- Deployment pipeline provides detailed error logs for debugging

**Automatic Retry Logic:**
- Database connection retries with exponential backoff
- Failed deployment retries with manual approval
- Health check retries before marking service as failed

**Rollback Mechanisms:**
- Automatic rollback to previous deployment on health check failure
- Database migration rollback for failed schema changes
- Environment variable rollback for configuration errors

## Testing Strategy

### Dual Testing Approach

This feature requires both property-based testing and integration testing due to its infrastructure-heavy nature:

**Property-Based Testing:**
- **Library**: Use `hypothesis` for Python backend tests and `fast-check` for JavaScript frontend tests
- **Iterations**: Minimum 100 iterations per property test
- **Scope**: Focus on configuration logic, validation functions, and data transformation
- **Tag Format**: `Feature: free-deployment-setup, Property {number}: {property_text}`

**Integration Testing:**
- **Scope**: Infrastructure deployment, platform-specific behavior, end-to-end workflows
- **Environments**: Staging environments that mirror production platforms
- **Coverage**: Deployment pipelines, database connectivity, HTTPS configuration

**Unit Testing:**
- **Scope**: Individual component logic, utility functions, error handling
- **Coverage**: Environment managers, configuration validators, build optimizers

### Property Test Implementation Requirements

Each correctness property must be implemented as a property-based test:

1. **Property 1 (Static File Serving)**: Generate random file types and paths, verify MIME types and cache headers
2. **Property 2 (Migration Safety)**: Generate different database states and migration sequences
3. **Property 3 (Build Optimization)**: Generate various asset configurations and verify optimizations
4. **Property 4 (Client Routing)**: Generate random route paths including invalid ones
5. **Property 5 (Environment Security)**: Generate different sensitive data types and environments
6. **Property 6 (Environment Validation)**: Generate invalid environment configurations
7. **Property 7 (CORS Configuration)**: Generate various origin domains (authorized and unauthorized)
8. **Property 8 (Failure Handling)**: Generate different failure scenarios
9. **Property 9 (Security Headers)**: Generate different request types and verify headers
10. **Property 10 (Health Monitoring)**: Generate different service states
11. **Property 11 (Resource Loading)**: Generate different resource types and loading scenarios

### Integration Test Requirements

**Deployment Pipeline Tests:**
- Test complete deployment flow from code push to service availability
- Verify environment variable configuration across platforms
- Test rollback mechanisms for failed deployments

**Platform-Specific Tests:**
- Railway/Render/Heroku backend deployment verification
- Vercel/Netlify/GitHub Pages frontend deployment verification
- Database connectivity and SSL configuration testing

**Security Integration Tests:**
- HTTPS enforcement verification
- CORS policy testing with real frontend-backend communication
- JWT authentication flow testing

**Performance and Monitoring Tests:**
- Health check endpoint response time verification
- Asset loading performance testing
- Error boundary functionality testing

This comprehensive testing strategy ensures both the correctness of individual components through property-based testing and the proper integration of the entire deployment infrastructure through integration testing.

## Implementation Details

### Backend Deployment Configuration

**Django Settings Adaptation:**
```python
# Production settings overlay
PRODUCTION_SETTINGS = {
    'DEBUG': False,
    'ALLOWED_HOSTS': ['*'],  # Platform-specific hosts will be configured
    'SECURE_SSL_REDIRECT': True,
    'SECURE_HSTS_SECONDS': 31536000,
    'SECURE_HSTS_INCLUDE_SUBDOMAINS': True,
    'SECURE_HSTS_PRELOAD': True,
    'SECURE_CONTENT_TYPE_NOSNIFF': True,
    'SECURE_BROWSER_XSS_FILTER': True,
    'X_FRAME_OPTIONS': 'DENY',
    'SECURE_REFERRER_POLICY': 'strict-origin-when-cross-origin',
}
```

**Database Configuration:**
```python
# Platform-agnostic database configuration
def get_database_config():
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Parse platform-provided DATABASE_URL
        return dj_database_url.parse(database_url, conn_max_age=600)
    else:
        # Fallback to individual environment variables
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
```

**Static Files Configuration:**
```python
# WhiteNoise configuration for static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

### Frontend Build Configuration

**Vite Production Configuration:**
```javascript
// vite.config.js production overrides
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(
        process.env.VITE_API_BASE_URL || 'http://localhost:8000'
      ),
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'recharts', 'canvas-confetti'],
            'vendor-utils': ['axios', 'face-api.js'],
          },
        },
      },
    },
    server: {
      proxy: isProduction ? undefined : {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
```

**Environment Variable Configuration:**
```javascript
// Environment configuration for different deployment targets
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.yourdomain.com';
  }
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true,
};
```

### Platform-Specific Deployment Files

**Railway Configuration (railway.toml):**
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "backend"
source = "Backend/"

[services.variables]
DJANGO_SETTINGS_MODULE = "core.settings"
PYTHONPATH = "/app"
```

**Render Configuration (render.yaml):**
```yaml
services:
  - type: web
    name: dhyan-backend
    env: python
    buildCommand: "pip install -r requirements.txt && python manage.py collectstatic --noinput"
    startCommand: "gunicorn core.wsgi:application"
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: core.settings
      - key: PYTHON_VERSION
        value: 3.11.0
    healthCheckPath: /health/
```

**Vercel Configuration (vercel.json):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@api_base_url"
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Netlify Configuration (_redirects):**
```
# Client-side routing fallback
/*    /index.html   200

# API proxy (if needed)
/api/*  https://your-backend-url.railway.app/api/:splat  200
```

### CI/CD Pipeline Configuration

**GitHub Actions Workflow (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install backend dependencies
        run: |
          cd Backend
          pip install -r requirements.txt
          
      - name: Run backend tests
        run: |
          cd Backend
          python manage.py test
          
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --run
          
      - name: Build frontend
        run: |
          cd frontend
          npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
          
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```

### Environment Variable Management

**Required Environment Variables by Platform:**

**Backend (Railway/Render/Heroku):**
```bash
# Django Configuration
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=your-domain.railway.app,your-custom-domain.com

# Database (usually provided by platform)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com

# JWT Configuration
JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7

# External APIs
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (Vercel/Netlify):**
```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend.railway.app

# Build Configuration
NODE_VERSION=18
NPM_VERSION=8
```

### Health Check Implementation

**Backend Health Check Endpoint:**
```python
# health/views.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time

def health_check(request):
    """Comprehensive health check endpoint"""
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'checks': {}
    }
    
    # Database connectivity check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'healthy'
    except Exception as e:
        health_status['checks']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Cache connectivity check (if using Redis)
    try:
        cache.set('health_check', 'ok', 30)
        cache.get('health_check')
        health_status['checks']['cache'] = 'healthy'
    except Exception as e:
        health_status['checks']['cache'] = f'unhealthy: {str(e)}'
    
    # Static files check
    try:
        from django.contrib.staticfiles import finders
        static_file = finders.find('admin/css/base.css')
        health_status['checks']['static_files'] = 'healthy' if static_file else 'missing'
    except Exception as e:
        health_status['checks']['static_files'] = f'error: {str(e)}'
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)
```

**Frontend Error Boundary:**
```javascript
// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      // Send error to monitoring service
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Implementation for error logging service
    fetch('/api/errors/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(console.error);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Security Configuration

**CORS Configuration:**
```python
# settings.py CORS configuration
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Never allow all origins in production

# Additional CORS headers for API compatibility
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
    'x-requested-with',
    'x-csrftoken',
]
```

**Security Headers Middleware:**
```python
# middleware/security.py
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # HSTS header (only over HTTPS)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response
```

This comprehensive design provides a complete blueprint for implementing free deployment infrastructure that meets all requirements while maintaining security, performance, and reliability standards.
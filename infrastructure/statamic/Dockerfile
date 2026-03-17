FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Install Statamic via Composer (if not already present in volume)
RUN if [ ! -f "artisan" ]; then \
    composer create-project statamic/statamic . --prefer-dist --no-interaction; \
    fi

# ===========================================
# PRODUCTION CONFIGURATION
# These fixes are required for running behind a reverse proxy (nginx)
# ===========================================

# Configure environment for production
RUN sed -i 's|APP_ENV=local|APP_ENV=production|' .env 2>/dev/null || true && \
    sed -i 's|APP_DEBUG=true|APP_DEBUG=false|' .env 2>/dev/null || true

# Configure TrustProxies middleware for Laravel 11+
# Required for HTTPS behind nginx reverse proxy
RUN cat > bootstrap/app.php << 'EOF'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__."/../routes/web.php",
        commands: __DIR__."/../routes/console.php",
        health: "/up",
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: "*");
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
EOF

# Publish Control Panel assets (required for CP to render properly)
RUN php artisan vendor:publish --tag=statamic-cp --force

# Build frontend assets
RUN npm install && npm run build

# ===========================================
# PERMISSIONS
# ===========================================

# Set proper permissions for www-data user
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/users \
    && chmod -R 775 /var/www/html/content \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Apache configuration - point to public directory
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# ===========================================
# ENTRYPOINT SCRIPT
# Updates APP_URL at runtime from environment variable
# ===========================================

RUN cat > /usr/local/bin/docker-entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Update APP_URL from environment variable if set
if [ -n "$APP_URL" ]; then
    sed -i "s|APP_URL=.*|APP_URL=$APP_URL|" /var/www/html/.env
    echo "APP_URL set to: $APP_URL"
fi

# Clear config cache to pick up new APP_URL
php /var/www/html/artisan config:clear 2>/dev/null || true

# Execute the main command
exec "$@"
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]

# FM REST API

Simple REST API application built with NestJS and PostgreSQL.

## Requirements

- Docker
- Docker Compose

## Getting Started

Copy .env.example to .env

To run the application along with the PostgreSQL database:

```bash
docker-compose up --build
```

The application will be available at: http://localhost:3000

**API Documentation (Swagger):** http://localhost:3000/swagger

The PostgreSQL database will be available on port 5432.

## API Documentation

Full API documentation is available in Swagger/OpenAPI format at:

**http://localhost:3000/swagger**

The documentation includes:
- List of all available endpoints
- Detailed parameter and response descriptions
- Ability to test endpoints directly from the browser
- Schemas for all DTOs (Data Transfer Objects)

### API Endpoints

#### Images (v1)
- `POST /v1/images` - Upload and process a new image
- `GET /v1/images` - Get paginated list of images
- `GET /v1/images/:id` - Get image details by ID

#### Health
- `GET /health` - Application health check

## Project Structure

The project is organized with clear layer separation:

```
fm/
├── src/
│   ├── domain/           # Business logic and domain models
│   │   ├── entities/     # Domain entities
│   │   ├── enums/        # Domain enums
│   │   └── errors/       # Domain errors (no HTTP dependencies)
│   ├── application/      # Application layer (use cases)
│   │   ├── dto/          # Data Transfer Objects (with factory methods)
│   │   ├── interfaces/   # Abstractions and interfaces
│   │   ├── services/     # Application services
│   │   ├── validators/   # Validation logic (business rules)
│   │   ├── config/       # Configuration interfaces (contracts)
│   │   ├── helpers/      # Helper functions
│   │   └── errors/       # Application errors (no HTTP dependencies)
│   ├── infrastructure/   # Technical implementations
│   │   ├── adapters/     # Adapters for external libraries
│   │   ├── repositories/ # Repository implementations
│   │   ├── database/     # Database configuration
│   │   ├── storage/      # Storage module (S3)
│   │   ├── processors/   # Queue processors (Bull)
│   │   └── config/       # Configuration providers (implementations)
│   └── presentation/     # Presentation layer (HTTP)
│       ├── controllers/  # REST API controllers
│       ├── interceptors/ # NestJS interceptors
│       ├── filters/      # Exception filters (HTTP mapping)
│       └── modules/      # NestJS modules
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker image for application
└── package.json          # Project dependencies
```

### Architecture

- **Domain Layer**: Pure business logic without external dependencies
- **Application Layer**: Use case orchestration, no framework dependencies
- **Infrastructure Layer**: Technical implementations (Prisma, Sharp, AWS SDK)
- **Presentation Layer**: HTTP API (NestJS, controllers, filters)


## Environment Variables

The application uses the following environment variables (set in docker-compose.yml):

### Database
- `DATABASE_HOST` - database host (default: postgres)
- `DATABASE_PORT` - database port (default: 5432)
- `DATABASE_USER` - database user (default: postgres)
- `DATABASE_PASSWORD` - database password (default: postgres)
- `DATABASE_NAME` - database name (default: fm_db)
- `DATABASE_URL` - full database connection string

### AWS / LocalStack (S3 Storage)
- `AWS_ENDPOINT_URL` - internal S3 endpoint (e.g., http://localstack:4566 in Docker)
- `AWS_PUBLIC_ENDPOINT_URL` - public endpoint accessible from browser (e.g., http://localhost:4566)
- `AWS_ACCESS_KEY_ID` - AWS Access Key (default: test for LocalStack)
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Key (default: test for LocalStack)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_BUCKET_NAME` - S3 bucket name (default: fm-bucket)

### Redis (Queue)
- `REDIS_HOST` - Redis host (default: redis)
- `REDIS_PORT` - Redis port (default: 6379)

**Important:** The `AWS_PUBLIC_ENDPOINT_URL` variable is used to generate URLs accessible from the browser. 
In the Docker environment, we set it to `http://localhost:4566` so that links work in the browser on the host machine.

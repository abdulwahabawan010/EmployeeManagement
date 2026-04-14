# Deployment Scripts Reference

Quick reference for all deployment-related scripts.

---

## Main Deployment Script

### deploy-aca.sh

**Location**: `backend/scripts/deploy-aca.sh`

```bash
./scripts/deploy-aca.sh <environment> <db_password>
```

| Argument | Required | Values | Description |
|----------|----------|--------|-------------|
| environment | Yes | `dev`, `prod`, `clone` | Target deployment environment |
| db_password | Yes | string | Database password for the environment |

**Examples**:
```bash
# Deploy to development
./scripts/deploy-aca.sh dev myDevPassword

# Deploy to production
./scripts/deploy-aca.sh prod myProdPassword

# Deploy to clone
./scripts/deploy-aca.sh clone myProdPassword
```

**What it does**:
1. Builds JAR with Gradle
2. Logs into Azure Container Registry
3. Builds and pushes Docker image
4. Creates/updates Azure Container App
5. Outputs deployment URL

---

## Version Bump Script

### bump-version.sh

**Location**: `backend/scripts/bump-version.sh`

```bash
./scripts/bump-version.sh [bump_type] <environment> <db_password>
```

| Argument | Required | Default | Values | Description |
|----------|----------|---------|--------|-------------|
| bump_type | No | `patch` | `major`, `minor`, `patch` | Version bump type |
| environment | Yes | - | `dev`, `prod`, `clone` | Target environment |
| db_password | Yes | - | string | Database password |

**Examples**:
```bash
# Patch bump (0.1.2 → 0.1.3) + deploy to dev
./scripts/bump-version.sh patch dev myDevPassword

# Minor bump (0.1.2 → 0.2.0) + deploy to prod
./scripts/bump-version.sh minor prod myProdPassword

# Major bump (0.1.2 → 1.0.0) + deploy to clone
./scripts/bump-version.sh major clone myProdPassword

# Default patch bump (shorthand)
./scripts/bump-version.sh dev myDevPassword
```

**What it does**:
1. Reads current version from `build.gradle`
2. Calculates new version based on bump type
3. Updates `build.gradle` with new version
4. Triggers deployment via `deploy-aca.sh`

---

## Local Database Scripts

All located in `backend/db/docker/`

### start.sh

**Purpose**: Start local PostgreSQL container

```bash
./backend/db/docker/start.sh
```

**Behavior**:
- If volume exists: Preserves existing data
- If no volume: Creates fresh database with seed data (if `seed.zip` exists)

**Output**:
```
Connection details:
  Host:     localhost
  Port:     5433
  Database: alpha_db
  Username: alpha_user
  Password: alpha_password
```

---

### stop.sh

**Purpose**: Stop local PostgreSQL container

```bash
./backend/db/docker/stop.sh
```

**Behavior**:
- Stops container gracefully
- **Preserves all data** in Docker volume

---

### reset.sh

**Purpose**: Wipe and reseed database

```bash
./backend/db/docker/reset.sh
```

**Behavior**:
- Prompts for confirmation
- Stops containers
- **Deletes volume (ALL DATA LOST)**
- Rebuilds and restarts with fresh seed

**Warning**: This is destructive! All data will be lost.

---

### init-db.sh

**Purpose**: Database initialization (called by Docker)

```bash
# Called automatically by PostgreSQL container startup
./init-db.sh
```

**Behavior**:
- Extracts `seed.zip` if present
- Applies SQL migration files
- Only runs on first container startup

---

## Azure CLI Commands Reference

### Login to Azure

```bash
az login
```

### Login to Container Registry

```bash
az acr login --name alphaprodcappregistry
```

### View Container App Logs

```bash
# Stream logs
az containerapp logs show \
  --name alpha-dev-platform-capp \
  --resource-group Production \
  --follow

# Get recent logs
az containerapp logs show \
  --name alpha-dev-platform-capp \
  --resource-group Production
```

### Check Container App Status

```bash
az containerapp show \
  --name alpha-dev-platform-capp \
  --resource-group Production \
  --query "properties.runningStatus"
```

### Get Container App URL

```bash
az containerapp show \
  --name alpha-dev-platform-capp \
  --resource-group Production \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv
```

### Scale Container App

```bash
# Scale to specific replica count
az containerapp update \
  --name alpha-dev-platform-capp \
  --resource-group Production \
  --min-replicas 1 \
  --max-replicas 3
```

### Rollback to Previous Version

```bash
# Update to specific image version
az containerapp update \
  --name alpha-dev-platform-capp \
  --resource-group Production \
  --image alphaprodcappregistry.azurecr.io/alpha-backend:0.1.1
```

---

## Gradle Commands Reference

### Build JAR

```bash
cd backend
./gradlew clean bootJar
```

### Run Tests

```bash
# All tests
./gradlew test

# Unit tests only
./gradlew test -PexcludeTags=integration

# Integration tests only
./gradlew test -PincludeTags=integration
```

### Check Dependencies

```bash
./gradlew dependencies
```

### Clean Build

```bash
./gradlew clean
```

---

## Docker Commands Reference

### Build Image Locally

```bash
cd backend
docker build -t alpha-backend .
```

### Run Container Locally

```bash
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local-docker \
  -e ALPHA_LOCAL_DB_PASSWORD=alpha_password \
  alpha-backend
```

### View Container Logs

```bash
docker logs alpha-postgres-local -f
```

### Stop All Containers

```bash
cd backend/db/docker
docker-compose down
```

### Remove All Data

```bash
cd backend/db/docker
docker-compose down -v
```

---
name: be_deployment
description: "Backend: Expert guidance on deployment infrastructure including Azure Container Apps, Docker containerization, Gradle builds, environment configuration, and database management. Use when deploying the backend, understanding deployment scripts, configuring environments, troubleshooting deployments, or managing local databases."
---

# Backend Deployment Infrastructure

This skill covers the complete deployment infrastructure for the Alpha backend application.

## When to Use This Skill

Use when:
- Deploying the backend to Azure Container Apps
- Understanding deployment scripts and processes
- Configuring environment-specific settings
- Working with Docker containers
- Managing local development databases
- Troubleshooting deployment issues
- Version bumping and release management

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────────────┐   │
│  │   Gradle     │───▶│  Docker Build   │───▶│  Azure Container Apps    │   │
│  │  bootJar     │    │  (Multi-stage)  │    │  (dev/prod/clone)        │   │
│  └──────────────┘    └─────────────────┘    └──────────────────────────┘   │
│         │                    │                          │                   │
│         ▼                    ▼                          ▼                   │
│  platform-{ver}.jar    ACR Registry           PostgreSQL Databases          │
│                        alphaprodcappregistry  (Azure PostgreSQL)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Deploy to Environment

```bash
# Deploy to dev
./backend/scripts/deploy-aca.sh dev <db_password>

# Deploy to prod
./backend/scripts/deploy-aca.sh prod <db_password>

# Deploy to clone
./backend/scripts/deploy-aca.sh clone <db_password>
```

### Version Bump + Deploy

```bash
# Patch version bump + deploy (0.1.2 → 0.1.3)
./backend/scripts/bump-version.sh patch dev <db_password>

# Minor version bump + deploy (0.1.2 → 0.2.0)
./backend/scripts/bump-version.sh minor prod <db_password>

# Major version bump + deploy (0.1.2 → 1.0.0)
./backend/scripts/bump-version.sh major clone <db_password>
```

### Local Database Management

```bash
# Start local PostgreSQL
./backend/db/docker/start.sh

# Stop (preserves data)
./backend/db/docker/stop.sh

# Reset (wipes ALL data and reseeds)
./backend/db/docker/reset.sh
```

---

## Environments

| Environment | Container App | CPU | Memory | Replicas | Spring Profile | Database Host |
|-------------|---------------|-----|--------|----------|----------------|---------------|
| **dev** | `alpha-dev-platform-capp` | 1.0 | 2Gi | 0-1 | `dev` | `alphadevdb.postgres.database.azure.com` |
| **prod** | `alpha-prod-platform-capp` | 4.0 | 7Gi | 1-1 | `prod` | `mvsproddb.postgres.database.azure.com` |
| **clone** | `alpha-clone-platform-capp` | 2.0 | 4Gi | 0-1 | `prod-clone` | `mvscloneproddb.postgres.database.azure.com` |

### Scaling Behavior

- **Dev/Clone**: Scale to zero when idle (cost optimization)
- **Prod**: Always maintains at least 1 replica (high availability)

---

## Deployment Scripts

### deploy-aca.sh

**Location**: `backend/scripts/deploy-aca.sh`

**Purpose**: Main deployment script for Azure Container Apps

**Usage**:
```bash
./scripts/deploy-aca.sh <environment> <db_password>
```

**Arguments**:
- `environment`: Target environment (`dev`, `prod`, or `clone`)
- `db_password`: Database password for the environment

**Process Flow**:
1. Validate environment parameter
2. Build application with Gradle (`./gradlew clean bootJar`)
3. Extract version from `build.gradle`
4. Login to Azure Container Registry (ACR)
5. Build Docker image in ACR with versioning
6. Create or update Container App with environment-specific configuration
7. Display FQDN and health check URL

**Example**:
```bash
./scripts/deploy-aca.sh dev myDevPassword

# Output:
# [INFO] Step 1: Building application with Gradle...
# [INFO] Step 2: Application version: 0.1.2
# [INFO] Step 4: Building Docker image in ACR...
# [INFO] Step 5: Deploying to Container App: alpha-prod-platform-dev
# [INFO] Deployment Complete!
# [INFO] FQDN: https://alpha-prod-platform-dev.xxx.germanywestcentral.azurecontainerapps.io
```

---

### bump-version.sh

**Location**: `backend/scripts/bump-version.sh`

**Purpose**: Semantic versioning + automatic deployment

**Usage**:
```bash
./scripts/bump-version.sh [bump_type] <environment> <db_password>
```

**Arguments**:
- `bump_type`: Version bump type (`major`, `minor`, `patch` - default: `patch`)
- `environment`: Target environment (`dev`, `prod`, or `clone`)
- `db_password`: Database password

**Version Bumping**:
| Current | Bump Type | Result |
|---------|-----------|--------|
| 0.1.2 | patch | 0.1.3 |
| 0.1.2 | minor | 0.2.0 |
| 0.1.2 | major | 1.0.0 |

**Example**:
```bash
./scripts/bump-version.sh minor prod myProdPassword

# Output:
# [INFO] Current version: 0.1.2
# [INFO] New version (minor bump): 0.2.0
# [INFO] Updating version in build.gradle...
# [INFO] Triggering deployment...
```

---

## Docker Configuration

### Dockerfile (Multi-stage Build)

**Location**: `backend/Dockerfile`

**Stage 1: Build**
- Base: `gradle:8.7-jdk21`
- Compiles Java source code
- Produces executable JAR

**Stage 2: Runtime**
- Base: `eclipse-temurin:21-jre-alpine` (minimal image)
- Non-root user execution (security)
- Container-aware JVM settings

**JVM Configuration**:
```
-XX:+UseContainerSupport          # Container-aware resource limits
-XX:MaxRAMPercentage=75.0         # Use 75% of container memory
-XX:+UseG1GC                      # G1 garbage collector for better latency
-XX:+ExitOnOutOfMemoryError       # Exit on OOM for container orchestration
-Djava.security.egd=file:/dev/./urandom  # Faster random number generation
```

**Health Check**:
- Endpoint: `/actuator/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Start period: 60 seconds
- Retries: 3

### Build Locally

```bash
# Build image
docker build -t alpha-backend ./backend

# Run container
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local-docker \
  -e ALPHA_LOCAL_DB_PASSWORD=alpha_password \
  alpha-backend
```

---

## Local Database Setup

### docker-compose.yml

**Location**: `backend/db/docker/docker-compose.yml`

**Configuration**:
```yaml
services:
  postgres:
    container_name: alpha-postgres-local
    environment:
      POSTGRES_DB: alpha_db
      POSTGRES_USER: alpha_user
      POSTGRES_PASSWORD: alpha_password
    ports:
      - "5433:5432"  # Avoids conflict with local PostgreSQL
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persistent storage
```

### Database Scripts

| Script | Purpose | Data Preserved? |
|--------|---------|-----------------|
| `start.sh` | Start database container | Yes |
| `stop.sh` | Stop database container | Yes |
| `reset.sh` | Wipe and reseed database | **No** |

### Connection Details

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5433` |
| Database | `alpha_db` |
| Username | `alpha_user` |
| Password | `alpha_password` |

### Application Credentials (Seeded)

| Property | Value |
|----------|-------|
| Username | `root` |
| Password | `%LongPassword12345%&()////` |

---

## Azure Infrastructure

### Container Registry (ACR)

| Property | Value |
|----------|-------|
| Name | `alphaprodcappregistry` |
| Login Server | `alphaprodcappregistry.azurecr.io` |
| Location | Germany West Central |
| Resource Group | Production |

### Container Apps Environment

| Property | Value |
|----------|-------|
| Name | `alpha-prod` |
| Location | `germanywestcentral` |
| Resource Group | `Production` |

### PostgreSQL Servers

| Environment | Host | Tenant Databases |
|-------------|------|------------------|
| Dev | `alphadevdb.postgres.database.azure.com` | master, tenantA, tenantB, tenantC |
| Prod | `mvsproddb.postgres.database.azure.com` | master, klaus, rathje |
| Clone | `mvscloneproddb.postgres.database.azure.com` | Production clones |

---

## Troubleshooting

### View Container App Logs

```bash
az containerapp logs show \
  --name alpha-prod-platform-dev \
  --resource-group Production
```

### Check Health Status

```bash
curl https://<fqdn>/actuator/health
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails | Gradle cache issue | Run `./gradlew clean` first |
| ACR login fails | Azure session expired | Run `az login` |
| Container won't start | Memory limit too low | Increase `MEMORY` in config |
| Health check fails | Slow startup | Increase `start-period` |

### Restart Container App

```bash
# Force restart by scaling
az containerapp revision restart \
  --name alpha-prod-platform-dev \
  --resource-group Production \
  --revision <revision-name>
```

---

## File Locations

### Deployment Scripts
- `backend/scripts/deploy-aca.sh` - Main deployment script
- `backend/scripts/bump-version.sh` - Version bumping + deploy

### Docker Configuration
- `backend/Dockerfile` - Multi-stage Dockerfile
- `backend/db/docker/Dockerfile` - PostgreSQL container
- `backend/db/docker/docker-compose.yml` - Local dev compose

### Database Scripts
- `backend/db/docker/start.sh` - Start local DB
- `backend/db/docker/stop.sh` - Stop local DB
- `backend/db/docker/reset.sh` - Reset and reseed DB
- `backend/db/docker/init-db.sh` - Initialization script

### Configuration
- `backend/build.gradle` - Version and dependencies
- `backend/src/main/resources/application.yml` - Base config
- `backend/src/main/resources/application-dev.yml` - Dev profile
- `backend/src/main/resources/application-prod.yml` - Prod profile
- `backend/src/main/resources/application-prod-clone.yml` - Clone profile

---

## Best Practices

### DO:
- Always test deployment in `dev` before `prod`
- Use `bump-version.sh` for releases (ensures version tracking)
- Check logs after deployment to verify startup
- Keep seed.zip updated for consistent local development

### DON'T:
- Don't deploy directly to `prod` without testing in `dev`
- Don't modify Azure resources manually (use scripts)
- Don't commit database passwords to git
- Don't run `reset.sh` without understanding data will be lost

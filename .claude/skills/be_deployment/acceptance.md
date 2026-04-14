# Deployment Acceptance Checklist

Use this checklist to verify deployment compliance and best practices.

## Pre-Deployment Checks

- [ ] Application builds successfully with `./gradlew clean bootJar`
- [ ] All tests pass with `./gradlew test`
- [ ] Version in `build.gradle` is correctly set
- [ ] No uncommitted changes in git (clean working directory)
- [ ] Azure CLI is authenticated (`az account show`)

## Environment Configuration

### Dev Environment
- [ ] Spring profile set to `dev`
- [ ] Container App name: `alpha-dev-platform-capp`
- [ ] Resources: 1.0 CPU, 2Gi Memory
- [ ] Min replicas: 0 (scales to zero)
- [ ] Database host: `alphadevdb.postgres.database.azure.com`

### Prod Environment
- [ ] Spring profile set to `prod`
- [ ] Container App name: `alpha-prod-platform-capp`
- [ ] Resources: 4.0 CPU, 7Gi Memory
- [ ] Min replicas: 1 (always running)
- [ ] Database host: `mvsproddb.postgres.database.azure.com`

### Clone Environment
- [ ] Spring profile set to `prod-clone`
- [ ] Container App name: `alpha-clone-platform-capp`
- [ ] Resources: 2.0 CPU, 4Gi Memory
- [ ] Min replicas: 0 (scales to zero)
- [ ] Database host: `mvscloneproddb.postgres.database.azure.com`

## Docker Configuration

- [ ] Multi-stage build (build + runtime stages)
- [ ] Base runtime image: `eclipse-temurin:21-jre-alpine`
- [ ] Non-root user execution (`appuser`)
- [ ] Container-aware JVM settings enabled
- [ ] Health check configured (`/actuator/health`)
- [ ] Port 8080 exposed

## Post-Deployment Verification

- [ ] Container App shows "Running" status
- [ ] Health check endpoint returns healthy: `curl https://<fqdn>/actuator/health`
- [ ] Application logs show successful startup
- [ ] No error messages in Container App logs
- [ ] Database connectivity verified (application starts without DB errors)

## Version Management

- [ ] Version follows semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Version updated before deployment (via `bump-version.sh` or manually)
- [ ] Docker image tagged with version number
- [ ] `latest` tag also updated

## Security Checks

- [ ] Database password not committed to git
- [ ] Database password passed as environment variable
- [ ] Non-root user used in container
- [ ] No sensitive data in container logs
- [ ] HTTPS ingress enabled (not HTTP)

## Local Database Setup

- [ ] `seed.zip` present for initial data (if needed)
- [ ] Docker Compose port doesn't conflict (5433)
- [ ] Volume persistence enabled
- [ ] Health check configured for PostgreSQL

## Rollback Preparedness

- [ ] Previous version image available in ACR
- [ ] Know how to rollback: `az containerapp update --image <previous-version>`
- [ ] Database migrations are backwards-compatible

## Documentation

- [ ] Deployment steps documented
- [ ] Environment-specific configuration documented
- [ ] Troubleshooting guide available
- [ ] Contact information for escalation

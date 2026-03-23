export interface DeploymentMetadata {
  buildId: string
  commitSha: string
  deployedAt: string
  netlifyDeployId: string
  cacheSchemaVersion: string
}

const CACHE_SCHEMA_VERSION = process.env.CACHE_SCHEMA_VERSION ?? 'v5'

export const DEPLOYMENT_METADATA: DeploymentMetadata = {
  buildId: process.env.BUILD_ID ?? process.env.DEPLOY_ID ?? 'unknown',
  commitSha: process.env.COMMIT_SHA ?? process.env.COMMIT_REF ?? 'unknown',
  deployedAt: process.env.DEPLOYED_AT ?? 'unknown',
  netlifyDeployId: process.env.NETLIFY_DEPLOY_ID ?? process.env.DEPLOY_ID ?? 'unknown',
  cacheSchemaVersion: CACHE_SCHEMA_VERSION,
}
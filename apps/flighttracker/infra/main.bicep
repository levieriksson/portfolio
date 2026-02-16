targetScope = 'resourceGroup'

@description('Azure region. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Prefix used to name resources.')
param namePrefix string = 'flighttracker'

@description('Web App name (must be globally unique). If you leave blank, a unique name is generated.')
param webAppName string = '${namePrefix}-api-${uniqueString(resourceGroup().id)}'

@description('Linux App Service Plan name.')
param appServicePlanName string = '${namePrefix}-plan-${uniqueString(resourceGroup().id)}'

@description('PostgreSQL Flexible Server name (must be globally unique).')
param postgresServerName string = '${namePrefix}-pg-${uniqueString(resourceGroup().id)}'

@description('Database name to create on the Postgres server.')
param postgresDatabaseName string = 'flighttracker'

@description('Postgres admin username.')
param postgresAdminUser string = 'ftadmin'

@secure()
@description('Postgres admin password (pass from GitHub Secret).')
param postgresAdminPassword string

@description('Postgres major version.')
param postgresVersion string = '17'

@description('Postgres SKU tier.')
@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
param postgresSkuTier string = 'Burstable'

@description('Postgres SKU name (Burstable example: Standard_B1ms).')
param postgresSkuName string = 'Standard_B1ms'

@description('Postgres storage size in GB.')
param postgresStorageSizeGB int = 32

@description('App Service plan SKU tier (Always On requires Basic or higher).')
@allowed([
  'Basic'
  'Standard'
  'PremiumV2'
  'PremiumV3'
])
param appServiceSkuTier string = 'Basic'

@description('App Service plan SKU name (B1 is cheapest Always On tier).')
param appServiceSkuName string = 'B1'

var postgresFqdn = '${postgresServerName}.postgres.database.azure.com'

resource plan 'Microsoft.Web/serverfarms@2025-03-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    tier: appServiceSkuTier
    name: appServiceSkuName
  }
  properties: {
    reserved: true // Linux
  }
}

resource webApp 'Microsoft.Web/sites@2025-03-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true

      linuxFxVersion: 'DOTNETCORE|10.0'
      appCommandLine: 'dotnet FlightTracker.Backend.dll'
      ftpsState: 'Disabled'

      

      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }

        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
}

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: postgresServerName
  location: location
  sku: {
    name: postgresSkuName
    tier: postgresSkuTier
  }
  properties: {
    version: postgresVersion
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword

    network: {
      publicNetworkAccess: 'Enabled'
    }

    highAvailability: {
      mode: 'Disabled'
    }

    storage: {
      storageSizeGB: postgresStorageSizeGB
      autoGrow: 'Enabled'
    }

    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: pg
  name: postgresDatabaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

@description('Allow connections from any Azure service within Azure (0.0.0.0 rule).')
resource allowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: pg
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output outWebAppName string = webAppName
output outPostgresFqdn string = postgresFqdn
output outPostgresDbName string = postgresDatabaseName
output outPostgresAdminUser string = postgresAdminUser

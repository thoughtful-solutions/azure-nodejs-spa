# Deployment instruction for a SPA

set RESOURCE_GROUP=selectid111rg
set STORAGE_ACCOUNT=faasstorage111
set LOCATION=ukwest
set APPNAME=auditreportapp

## Check Login status
az account show  --query {subscriptionID:id,tenantId:tenantId}
{
  "subscriptionID": "50c608e3-50ad-4d29-bf75-95f2d372ba06",
  "tenantId": "9cab9fea-e61b-4050-90d2-c8e2b0d9676c"
}

set SUBSCRIPTIONID="50c608e3-50ad-4d29-bf75-95f2d372ba06"
set TENATID="9cab9fea-e61b-4050-90d2-c8e2b0d9676c"


# Create an MS Entra App
az ad app create --display-name %APPNAME% 
az ad app list --query "[].{id:id, identifierUris:identifierUris, displayName:displayName, appId:appId}"

set APPID="dd65fe70-54eb-4706-a87d-adf3e3e92e59"

## Create Resource Groups and Storage resources
```
az group create --name %RESOURCE_GROUP% --location %LOCATION%
az storage account create --name %STORAGE_ACCOUNT% --location %LOCATION% --sku Standard_LRS --resource-group %RESOURCE_GROUP%
az storage blob service-properties update --account-name %STORAGE_ACCOUNT% --static-website --index-document index.html
``
```
az storage account show --name %STORAGE_ACCOUNT% --query "primaryEndpoints.web" --output tsv
set WEBURL=https://faasstorage111.z35.web.core.windows.net/
```
```
az storage account show-connection-string --name %STORAGE_ACCOUNT% --resource-group %RESOURCE_GROUP% --output tsv 
set CONNSTR ="DefaultEndpointsProtocol=https;EndpointSuffix=core.windows.net;AccountName=faasstorage111;AccountKey=CU1t3PLOhHEA8ThmhMbo8UDUGUJXTHfk51XxYPgZWJqJHVRM5GlZb0U+FFmrwSYQM0uNX8ikku1G+ASt9KacbA==;BlobEndpoint=https://faasstorage111.blob.core.windows.net/;FileEndpoint=https://faasstorage111.file.core.windows.net/;QueueEndpoint=https://faasstorage111.queue.core.windows.net/;TableEndpoint=https://faasstorage111.table.core.windows.net/"
```

## Update the MS Entra App 

```
az ad app update --id %APPID% --web-redirect-uris %WEBURL%
az ad app update --id %APPID% --set groupMembershipClaims=All

az ad app permission add --id %APPID% --api 00000003-0000-0000-c000-000000000000 ^
 --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
```
## Get Client Secret for App
```
az ad app credential reset --id %APPID% --query password

set CLIENT_SECRET="0W48Q~v6cSpl3SiFMcOMLYlvq42JcX--qcBxAbq8"
```

## Build SPA Template app in JavaScript

``
mkdir %auditreportapp%

cd %auditreportapp%

npx create-react-app %auditreportapp%-spa

cd %auditreportapp%-spa
```

## Populate the SPA Template

edit the src\App.js to update clientsecret and tennanit


## Build the SPA

```
npm run build
```

## Deploy the SPA

```
az storage blob upload-batch --account-name %STORAGE_ACCOUNT% -d $web -s build --connection-string %CONNSTR% --overwrite
az storage cors add --methods GET HEAD MERGE OPTIONS POST PUT --origins "*" --services b --account-name %STORAGE_ACCOUNT% --connection-string %CONNSTR%
```

This might be needed but not sure
```
az ad app update --id %APPID% --web-redirect-uris "%WEBURL%index.html" [this might not be needed]
```

Now open a browser %WEBURL% in the browser

Now




az ad app list --query "[].{id:id, identifierUris:identifierUris, displayName:displayName, appId:appId}"
set APPID="dd65fe70-54eb-4706-a87d-adf3e3e92e59"

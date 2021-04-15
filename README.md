# GitHub Action for deploying to Azure Container Instances

[GitHub Actions](https://help.github.com/en/articles/about-github-actions) gives you the flexibility to build an automated software development lifecycle workflow. 

You can automate your workflows to deploy to [Azure Container Instances](https://azure.microsoft.com/en-us/services/container-instances/) using GitHub Actions.

Get started today with a [free Azure account](https://azure.com/free/open-source)!

This repository contains [GitHub Action for Deploying to Azure Container Instances](/action.yml) to deploy to Azure Container Instances. It supports deploying your container image to an Azure Container Instance.

The definition of this GitHub Action is in [action.yml](/action.yml).

# End-to-End Sample Workflows

## Dependencies on other GitHub Actions
* [Azure Login](https://github.com/Azure/login) Login with your Azure Credentials for Authentication. Once login is done, the next set of Azure Actions in the workflow can re-use the same session within the job.

## Azure Service Principal for RBAC
For using any credentials like Azure Service Principal in your workflow, add them as [secrets](https://help.github.com/en/articles/virtual-enivronments-for-github-actions#creating-and-using-secrets-encrypted-variables) in the GitHub Repository and then refer them in the workflow.
1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure Credentials.
2. Run Azure CLI command to create an [Azure Service Principal for RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview):
```bash

    az ad sp create-for-rbac --name "myApp" --role contributor \
                             --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                             --sdk-auth
    
    # Replace {subscription-id}, {resource-group} with the subscription, resource group details of the WebApp
    # The command should output a JSON object similar to this:

  {
    "clientId": "<GUID>",
    "clientSecret": "<GUID>",
    "subscriptionId": "<GUID>",
    "tenantId": "<GUID>",
    (...)
  }
```
  * You can further scope down the Azure Credentials to the Web App using scope attribute. For example, 
  ```
   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} \
                            --sdk-auth

  # Replace {subscription-id}, {resource-group}, and {app-name} with the names of your subscription, resource group, and Azure Web App.
  ```
3. Paste the json response from above Azure CLI to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_CREDENTIALS**
4. Now in the workflow file in your branch: `.github/workflows/workflow.yml` replace the secret in Azure login action with your secret (Refer to the example below)

## Build and Deploy a Node.JS App to Azure Container Instances

```yaml

on: [push]
name: Linux_Container_Workflow

jobs:
    build-and-deploy:
        runs-on: ubuntu-latest
        steps:
        # checkout the repo
        - name: 'Checkout GitHub Action'
          uses: actions/checkout@master
          
        - name: 'Login via Azure CLI'
          uses: azure/login@v1
          with:
            creds: ${{ secrets.AZURE_CREDENTIALS }}
        
        - uses: azure/docker-login@v1
          with:
            login-server: contoso.azurecr.io
            username: ${{ secrets.REGISTRY_USERNAME }}
            password: ${{ secrets.REGISTRY_PASSWORD }}
        - run: |
            docker build . -t contoso.azurecr.io/nodejssampleapp:${{ github.sha }}
            docker push contoso.azurecr.io/nodejssampleapp:${{ github.sha }}

        - name: 'Deploy to Azure Container Instances'
          uses: 'azure/aci-deploy@v1'
          with:
            resource-group: contoso
            dns-name-label: url-for-container
            image: contoso.azurecr.io/nodejssampleapp:${{ github.sha }}
            registry-username: ${{ secrets.REGISTRY_USERNAME }}
            registry-password: ${{ secrets.REGISTRY_PASSWORD }}
            name: contoso-container
            location: 'west us'
```

## Example YAML Snippets

### Deploying a Container from a public registry

```yaml
- uses: Azure/aci-deploy@v1
  with:
    resource-group: contoso
    dns-name-label: url-for-container
    image: nginx
    name: contoso-container
    location: 'east us'
```

### Deploying a Container with Volumes (from Azure File Share or GitHub Repositories)
```yaml
- uses: Azure/aci-deploy@v1
  with:
    resource-group: contoso
    dns-name-label: url-for-container
    image: nginx
    name: contoso-container
    azure-file-volume-share-name: shareName
    azure-file-volume-account-name: accountName
    azure-file-volume-account-key: ${{ secrets.AZURE_FILE_VOLUME_KEY }}
    azure-file-volume-mount-path: /mnt/volume1
    location: 'east us'
```

### Deploying a Container with Environment Variables and Command Line

**NOTE**: Secure Environment Variables aren't masked by the Action so use them as Secrets if you want to hide them

```yaml
- uses: Azure/aci-deploy@v1
  with:
    resource-group: contoso
    dns-name-label: url-for-container
    image: nginx
    name: contoso-container
    command-line: /bin/bash a.sh
    environment-variables: key1=value1 key2=value2
    secure-environment-variables: key1=${{ secrets.ENV_VAL1 }} key2=${{ secrets.ENV_VAL2 }}
    location: 'east us'
```

# Local Development and Testing

If you wish to develop and test changes against a local fork or development repo, you can do so by including the `node_modules` in tagged release branch. Note that the `aci-deploy` repository does not include these modules in the master branch, so you cannot point your action to `aci-deploy/master` to pick up recent commits. 

Testing can be performed against your local repo by performing the following:

* Fork this repo.
* Create a separate branch on your local copy. This will be used to execute the action from your workflow.
* Perform an `npm install` and `npm run build`
* Ensure that you check in the `node_modules` directory to your branch.
* Update your workflow to refer to your tagged release from forked copy.

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

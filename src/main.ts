import * as core from '@actions/core';
import * as crypto from "crypto";

import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";
import { async } from 'q';
import { ContainerInstanceManagementClient, ContainerInstanceManagementModels, ContainerInstanceManagementMappers } from "@azure/arm-containerinstance";
import { TokenCredentials, ServiceClientCredentials } from "@azure/ms-rest-js";

import { TaskParameters } from "./taskparameters";


var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

async function main() {
    let isDeploymentSuccess: boolean = true;

    try {
        // Set user agent variable
        let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = 'DeployAzureContainerInstance';
        let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

        let endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer();
        var taskParams = TaskParameters.getTaskParams(endpoint);
        let bearerToken = await endpoint.getToken();
        let creds: ServiceClientCredentials = new TokenCredentials(bearerToken);

        core.debug("Predeployment Steps Started");
        const client = new ContainerInstanceManagementClient(creds, taskParams.subscriptionId);

        core.debug("Deployment Step Started");
        let containerGroupInstance: ContainerInstanceManagementModels.ContainerGroup = {
            "location": taskParams.location,
            "containers": [
                {
                    "name": taskParams.containerName,
                    "command": taskParams.commandLine,
                    "environmentVariables": taskParams.environmentVariables,
                    "image": taskParams.image,
                    "ports": taskParams.ports,
                    "resources": getResources(taskParams),
                    "volumeMounts": taskParams.volumeMounts
                }
            ],
            "imageRegistryCredentials": taskParams.registryUsername ? [ { "server": taskParams.registryLoginServer, "username": taskParams.registryUsername, "password": taskParams.registryPassword } ] : [],
            "ipAddress": {
                "ports": getPorts(taskParams),
                "type": taskParams.ipAddress,
                "dnsNameLabel": taskParams.dnsNameLabel
            },
            "diagnostics": taskParams.diagnostics,
            "volumes": taskParams.volumes,
            "osType": taskParams.osType,
            "restartPolicy": taskParams.restartPolicy,
            "type": "Microsoft.ContainerInstance/containerGroups",
            "name": taskParams.containerName
        }
        let containerDeploymentResult = await client.containerGroups.createOrUpdate(taskParams.resourceGroup, taskParams.containerName, containerGroupInstance);
        if(containerDeploymentResult.provisioningState == "Succeeded") {
            core.warning("Deployment Succeeded.");
            let appUrlWithoutPort = containerDeploymentResult.ipAddress?.fqdn;
            let port = taskParams.ports[0].port;
            let appUrl = "http://"+appUrlWithoutPort+":"+port.toString()+"/"
            core.setOutput("app-url", appUrl);
            core.warning("Your App has been deployed at: "+appUrl);
        }
    }
    catch (error) {
        core.debug("Deployment Failed with Error: " + error);
        isDeploymentSuccess = false;
        core.setFailed(error);
    }
    finally{
        core.debug(isDeploymentSuccess ? "Deployment Succeeded!" : "Deployment Failed!");

        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
    }
}

function getResources(taskParams: TaskParameters): ContainerInstanceManagementModels.ResourceRequirements {
    if (taskParams.gpuCount) {
        let resRequirements: ContainerInstanceManagementModels.ResourceRequirements = {
            "requests": {
                "cpu": taskParams.cpu,
                "memoryInGB": taskParams.memory,
                "gpu": {
                    "count": taskParams.gpuCount,
                    "sku": taskParams.gpuSku
                }
            }
        }
        return resRequirements;
    } else {
        let resRequirements: ContainerInstanceManagementModels.ResourceRequirements = {
            "requests": {
                "cpu": taskParams.cpu,
                "memoryInGB": taskParams.memory
            }
        }
        return resRequirements;
    }
}

function getPorts(taskParams: TaskParameters): Array<ContainerInstanceManagementModels.Port> {
    let ports = taskParams.ports;
    ports.forEach((port) => {
        port.protocol = taskParams.protocol;
    });
    return ports;
}

main();
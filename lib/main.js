"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const arm_containerinstance_1 = require("@azure/arm-containerinstance");
const ms_rest_js_1 = require("@azure/ms-rest-js");
const taskparameters_1 = require("./taskparameters");
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Set user agent variable
            let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let actionName = 'DeployAzureContainerInstance';
            let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            let endpoint = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
            var taskParams = taskparameters_1.TaskParameters.getTaskParams(endpoint);
            let bearerToken = yield endpoint.getToken();
            let creds = new ms_rest_js_1.TokenCredentials(bearerToken);
            core.debug("Predeployment Steps Started");
            const client = new arm_containerinstance_1.ContainerInstanceManagementClient(creds, taskParams.subscriptionId);
            core.debug("Deployment Step Started");
            let containerGroupInstance = {
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
                "imageRegistryCredentials": taskParams.registryUsername ? [{ "server": taskParams.registryLoginServer, "username": taskParams.registryUsername, "password": taskParams.registryPassword }] : [],
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
            };
            let containerDeploymentResult = yield client.containerGroups.createOrUpdate(taskParams.resourceGroup, taskParams.containerName, containerGroupInstance);
            if (containerDeploymentResult.provisioningState == "Succeeded") {
                console.log("Deployment Succeeded.");
                let appUrlWithoutPort = (_a = containerDeploymentResult.ipAddress) === null || _a === void 0 ? void 0 : _a.fqdn;
                let port = taskParams.ports[0].port;
                let appUrl = "http://" + appUrlWithoutPort + ":" + port.toString() + "/";
                core.setOutput("app-url", appUrl);
                console.log("Your App has been deployed at: " + appUrl);
            }
            else {
                core.debug("Deployment Result: " + containerDeploymentResult);
                throw Error("Container Deployment Failed" + containerDeploymentResult);
            }
        }
        catch (error) {
            core.debug("Deployment Failed with Error: " + error);
            core.setFailed(error);
        }
        finally {
            // Reset AZURE_HTTP_USER_AGENT
            core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
        }
    });
}
function getResources(taskParams) {
    if (taskParams.gpuCount) {
        let resRequirements = {
            "requests": {
                "cpu": taskParams.cpu,
                "memoryInGB": taskParams.memory,
                "gpu": {
                    "count": taskParams.gpuCount,
                    "sku": taskParams.gpuSku
                }
            }
        };
        return resRequirements;
    }
    else {
        let resRequirements = {
            "requests": {
                "cpu": taskParams.cpu,
                "memoryInGB": taskParams.memory
            }
        };
        return resRequirements;
    }
}
function getPorts(taskParams) {
    let ports = taskParams.ports;
    ports.forEach((port) => {
        port.protocol = taskParams.protocol;
    });
    return ports;
}
main();

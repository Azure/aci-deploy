"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskParameters = void 0;
const core = __importStar(require("@actions/core"));
class TaskParameters {
    constructor(endpoint) {
        this._endpoint = endpoint;
        this._subscriptionId = endpoint.subscriptionID;
        this._resourceGroup = core.getInput('resource-group', { required: true });
        this._commandLine = [];
        let commandLine = core.getInput("command-line");
        if (commandLine) {
            commandLine.split(' ').forEach((command) => {
                this._commandLine.push(command);
            });
        }
        this._cpu = parseFloat(core.getInput('cpu'));
        this._dnsNameLabel = core.getInput('dns-name-label', { required: true });
        this._diagnostics = {};
        let logType = core.getInput('log-type');
        let logAnalyticsWorkspace = core.getInput('log-analytics-workspace');
        let logAnalyticsWorkspaceKey = core.getInput('log-analytics-workspace-key');
        this._getDiagnostics(logAnalyticsWorkspace, logAnalyticsWorkspaceKey, logType);
        let environmentVariables = core.getInput('environment-variables');
        let secureEnvironmentVariables = core.getInput('secure-environment-variables');
        this._environmentVariables = [];
        this._getEnvironmentVariables(environmentVariables, secureEnvironmentVariables);
        let gpuCount = core.getInput('gpu-count');
        let gpuSku = core.getInput('gpu-sku');
        if (gpuSku && !gpuCount) {
            throw Error("You need to specify the count of GPU Resources with the SKU!");
        }
        else {
            if (gpuCount && !gpuSku) {
                throw Error("GPU SKU is not specified for the count. Please provide the `gpu-sku` parameter");
            }
            this._gpuCount = parseInt(gpuCount);
            this._gpuSKU = (gpuSku == 'K80') ? 'K80' : (gpuSku == 'P100' ? 'P100' : 'V100');
        }
        this._image = core.getInput('image', { required: true });
        let ipAddress = core.getInput('ip-address');
        if (!["Private", "Public"].includes(ipAddress)) {
            throw Error('The Value of IP Address must be either Public or Private');
        }
        else {
            this._ipAddress = (ipAddress == 'Public') ? 'Public' : 'Private';
        }
        this._location = core.getInput('location', { required: true });
        this._memory = parseFloat(core.getInput('memory'));
        this._containerName = core.getInput('name', { required: true });
        let osType = core.getInput('os-type');
        if (!["Linux", "Windows"].includes(osType)) {
            throw Error(`The Value of OS Type must be either Linux or Windows only - got ${osType}!`);
        }
        else {
            this._osType = (osType == 'Linux') ? 'Linux' : 'Windows';
        }
        let ports = core.getInput('ports');
        this._ports = [];
        this._getPorts(ports);
        let protocol = core.getInput('protocol');
        if (!["TCP", "UDP"].includes(protocol)) {
            throw Error("The Network Protocol can only be TCP or UDP");
        }
        else {
            this._protocol = protocol == "TCP" ? 'TCP' : 'UDP';
        }
        this._registryLoginServer = core.getInput('registry-login-server');
        if (!this._registryLoginServer) {
            // If the user doesn't give registry login server and the registry is ACR
            let imageList = this._image.split('/');
            if (imageList[0].indexOf('azurecr') > -1) {
                this._registryLoginServer = imageList[0];
            }
        }
        this._registryUsername = core.getInput('registry-username');
        this._registryPassword = core.getInput('registry-password');
        let restartPolicy = core.getInput('restart-policy');
        if (!["Always", "OnFailure", "Never"].includes(restartPolicy)) {
            throw Error('The Value of Restart Policy can be "Always", "OnFailure" or "Never" only!');
        }
        else {
            this._restartPolicy = (restartPolicy == 'Always') ? 'Always' : (restartPolicy == 'Never' ? 'Never' : 'OnFailure');
        }
        this._volumes = [];
        this._volumeMounts = [];
        let gitRepoVolumeUrl = core.getInput('gitrepo-url');
        let afsAccountName = core.getInput('azure-file-volume-account-name');
        let afsShareName = core.getInput('azure-file-volume-share-name');
        this._getVolumes(gitRepoVolumeUrl, afsShareName, afsAccountName);
    }
    _getDiagnostics(logAnalyticsWorkspace, logAnalyticsWorkspaceKey, logType) {
        if (logAnalyticsWorkspace || logAnalyticsWorkspaceKey) {
            if (!logAnalyticsWorkspaceKey || !logAnalyticsWorkspace) {
                throw Error("The Log Analytics Workspace Id or Workspace Key are not provided. Please fill in the appropriate parameters.");
            }
            if (logType && !['ContainerInsights', 'ContainerInstanceLogs'].includes(logType)) {
                throw Error("Log Type Can be Only of Type `ContainerInsights` or `ContainerInstanceLogs`");
            }
            let logAnalytics = { "workspaceId": logAnalyticsWorkspace,
                "workspaceKey": logAnalyticsWorkspaceKey };
            if (logType) {
                let logT;
                logT = (logType == 'ContainerInsights') ? 'ContainerInsights' : 'ContainerInstanceLogs';
                logAnalytics.logType = logT;
            }
            this._diagnostics = { "logAnalytics": logAnalytics };
        }
    }
    _getEnvironmentVariables(environmentVariables, secureEnvironmentVariables) {
        if (environmentVariables) {
            // split on whitespace, but ignore the ones that are enclosed in quotes
            let keyValuePairs = environmentVariables.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
            keyValuePairs.forEach((pair) => {
                // value is either wrapped in quotes or not
                let pairList = pair.split(/=(?:"(.+)"|(.+))/);
                let obj = {
                    "name": pairList[0],
                    "value": pairList[1] || pairList[2]
                };
                this._environmentVariables.push(obj);
            });
        }
        if (secureEnvironmentVariables) {
            // split on whitespace, but ignore the ones that are enclosed in quotes
            let keyValuePairs = secureEnvironmentVariables.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
            keyValuePairs.forEach((pair) => {
                // value is either wrapped in quotes or not
                let pairList = pair.split(/=(?:"(.+)"|(.+))/);
                let obj = {
                    "name": pairList[0],
                    "secureValue": pairList[1] || pairList[2]
                };
                this._environmentVariables.push(obj);
            });
        }
    }
    _getPorts(ports) {
        let portObjArr = [];
        ports.split(' ').forEach((portStr) => {
            let portInt = parseInt(portStr);
            portObjArr.push({ "port": portInt });
        });
        this._ports = portObjArr;
    }
    _getVolumes(gitRepoVolumeUrl, afsShareName, afsAccountName) {
        // Checking git repo volumes
        if (gitRepoVolumeUrl) {
            let gitRepoDir = core.getInput('gitrepo-dir');
            let gitRepoMountPath = core.getInput('gitrepo-mount-path');
            let gitRepoRevision = core.getInput('gitrepo-revision');
            let vol = { "repository": gitRepoVolumeUrl };
            if (!gitRepoMountPath) {
                throw Error("The Mount Path for GitHub Volume is not specified.");
            }
            if (gitRepoDir) {
                vol.directory = gitRepoDir;
            }
            if (gitRepoRevision) {
                vol.revision = gitRepoRevision;
            }
            let volMount = { "name": "git-repo-vol", "mountPath": gitRepoMountPath };
            this._volumes.push({ "name": "git-repo-vol", gitRepo: vol });
            this._volumeMounts.push(volMount);
        }
        // Checking Azure File Share Volumes
        if (afsShareName && afsAccountName) {
            let afsMountPath = core.getInput('azure-file-volume-mount-path');
            let afsAccountKey = core.getInput('azure-file-volume-account-key');
            let afsReadOnly = core.getInput('azure-file-volume-read-only');
            if (!afsMountPath) {
                throw Error("The Mount Path for Azure File Share Volume is not specified");
            }
            let vol = { "shareName": afsShareName, "storageAccountName": afsAccountName };
            if (afsAccountKey) {
                vol.storageAccountKey = afsAccountKey;
            }
            let volMount = { "name": "azure-file-share-vol", "mountPath": afsMountPath };
            if (afsReadOnly) {
                if (!["true", "false"].includes(afsReadOnly)) {
                    throw Error("The Read-Only Flag can only be `true` or `false` for the Azure File Share Volume");
                }
                vol.readOnly = (afsReadOnly == "true");
                volMount.readOnly = (afsReadOnly == "true");
            }
            this._volumes.push({ "name": "azure-file-share-vol", azureFile: vol });
            this._volumeMounts.push(volMount);
        }
        else if (!afsShareName && afsAccountName) {
            throw Error("The Name of the Azure File Share is required to mount it as a volume");
        }
        else if (!afsAccountName && afsShareName) {
            throw Error("The Storage Account Name for the Azure File Share is required to mount it as a volume");
        }
        else { }
        ;
    }
    static getTaskParams(endpoint) {
        if (!this.taskparams) {
            this.taskparams = new TaskParameters(endpoint);
        }
        return this.taskparams;
    }
    get resourceGroup() {
        return this._resourceGroup;
    }
    get commandLine() {
        return this._commandLine;
    }
    get cpu() {
        return this._cpu;
    }
    get diagnostics() {
        return this._diagnostics;
    }
    get dnsNameLabel() {
        return this._dnsNameLabel;
    }
    get environmentVariables() {
        return this._environmentVariables;
    }
    get gpuCount() {
        return this._gpuCount;
    }
    get gpuSku() {
        return this._gpuSKU;
    }
    get image() {
        return this._image;
    }
    get ipAddress() {
        return this._ipAddress;
    }
    get location() {
        return this._location;
    }
    get memory() {
        return this._memory;
    }
    get containerName() {
        return this._containerName;
    }
    get osType() {
        return this._osType;
    }
    get ports() {
        return this._ports;
    }
    get protocol() {
        return this._protocol;
    }
    get registryLoginServer() {
        return this._registryLoginServer;
    }
    get registryUsername() {
        return this._registryUsername;
    }
    get registryPassword() {
        return this._registryPassword;
    }
    get restartPolicy() {
        return this._restartPolicy;
    }
    get volumes() {
        return this._volumes;
    }
    get volumeMounts() {
        return this._volumeMounts;
    }
    get subscriptionId() {
        return this._subscriptionId;
    }
}
exports.TaskParameters = TaskParameters;

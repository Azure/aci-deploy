import * as core from '@actions/core';

import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

import fs = require('fs');
import { ContainerInstanceManagementModels } from '@azure/arm-containerinstance';
import { parseForPairs } from './utilities';

export class TaskParameters {
    private static taskparams: TaskParameters;
    private _endpoint: IAuthorizer;
    private _resourceGroup: string;
    private _commandLine: Array<string>;
    private _cpu: number;
    private _diagnostics: ContainerInstanceManagementModels.ContainerGroupDiagnostics;
    private _dnsNameLabel: string;
    private _environmentVariables: Array<ContainerInstanceManagementModels.EnvironmentVariable>;
    private _gpuCount: number;
    private _gpuSKU: ContainerInstanceManagementModels.GpuSku;
    private _image:string;
    private _ipAddress:ContainerInstanceManagementModels.ContainerGroupIpAddressType;
    private _location:string;
    private _memory: number;
    private _containerName: string;
    private _osType: ContainerInstanceManagementModels.OperatingSystemTypes;
    private _ports: Array<ContainerInstanceManagementModels.Port>;
    private _protocol: ContainerInstanceManagementModels.ContainerGroupNetworkProtocol;
    private _registryLoginServer: string;
    private _registryUsername: string;
    private _registryPassword: string;
    private _restartPolicy: ContainerInstanceManagementModels.ContainerGroupRestartPolicy;
    private _volumes: Array<ContainerInstanceManagementModels.Volume>;
    private _volumeMounts: Array<ContainerInstanceManagementModels.VolumeMount>;
    
    private _subscriptionId: string;

    private constructor(endpoint: IAuthorizer) {
        this._endpoint = endpoint;
        this._subscriptionId = endpoint.subscriptionID;
        this._resourceGroup = core.getInput('resource-group', { required: true });
        this._commandLine = [];
        let commandLine = core.getInput("command-line");
        if(commandLine) {
            commandLine.split(' ').forEach((command: string) => {
                this._commandLine.push(command);
            });
        }
        this._cpu = parseFloat(core.getInput('cpu'));
        this._dnsNameLabel = core.getInput('dns-name-label', { required: true });
        this._diagnostics = {}
        let logType = core.getInput('log-type');
        let logAnalyticsWorkspace = core.getInput('log-analytics-workspace');
        let logAnalyticsWorkspaceKey = core.getInput('log-analytics-workspace-key');
        this._getDiagnostics(logAnalyticsWorkspace, logAnalyticsWorkspaceKey, logType);
        let environmentVariables = core.getInput('environment-variables');
        let secureEnvironmentVariables = core.getInput('secure-environment-variables');
        this._environmentVariables = []
        this._getEnvironmentVariables(environmentVariables, secureEnvironmentVariables);
        let gpuCount = core.getInput('gpu-count');
        let gpuSku = core.getInput('gpu-sku');
        if(gpuSku && !gpuCount) {
            throw Error("You need to specify the count of GPU Resources with the SKU!"); 
        } else {
            if(gpuCount && !gpuSku) {
                throw Error("GPU SKU is not specified for the count. Please provide the `gpu-sku` parameter");
            }
            this._gpuCount = parseInt(gpuCount);
            this._gpuSKU = (gpuSku == 'K80') ? 'K80' : ( gpuSku == 'P100' ? 'P100' : 'V100');
        }
        this._image = core.getInput('image', { required: true });
        let ipAddress = core.getInput('ip-address');
        if(ipAddress != "Public" && "Private") {
            throw Error('The Value of IP Address must be either Public or Private');
        } else {
            this._ipAddress = (ipAddress == 'Public') ? 'Public' : 'Private';
        }
        this._location = core.getInput('location', { required: true });
        this._memory = parseFloat(core.getInput('memory'));
        this._containerName = core.getInput('name', { required: true });
        let osType = core.getInput('os-type');
        if(osType != 'Linux' && 'Windows') {
            throw Error('The Value of OS Type must be either Linux or Windows only!')
        } else {
            this._osType = (osType == 'Linux') ? 'Linux' : 'Windows';
        }
        let ports = core.getInput('ports');
        this._ports = [];
        this._getPorts(ports);
        let protocol = core.getInput('protocol');
        if(protocol != "TCP" && "UDP") {
            throw Error("The Network Protocol can only be TCP or UDP");
        } else {
            this._protocol = protocol == "TCP" ? 'TCP' : 'UDP';
        }
        this._registryLoginServer = core.getInput('registry-login-server');
        if(!this._registryLoginServer) {
            // If the user doesn't give registry login server and the registry is ACR
            let imageList = this._registryLoginServer.split('/');
            if(imageList[0].indexOf('azurecr') > -1) {
                this._registryLoginServer = imageList[0];
            }
        }
        this._registryUsername = core.getInput('registry-username');
        this._registryPassword = core.getInput('registry-password');
        let restartPolicy = core.getInput('restart-policy');
        if(restartPolicy != "Always" && "OnFailure" && "Never") {
            throw Error('The Value of Restart Policy can be "Always", "OnFailure" or "Never" only!');
        } else {
            this._restartPolicy = ( restartPolicy == 'Always' ) ? 'Always' : ( restartPolicy == 'Never' ? 'Never' : 'OnFailure');
        }

        this._volumes = [];
        this._volumeMounts = [];
        let gitRepoVolumeUrl = core.getInput('gitrepo-url');
        let afsAccountName = core.getInput('azure-file-volume-account-name');
        let afsShareName = core.getInput('azure-file-volume-share-name');
        this._getVolumes(gitRepoVolumeUrl, afsShareName, afsAccountName);
    }

    private _getDiagnostics(logAnalyticsWorkspace: string, logAnalyticsWorkspaceKey: string, logType: string) {
        if(logAnalyticsWorkspace || logAnalyticsWorkspaceKey) {
            if(!logAnalyticsWorkspaceKey || !logAnalyticsWorkspace) {
                throw Error("The Log Analytics Workspace Id or Workspace Key are not provided. Please fill in the appropriate parameters.");
            }
            if(logType && (logType != 'ContainerInsights' && 'ContainerInstanceLogs')) {
                throw Error("Log Type Can be Only of Type `ContainerInsights` or `ContainerInstanceLogs`");
            }
            let logAnalytics: ContainerInstanceManagementModels.LogAnalytics = { "workspaceId": logAnalyticsWorkspace, 
                                                                                 "workspaceKey": logAnalyticsWorkspaceKey };
            if(logType) {
                let logT: ContainerInstanceManagementModels.LogAnalyticsLogType;
                logT = (logType == 'ContainerInsights') ? 'ContainerInsights' : 'ContainerInstanceLogs';
                logAnalytics.logType = logT;
            }
            this._diagnostics = { "logAnalytics": logAnalytics };
        }
    }

    private _getEnvironmentVariables(
        environmentVariables: string,
        secureEnvironmentVariables: string
    ) {
        if (environmentVariables) {
            const envPairs = parseForPairs(environmentVariables);
            envPairs.forEach((pair: string[]) => {
                let obj: ContainerInstanceManagementModels.EnvironmentVariable = {
                    name: pair[0],
                    value: pair[1],
                };
                this._environmentVariables.push(obj);
            });
        }
    
        if (secureEnvironmentVariables) {
            const securePairs = parseForPairs(secureEnvironmentVariables);
            securePairs.forEach((pair: string[]) => {
                let obj: ContainerInstanceManagementModels.EnvironmentVariable = {
                    name: pair[0],
                    secureValue: pair[1],
                };
                this._environmentVariables.push(obj);
            });
        }
    }

    private  _getPorts(ports: string) {
        let portObjArr: Array<ContainerInstanceManagementModels.Port> = [];
        ports.split(' ').forEach((portStr: string) => {
            let portInt = parseInt(portStr);
            portObjArr.push({ "port": portInt });
        });
        this._ports = portObjArr;
    }

    private _getVolumes(gitRepoVolumeUrl: string, afsShareName: string, afsAccountName: string) {
        // Checking git repo volumes
        if(gitRepoVolumeUrl) {
            let gitRepoDir = core.getInput('gitrepo-dir');
            let gitRepoMountPath = core.getInput('gitrepo-mount-path');
            let gitRepoRevision = core.getInput('gitrepo-revision');
            let vol: ContainerInstanceManagementModels.GitRepoVolume = { "repository": gitRepoVolumeUrl };
            if(!gitRepoMountPath) {
                throw Error("The Mount Path for GitHub Volume is not specified.");
            }
            if(gitRepoDir) {
                vol.directory = gitRepoDir;
            }
            if(gitRepoRevision) {
                vol.revision = gitRepoRevision;
            }
            let volMount: ContainerInstanceManagementModels.VolumeMount = { "name":"git-repo-vol", "mountPath":gitRepoMountPath };
            this._volumes.push({ "name": "git-repo-vol", gitRepo: vol });
            this._volumeMounts.push(volMount);
        }
        // Checking Azure File Share Volumes
        if(afsShareName && afsAccountName) {
            let afsMountPath = core.getInput('azure-file-volume-mount-path');
            let afsAccountKey = core.getInput('azure-file-volume-account-key');
            let afsReadOnly = core.getInput('azure-file-volume-read-only');
            if(!afsMountPath) {
                throw Error("The Mount Path for Azure File Share Volume is not specified");
            }
            let vol: ContainerInstanceManagementModels.AzureFileVolume = { "shareName": afsShareName, "storageAccountName": afsAccountName };
            if(afsAccountKey) {
                vol.storageAccountKey = afsAccountKey;
            }
            let volMount: ContainerInstanceManagementModels.VolumeMount = { "name": "azure-file-share-vol", "mountPath": afsMountPath };
            if(afsReadOnly) {
                if(afsReadOnly != "true" && "false") {
                    throw Error("The Read-Only Flag can only be `true` or `false` for the Azure File Share Volume");
                }
                vol.readOnly = (afsReadOnly == "true");
                volMount.readOnly = (afsReadOnly == "true");
            }
            this._volumes.push({ "name": "azure-file-share-vol", azureFile: vol });
            this._volumeMounts.push(volMount);
        } else if(!afsShareName && afsAccountName) {
            throw Error("The Name of the Azure File Share is required to mount it as a volume");
        } else if(!afsAccountName && afsShareName) {
            throw Error("The Storage Account Name for the Azure File Share is required to mount it as a volume");
        } else {};
    }

    public static getTaskParams(endpoint: IAuthorizer) {
        if(!this.taskparams) {
            this.taskparams = new TaskParameters(endpoint);
        }
        return this.taskparams;
    }

    public get resourceGroup() {
        return this._resourceGroup;
    }

    public get commandLine() {
        return this._commandLine;
    }

    public get cpu() {
        return this._cpu;
    }

    public get diagnostics() {
        return this._diagnostics;
    }

    public get dnsNameLabel() {
        return this._dnsNameLabel;
    }

    public get environmentVariables() {
        return this._environmentVariables;
    }

    public get gpuCount() {
        return this._gpuCount;
    }

    public get gpuSku() {
        return this._gpuSKU;
    }

    public get image() {
        return this._image;
    }

    public get ipAddress() {
        return this._ipAddress;
    }

    public get location() {
        return this._location;
    }

    public get memory() {
        return this._memory;
    }

    public get containerName() {
        return this._containerName;
    }

    public get osType() {
        return this._osType;
    }

    public get ports() {
        return this._ports;
    }

    public get protocol() {
        return this._protocol;
    }

    public get registryLoginServer() {
        return this._registryLoginServer;
    }

    public get registryUsername() {
        return this._registryUsername;
    }

    public get registryPassword() {
        return  this._registryPassword;
    }

    public get restartPolicy() {
        return this._restartPolicy;
    }

    public get volumes() {
        return this._volumes;
    }

    public get volumeMounts() {
        return this._volumeMounts;
    }

    public get subscriptionId() {
        return this._subscriptionId;
    }

}
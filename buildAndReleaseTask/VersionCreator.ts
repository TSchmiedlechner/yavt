import tl = require('azure-pipelines-task-lib/task');
import { IVersionConfig } from "./IVersionConfig";

export class VersionCreator {

    private addCiLabel: boolean;
    private splitFileVersion: boolean;
    private semverVersion: string;

    constructor(addCiLabel: boolean, semverVersion: string, splitFileVersion: boolean) {
        this.addCiLabel = addCiLabel;
        this.semverVersion = semverVersion;
        this.splitFileVersion = splitFileVersion;
    }

    public getReleaseVersion(versionConfig: IVersionConfig): string | undefined {
        const branch = tl.getVariable("Build.SourceBranch");
        if (this.isReleaseVersion(versionConfig, branch!)) {
            return this.getVersion(versionConfig);
        }
        return undefined;
    }

    public isReleaseVersion(versionConfig: IVersionConfig, branch: string): boolean {
        return versionConfig.releaseBranches && versionConfig.releaseBranches.some(x => new RegExp(x).test(branch));
    }

    public getVersion(versionConfig: IVersionConfig): string {

        const branch = tl.getVariable("Build.SourceBranch");
        const labelSeparator = this.getLabelSeparator();
        if (branch == undefined) {
            throw new Error("'Build.SourceBranch' is not set.");
        }

        if (this.isReleaseVersion(versionConfig, branch)) {
            return versionConfig.version;
        }
        else {
            const buildId = tl.getVariable("Build.BuildId");
            let separator: string;

            if (this.versionHasPostfix(versionConfig.version)) {
                separator = labelSeparator;
            }
            else {
                if (this.addCiLabel) {
                    separator = `-ci${labelSeparator}`;
                }
                else {
                    separator = "-";
                }
            }

            return `${versionConfig.version}${separator}${this.getShortYear()}${this.getDayOfYear()}${labelSeparator}${buildId}`;
        }
    }

    public getFileVersion(versionConfig: IVersionConfig): string {
        const buildId = tl.getVariable("Build.BuildId");
        let version: string;

        if (versionConfig.version.includes("-")) {
            version = versionConfig.version.substring(0, versionConfig.version.indexOf('-'));
        }
        else {
            version = versionConfig.version;
        }

        if (this.splitFileVersion) {
            const versionParts = version.split(".");
            version = `${versionParts[0]}.${versionParts[1]}`;

            const buildIdString = buildId.toString();
            const buildIdSplit = `${buildIdString.substring(0, buildIdString.length - 4)}.${buildIdString.substring(buildIdString.length - 4)}`;

            return `${version}.${buildIdSplit}`;
        } else {
            return `${version}.${buildId}`;
        }
    }

    public getAssemblyVersion(versionConfig: IVersionConfig): string {
        let version: string;

        if (versionConfig.version.includes("-")) {
            version = versionConfig.version.substring(0, versionConfig.version.indexOf('-'));
        }
        else {
            version = versionConfig.version;
        }

        return `${version}.0`;
    }


    private versionHasPostfix(version: string): boolean {

        return version.includes("-");
    }

    private getDayOfYear(): string {

        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const doy = Math.floor(diff / oneDay).toString();

        return ('000' + doy).substring(doy.length);
    }

    private getShortYear(): string {

        return new Date().getFullYear().toString().substr(-2);
    }

    private getLabelSeparator(): string {

        if (this.semverVersion === "v1") {
            return "-";
        }
        else {
            return ".";
        }
    }
}
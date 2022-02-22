import tl = require('azure-pipelines-task-lib/task');
import { IVersionConfig } from "./IVersionConfig";

export class VersionCreator {

    private addCiLabel: boolean;
    private semverVersion: string;

    constructor(addCiLabel: boolean, semverVersion: string) {
        this.addCiLabel = addCiLabel;
        this.semverVersion = semverVersion;
    }

    public getVersion(versionConfig: IVersionConfig): string {

        const branch = tl.getVariable("Build.SourceBranch");
        const labelSeparator = this.getLabelSeparator();
        if (branch == undefined) {
            throw new Error("'Build.SourceBranch' is not set.");
        }

        if (versionConfig.releaseBranches && versionConfig.releaseBranches.some(x => new RegExp(x).test(branch))) {
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

        return `${version}.${buildId}`
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
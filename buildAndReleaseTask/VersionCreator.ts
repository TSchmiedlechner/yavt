import tl = require('azure-pipelines-task-lib/task');
import { IVersionConfig } from "./IVersionConfig";

export class VersionCreator {
    public getVersion(versionConfig: IVersionConfig): string {

        const branch = tl.getVariable("Build.SourceBranch");
        if (versionConfig.releaseBranches && versionConfig.releaseBranches.some(x => branch !== undefined && new RegExp(x).test(branch))) {
            return versionConfig.version;
        }
        else {
            const buildId = tl.getVariable("Build.BuildId");
            let separator: string;

            if (this.versionHasPostfix(versionConfig.version)) {
                separator = ".";
            }
            else {
                separator = "-";
            }

            return `${versionConfig.version}${separator}${this.getShortYear()}${this.getDayOfYear()}.${buildId}`;
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
}
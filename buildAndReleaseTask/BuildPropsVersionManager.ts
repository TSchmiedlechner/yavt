import fs = require('fs');
import path = require('path');
import xml2js = require('xml2js');
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';

export class BuildPropsVersionManager {

    private versionCreator: VersionCreator;

    constructor(versionCreator: VersionCreator) {
        this.versionCreator = versionCreator;
    }

    public async updateVersionAsync(pathToPropsFile: string, versionConfig: IVersionConfig, includeParentProps: boolean): Promise<void> {

        let updatedXml: any;

        if (fs.existsSync(pathToPropsFile)) {
            const fileContent = await fs.promises.readFile(pathToPropsFile, "utf8");
            const xml = await xml2js.parseStringPromise(fileContent)

            if (xml && xml.Project) {
                updatedXml = this.updateBuildProps(xml, versionConfig);
            }
            else {
                updatedXml = this.createBuildProps(versionConfig);
            }
        }
        else {
            updatedXml = this.createBuildProps(versionConfig);
        }

        if (includeParentProps && this.parentPropsExist(pathToPropsFile)) {
            updatedXml = this.addParentImport(updatedXml);
        }

        const xmlBuilder = new xml2js.Builder({ headless: true });
        await fs.promises.writeFile(pathToPropsFile, xmlBuilder.buildObject(updatedXml));
    }

    private parentPropsExist(pathToPropsFile: string) {

        let directory = path.join(path.dirname(pathToPropsFile), "..");
        while (this.isInWorkingDirectory(directory)) {
            if (fs.existsSync(path.join(directory, "Directory.Build.props"))) {
                return true;
            }
            directory = path.join(directory, "..");
        }
        return false;
    }

    private isInWorkingDirectory(directory: string) {
        const relative = path.relative("./", directory);
        return (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) || (path.resolve(directory) === path.resolve("./"));
    }

    private addParentImport(xml: any): any {

        const node = { $: { Project: "$([MSBuild]::GetPathOfFileAbove('Directory.Build.props', '$(MSBuildThisFileDirectory)../'))" } }
        if (xml.Project.Import && xml.Project.Import.length) {
            xml.Project.Import.push(node);
        }
        else {
            xml.Project.Import = node;
        }

        return xml;
    }

    private updateBuildProps(xml: any, versionConfig: IVersionConfig): any {

        xml = JSON.parse(JSON.stringify(xml));

        const version = this.versionCreator.getVersion(versionConfig);
        const fileVersion = this.versionCreator.getFileVersion(versionConfig);

        if (xml.Project.PropertyGroup) {
            const propertyGroupWithVersion = xml.Project.PropertyGroup.filter((x: any) => x.Version);
            if (propertyGroupWithVersion && propertyGroupWithVersion.length) {
                propertyGroupWithVersion[0].Version = version;
            }
            else {
                const propertyGroup = { Version: version };
                xml.Project.PropertyGroup.push(propertyGroup);
            }

            const propertyGroupWithFileVersion = xml.Project.PropertyGroup.filter((x: any) => x.FileVersion);
            if (propertyGroupWithFileVersion && propertyGroupWithFileVersion.length) {
                propertyGroupWithFileVersion[0].FileVersion = fileVersion;
            }
            else {
                const propertyGroupFile = { FileVersion: fileVersion };
                xml.Project.PropertyGroup.push(propertyGroupFile);
            }
        }
        else {
            if (typeof xml.Project === 'string' || xml.Project instanceof String) {
                xml.Project = { PropertyGroup: { Version: version, FileVersion: fileVersion } };
            }
            else {
                xml.Project.PropertyGroup = { Version: version, FileVersion: fileVersion };
            }
        }

        return xml;
    }

    private createBuildProps(versionConfig: IVersionConfig): any {

        const version = this.versionCreator.getVersion(versionConfig);
        const fileVersion = this.versionCreator.getFileVersion(versionConfig);

        return { Project: { PropertyGroup: { Version: version, FileVersion: fileVersion } } };
    }
}
import fs = require('fs');
import xml2js = require('xml2js');
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';

export class BuildPropsVersionManager {

    private versionCreator: VersionCreator;

    constructor(versionCreator: VersionCreator) {
        this.versionCreator = versionCreator;
    }

    public async updateVersionAsync(pathToPropsFile: string, versionConfig: IVersionConfig): Promise<void> {

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

        const xmlBuilder = new xml2js.Builder({ headless: true });
        await fs.promises.writeFile(pathToPropsFile, xmlBuilder.buildObject(updatedXml));
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
                var propertyGroup = { Version: version };
                xml.Project.PropertyGroup.push(propertyGroup);
            }

            const propertyGroupWithFileVersion = xml.Project.PropertyGroup.filter((x: any) => x.FileVersion);
            if (propertyGroupWithFileVersion && propertyGroupWithFileVersion.length) {
                propertyGroupWithFileVersion[0].FileVersion = fileVersion;
            }
            else {
                var propertyGroupFile = { FileVersion: fileVersion };
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
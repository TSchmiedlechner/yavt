import fs = require('fs');
import xml2js = require('xml2js');
import glob = require('glob');
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';

export class NuspecVersionManager {

    private versionCreator: VersionCreator;

    constructor(versionCreator: VersionCreator) {
        this.versionCreator = versionCreator;
    }

    public async updateVersionsAsync(versionConfig: IVersionConfig): Promise<void> {

        let version = this.versionCreator.getVersion(versionConfig);

        glob("**/{*.nuspec,.nuspec}", {}, async (er, files) => {
            if (!files) {
                return;
            }

            for (const file of files) {
                await this.updateNuspecFileAsync(file, version)
            }
        });
    }

    private async updateNuspecFileAsync(path: string, version: string) {

        const fileContent = await fs.promises.readFile(path, "utf8");
        const xml = await xml2js.parseStringPromise(fileContent)

        xml.package.metadata[0].version = version;

        const xmlBuilder = new xml2js.Builder({ headless: true });
        await fs.promises.writeFile(path, xmlBuilder.buildObject(xml));
    }
}
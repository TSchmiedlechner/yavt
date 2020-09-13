import fs = require('fs');
import xml2js = require('xml2js');
import path = require('path');
import glob = require('glob-promise');
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';

export class NuspecVersionManager {

    private versionCreator: VersionCreator;

    constructor(versionCreator: VersionCreator) {
        this.versionCreator = versionCreator;
    }

    public async updateVersionsAsync(directory: string, versionConfig: IVersionConfig): Promise<void> {

        let version = this.versionCreator.getVersion(versionConfig);
        let files = await glob(`${directory}/**/{*.nuspec,.nuspec}`);
        if (!files) {
            return;
        }

        for (const file of files) {
            if (this.morePreciseVersionExists(directory, file)) {
                continue;
            }

            await this.updateNuspecFileAsync(file, version)
        }
    }

    private async updateNuspecFileAsync(pathToNuspec: string, version: string) {

        const fileContent = await fs.promises.readFile(pathToNuspec, "utf8");
        const xml = await xml2js.parseStringPromise(fileContent)

        xml.package.metadata[0].version = version;

        const xmlBuilder = new xml2js.Builder({ headless: true });
        await fs.promises.writeFile(pathToNuspec, xmlBuilder.buildObject(xml));
    }

    private morePreciseVersionExists(workingDirectory: string, pathToNuspecFile: string) {

        let directory = path.dirname(pathToNuspecFile);
        while (this.isChildDirectory(workingDirectory, directory)) {
            if (fs.existsSync(path.join(directory, ".nuspec"))) {
                return true;
            }
            directory = path.join(directory, "..");
        }

        return false;
    }

    private isChildDirectory(workingDirectory: string, directory: string) {
        const relative = path.relative(workingDirectory, directory);
        return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    }
}
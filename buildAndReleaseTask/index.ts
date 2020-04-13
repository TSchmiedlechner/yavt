import tl = require('azure-pipelines-task-lib/task');
import fs = require('fs');
import { BuildPropsVersionManager } from './BuildPropsVersionManager';
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';
import { NuspecVersionManager } from './NuspecVersionManager';

async function run() {
    try {

        const pathToVersionJson: string | undefined = tl.getPathInput('pathToVersionJson', true);
        const semverVersion: string | undefined = tl.getInput('semverVersion', true);
        const updateNuspecFiles: boolean = tl.getBoolInput('updateNuspecFiles', true);
        const updateBuildNumber: boolean = tl.getBoolInput('updateBuildNumber', true);
        const addCiLabel: boolean = tl.getBoolInput('addCiLabel', true);

        if (pathToVersionJson === undefined) {
            tl.setResult(tl.TaskResult.Failed, "The input 'pathToVersionJson' is required.");
            return;
        }
        
        if (semverVersion === undefined) {
            tl.setResult(tl.TaskResult.Failed, "The input 'semverVersion' is required.");
            return;
        }

        const versionContent = await fs.promises.readFile(pathToVersionJson, "utf8");
        const versionConfig: IVersionConfig = JSON.parse(versionContent);

        const versionCreator = new VersionCreator(addCiLabel, semverVersion);
        const buildPropsVersionManager = new BuildPropsVersionManager(versionCreator);

        if (updateBuildNumber) {
            tl.updateBuildNumber(versionCreator.getVersion(versionConfig));
        }

        await buildPropsVersionManager.updateVersionAsync("Directory.build.props", versionConfig);

        if (updateNuspecFiles) {
            const nuspecVersionManager = new NuspecVersionManager(versionCreator);
            await nuspecVersionManager.updateVersionsAsync(versionConfig);
        }

    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
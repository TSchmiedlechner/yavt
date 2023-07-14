import tl = require('azure-pipelines-task-lib/task');
import fs = require('fs');
import path = require('path');
import glob = require('glob-promise');
import { BuildPropsVersionManager } from './BuildPropsVersionManager';
import { IVersionConfig } from './IVersionConfig';
import { VersionCreator } from './VersionCreator';
import { NuspecVersionManager } from './NuspecVersionManager';

async function run() {

    try {
        const mode: string | undefined = tl.getInput('mode', true);
        const pathToVersionJson: string | undefined = tl.getPathInput('pathToVersionJson', true);
        const semverVersion: string | undefined = tl.getInput('semverVersion', true);
        const updateNuspecFiles: boolean = tl.getBoolInput('updateNuspecFiles', true);
        const updateBuildNumber: boolean = tl.getBoolInput('updateBuildNumber', true);
        const includeParentProps: boolean = tl.getBoolInput('includeParentProps', true);
        const addCiLabel: boolean = tl.getBoolInput('addCiLabel', true);
        const failOnTagVersionMismatch: boolean = tl.getBoolInput('failOnTagVersionMismatch', true);

        if (pathToVersionJson === undefined) {
            tl.setResult(tl.TaskResult.Failed, "The input 'pathToVersionJson' is required.");
            return;
        }
        if (mode === undefined) {
            tl.setResult(tl.TaskResult.Failed, "The input 'mode' is required.");
            return;
        }
        if (semverVersion === undefined) {
            tl.setResult(tl.TaskResult.Failed, "The input 'semverVersion' is required.");
            return;
        }

        if (mode == "Single") {
            await updateVersion("./", pathToVersionJson, semverVersion, updateNuspecFiles, updateBuildNumber, addCiLabel, includeParentProps, false, failOnTagVersionMismatch);
        }
        else {
            let files = await glob("**/version.json");
            if (!files) {
                return;
            }

            let releaseVersion;

            for (const file of files) {
                const workDir = path.dirname(file);
                const innerReleasVersion = await updateVersion(workDir, file, semverVersion, updateNuspecFiles, updateBuildNumber, addCiLabel, includeParentProps, true, failOnTagVersionMismatch);
                releaseVersion ??= innerReleasVersion;
            }

            if (updateBuildNumber && releaseVersion !== undefined) {
                tl.updateBuildNumber(releaseVersion);
            }
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

async function updateVersion(workDir: string, pathToVersionJson: string, semverVersion: string, updateNuspecFiles: boolean, updateBuildNumber: boolean, addCiLabel: boolean, includeParentProps: boolean, isMultiMode: boolean, failOnTagVersionMismatch: boolean): Promise<string | undefined> {
    const versionContent = await fs.promises.readFile(pathToVersionJson, "utf8");
    const versionConfig: IVersionConfig = JSON.parse(versionContent);

    const versionCreator = new VersionCreator(addCiLabel, semverVersion);
    const buildPropsVersionManager = new BuildPropsVersionManager(versionCreator);

    if (updateBuildNumber) {
        tl.updateBuildNumber(versionCreator.getVersion(versionConfig));
    }

    await buildPropsVersionManager.updateVersionAsync(path.join(workDir, "Directory.build.props"), versionConfig, includeParentProps);

    if (updateNuspecFiles) {
        const nuspecVersionManager = new NuspecVersionManager(versionCreator);
        await nuspecVersionManager.updateVersionsAsync(workDir, versionConfig, isMultiMode);
    }

    let releaseVersion = versionCreator.getReleaseVersion(versionConfig);

    if (releaseVersion !== undefined && failOnTagVersionMismatch) {
        const branch = tl.getVariable("Build.SourceBranch");
        if (versionCreator.isReleaseVersion(versionConfig, branch!)) {
            if (branch!.startsWith("refs/tags/") && !branch!.endsWith(releaseVersion as string)) {
                throw new Error(`The release version ${releaseVersion} does not match the tag ${branch}.`);
            }
        }
    }

    return releaseVersion;
}

run();
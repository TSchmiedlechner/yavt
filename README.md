# YAVT - Yet another versioning tool
YAVT is just another tool to apply Git versioning to .NET projects from Azure Pipelines.

## Overview
Unlike great alternatives like _Nerdbank.GitVersioning_ and _GitVersion_, which were designed to be highly configurable, YAVT is as simple as possible. It will plainly read the specified version from the given `version.json`, and apply it to all .NET projects (and optionally to `.nuspec` files) in the repository during a build.

To determine the version schema to apply, regular expressions that can be configured in the `version.json` are used. If the built path matches on of those specified there, date and build id will be added to the version's postfix.

## Samples
Given the `version.json` example below, assuming the `Build.BuildId` is 42, and it's January 1 2020, the following versions will be set:

| Branch               | Version            | File Version |
|----------------------|--------------------|--------------|
| `master`             | 1.0.0              | 1.0.0.42     |
| `tags/v1.3.0`        | 1.0.0              | 1.0.0.42     |
| `refs/pull/ 1/merge` | 1.0.0-ci.20001.42* | 1.0.0.42     |
| `dev`                | 1.0.0-20001.42     | 1.0.0.42     |

\* If the `addCiLabel` parameter is set to true.


## Installation
You can download the Azure DevOps task directly from the [marketplace](https://marketplace.visualstudio.com/items?itemName=tschmiedlechner.yavt).

## Usage
To get started, install the extension from the link above, and create a `version.json` according to the following schema:

```json
{
    "version": "1.0.0",
    "releaseBranches": [
        "^refs/heads/master$", 
        "^refs\/tags\/v\\d+\\.\\d.\\d+$" 
    ]
}
```

If you set the parameter `mode` to `Multi`, you can also specify multiple `version.json`'s that will be used for their respective folders and subfolders.

Semantic versioning, including postfixes (like `-rc1`, etc.) are supported in the version property.

Then, pull the build step into your pipeline - either via the UI editor, or with the following YAML step:

```yaml
steps:
- task: yavt@1
  inputs:
    mode: 'Single'                      // Or 'Multi'
    pathToVersionJson: 'version.json'   // Ignored when set to mode 'Multi'
    updateNuspecFiles: true
    updateBuildNumber: true
    addCiLabel: true
    failOnTagVersionMismatch: true
    splitFileVersion: true
    semverVersion: 'v2'
```

## Parameters
- **`mode`**: _Single_ will use one `version.json` file for all found projects. When set to _Multi_, a Directory.build.props file is created on the same level as each detected `version.json`. 
- **`pathToVersionJson`**: The path to the `version.json`. Ignored when set to mode 'Multi'.
- **`updateNuspecFiles`**: If set to _true_, the version will also be inserted/updated in `.nuspec` files.
- **`updateBuildNumber`**: If set to _true_, the build number in Azure DevOps is set to the computed version.
- **`addCiLabel`**: If set to _true_, the postfix label `ci` will be set for PR builds if no other label is specified. For example, creating a PR build with the specified version `1.0.0` will result in `1.0.0-ci.20045.123`. When the label is already set in `version.json`, e.g. to `1.0.0-rc1`, it will be respected and the resulting version will be  `1.0.0-rc1.20045.123`.
- **`failOnTagVersionMismatch`**: If set to _true_, fail when a release version is created, but the tag and the version don't match.
- **`splitFileVersion`**: If set to true the build number will be split up into two parts and used for the minor and patch parts of the file version. This mitigates error CS7035 on build numbers higher than 65534.
- **`semverVersion`**: If v1 is selected, labels are separated by a `-` instead of a `.` - e.g. `1.0.0-rc1-20123-42` instead of `1.0.0-rc1.20123.42`.

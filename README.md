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

Semantic versioning, including postfixes (like `-rc1`, etc.) are supported in the version property.

Then, pull the build step into your pipeline - either via the UI editor, or with the following YAML step:

```yaml
steps:
- task: yavt@1
  inputs:
    pathToVersionJson: 'version.json'
    updateNuspecFiles: true
    updateBuildNumber: true
    addCiLabel: true
```

## Parameters
- **`pathToVersionJson`**: The path to the `version.json`.
- **`updateNuspecFiles`**: If set to _true_, the version will also be inserted/updated in `.nuspec` files.
- **`updateBuildNumber`**: If set to _true_, the build number in Azure DevOps is set to the computed version.
- **`addCiLabel`**: If set to _true_, the postfix label `ci` will be set for PR builds if no other label is specified. For example, creating a PR build with the specified version `1.0.0` will result in `1.0.0-ci.20045.123`. When the label is already set in `version.json`, e.g. to `1.0.0-rc1`, it will be respected and the resulting version will be  `1.0.0-rc1.20045.123`

namespace ts {
    describe("unittests:: tsc:: persistResolutions::", () => {
        function getFs(outFile?: string) {
            return loadProjectFromFiles({
                "/src/project/src/main.ts": Utils.dedent`
                    import { something } from "./filePresent";
                    import { something as something1 } from "./filePresent";
                    import { something2 } from "./fileNotFound";`,
                "/src/project/src/anotherFileReusingResolution.ts": Utils.dedent`
                    import { something } from "./filePresent";
                    import { something2 } from "./fileNotFound";`,
                "/src/project/src/filePresent.ts": `export function something() { return 10; }`,
                "/src/project/tsconfig.json": JSON.stringify({
                    compilerOptions: {
                        module: "amd",
                        composite: true,
                        persistResolutions: true,
                        traceResolution: true,
                        outFile
                    },
                    include: ["src/**/*.ts"]
                }),
            });
        }
        verifyTscSerializedIncrementalEdits({
            scenario: "persistResolutions",
            subScenario: `saves resolution and uses it for new program`,
            fs: getFs,
            commandLineArgs: ["--p", "src/project"],
            incrementalScenarios: [
                noChangeRun,
                {
                    subScenario: "Modify main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => appendText(fs, `/src/project/src/main.ts`, `something();`),
                },
                {
                    subScenario: "Add new module and update main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => {
                        fs.writeFileSync(`/src/project/src/newFile.ts`, "export function foo() { return 20; }");
                        prependText(fs, `/src/project/src/main.ts`, `import { foo } from "./newFile";`);
                    },
                },
                {
                    subScenario: "Write file that could not be resolved",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => fs.writeFileSync(`/src/project/src/fileNotFound.ts`, "export function something2() { return 20; }"),
                    // when doing clean build, fileNotFound.ts would be resolved so the output order in outFile.js would change
                    cleanBuildDiscrepancies: () => new Map([
                        [`/src/project/tsconfig.tsbuildinfo`, CleanBuildDescrepancy.CleanFileTextDifferent]
                    ]),
                },
                {
                    subScenario: "Clean resolutions",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: noop,
                    commandLineArgs: ["--p", "src/project", "--cleanPersistedProgram"]
                },
                {
                    subScenario: "Clean resolutions again",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: noop,
                    commandLineArgs: ["--p", "src/project", "--cleanPersistedProgram"]
                },
                noChangeRun,
                {
                    subScenario: "Modify main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => appendText(fs, `/src/project/src/main.ts`, `something();`),
                },
            ],
            baselinePrograms: true,
        });

        verifyTscSerializedIncrementalEdits({
            scenario: "persistResolutions",
            subScenario: `saves resolution and uses it for new program with outFile`,
            fs: () => getFs("outFile.js"),
            commandLineArgs: ["--p", "src/project"],
            incrementalScenarios: [
                noChangeRun,
                {
                    subScenario: "Modify main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => appendText(fs, `/src/project/src/main.ts`, `something();`),
                },
                {
                    subScenario: "Add new module and update main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => {
                        fs.writeFileSync(`/src/project/src/newFile.ts`, "export function foo() { return 20; }");
                        prependText(fs, `/src/project/src/main.ts`, `import { foo } from "./newFile";`);
                    },
                },
                {
                    subScenario: "Write file that could not be resolved",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => fs.writeFileSync(`/src/project/src/fileNotFound.ts`, "export function something2() { return 20; }"),
                    // when doing clean build, fileNotFound.ts would be resolved so the output order in outFile.js would change
                    cleanBuildDiscrepancies: () => new Map([
                        ["/src/project/outFile.tsbuildinfo", CleanBuildDescrepancy.CleanFileTextDifferent],
                        ["/src/project/outFile.js", CleanBuildDescrepancy.CleanFileTextDifferent],
                        ["/src/project/outFile.d.ts", CleanBuildDescrepancy.CleanFileTextDifferent],
                        ["/src/project/outFile.tsbuildinfo.baseline.txt", CleanBuildDescrepancy.CleanFileTextDifferent]
                    ]),
                },
                {
                    subScenario: "Clean resolutions",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: noop,
                    commandLineArgs: ["--p", "src/project", "--cleanPersistedProgram"]
                },
                {
                    subScenario: "Clean resolutions again",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: noop,
                    commandLineArgs: ["--p", "src/project", "--cleanPersistedProgram"]
                },
                noChangeRun,
                {
                    subScenario: "Modify main file",
                    buildKind: BuildKind.IncrementalDtsChange,
                    modifyFs: fs => appendText(fs, `/src/project/src/main.ts`, `something();`),
                },
            ],
            baselinePrograms: true,
        });
    });
}
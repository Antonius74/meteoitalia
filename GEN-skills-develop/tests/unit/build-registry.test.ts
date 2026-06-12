import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { API_VERSION } from "../../src/domain/types.js";
import { extractPackageArchive } from "../../src/registry/archive.js";
import type { RegistryIndex } from "../../src/registry/types.js";
import { buildRegistry } from "../../scripts/build-registry.js";

describe("buildRegistry", () => {
  it("generates a flat index and package archives from package sources", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "nd-registry-build-"));

    await buildRegistry({ packagesRoot: "packages", outputRoot });

    const index = await readRegistryIndex(outputRoot);
    expect(Object.keys(index.packages)).toEqual([
      "provider/superpowers",
      "provider/workflow-stack",
      "contract/nexi-workflow-contracts",
      "contract/documentation-core",
      "variant/frontend-react",
      "variant/backend-java",
      "variant/mobile-ios",
      "variant/mobile-android",
      "utility/frontend-react-e2e-test-implementation",
      "utility/backend-service-implementation-kit",
      "utility/backend-controller-implementation-kit",
      "utility/backend-deployment-management",
      "utility/backend-jenkins-build",
      "utility/backend-jenkins-build-script",
      "utility/backend-postman-flow-tests",
      "utility/backend-run-collection",
      "utility/mobile-android-layout-inspector",
      "utility/docx",
      "utility/pdf",
      "utility/pptx",
      "utility/xlsx",
      "utility/office-kit",
      "utility/read-jira-issue",
      "utility/documentation-kit",
      "utility/documentation-design-kit",
      "utility/documentation-ubiquitous-language",
      "utility/documentation-quality-assessment",
      "utility/agents-md-refactor",
      "utility/grill-me",
      "utility/tdd",
      "utility/figma-use",
      "utility/markitdown",
      "utility/cavecrew",
      "utility/caveman",
      "utility/caveman-commit",
      "utility/caveman-compress",
      "utility/caveman-help",
      "utility/caveman-review",
      "utility/caveman-stats",
    ]);
    expect(index).toEqual({
      apiVersion: API_VERSION,
      defaults: {
        provider: "superpowers",
        contracts: ["nexi-workflow-contracts"],
      },
      packages: {
        "provider/superpowers": {
          latest: "0.1.0",
          artifact: "packages/provider-superpowers-0.1.0.tgz",
        },
        "provider/workflow-stack": {
          latest: "0.1.0",
          artifact: "packages/provider-workflow-stack-0.1.0.tgz",
        },
        "contract/nexi-workflow-contracts": {
          latest: "0.1.0",
          artifact: "packages/contract-nexi-workflow-contracts-0.1.0.tgz",
        },
        "contract/documentation-core": {
          latest: "0.1.0",
          artifact: "packages/contract-documentation-core-0.1.0.tgz",
        },
        "variant/frontend-react": {
          latest: "0.1.0",
          artifact: "packages/variant-frontend-react-0.1.0.tgz",
        },
        "variant/backend-java": {
          latest: "0.1.0",
          artifact: "packages/variant-backend-java-0.1.0.tgz",
        },
        "variant/mobile-ios": {
          latest: "0.1.0",
          artifact: "packages/variant-mobile-ios-0.1.0.tgz",
        },
        "variant/mobile-android": {
          latest: "0.1.0",
          artifact: "packages/variant-mobile-android-0.1.0.tgz",
        },
        "utility/frontend-react-e2e-test-implementation": {
          latest: "0.1.0",
          artifact: "packages/utility-frontend-react-e2e-test-implementation-0.1.0.tgz",
        },
        "utility/backend-service-implementation-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-service-implementation-kit-0.1.0.tgz",
        },
        "utility/backend-controller-implementation-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-controller-implementation-kit-0.1.0.tgz",
        },
        "utility/backend-deployment-management": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-deployment-management-0.1.0.tgz",
        },
        "utility/backend-jenkins-build": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-jenkins-build-0.1.0.tgz",
        },
        "utility/backend-jenkins-build-script": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-jenkins-build-script-0.1.0.tgz",
        },
        "utility/backend-postman-flow-tests": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-postman-flow-tests-0.1.0.tgz",
        },
        "utility/backend-run-collection": {
          latest: "0.1.0",
          artifact: "packages/utility-backend-run-collection-0.1.0.tgz",
        },
        "utility/mobile-android-layout-inspector": {
          latest: "0.1.0",
          artifact: "packages/utility-mobile-android-layout-inspector-0.1.0.tgz",
        },
        "utility/docx": {
          latest: "0.1.0",
          artifact: "packages/utility-docx-0.1.0.tgz",
        },
        "utility/pdf": {
          latest: "0.1.0",
          artifact: "packages/utility-pdf-0.1.0.tgz",
        },
        "utility/pptx": {
          latest: "0.1.0",
          artifact: "packages/utility-pptx-0.1.0.tgz",
        },
        "utility/xlsx": {
          latest: "0.1.0",
          artifact: "packages/utility-xlsx-0.1.0.tgz",
        },
        "utility/office-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-office-kit-0.1.0.tgz",
        },
        "utility/read-jira-issue": {
          latest: "0.1.0",
          artifact: "packages/utility-read-jira-issue-0.1.0.tgz",
          userInstallable: false,
        },
        "utility/documentation-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-documentation-kit-0.1.0.tgz",
        },
        "utility/documentation-design-kit": {
          latest: "0.1.0",
          artifact: "packages/utility-documentation-design-kit-0.1.0.tgz",
        },
        "utility/documentation-ubiquitous-language": {
          latest: "0.1.0",
          artifact: "packages/utility-documentation-ubiquitous-language-0.1.0.tgz",
        },
        "utility/documentation-quality-assessment": {
          latest: "0.1.0",
          artifact: "packages/utility-documentation-quality-assessment-0.1.0.tgz",
        },
        "utility/agents-md-refactor": {
          latest: "0.1.0",
          artifact: "packages/utility-agents-md-refactor-0.1.0.tgz",
        },
        "utility/grill-me": {
          latest: "0.1.0",
          artifact: "packages/utility-grill-me-0.1.0.tgz",
        },
        "utility/tdd": {
          latest: "0.1.0",
          artifact: "packages/utility-tdd-0.1.0.tgz",
        },
        "utility/figma-use": {
          latest: "0.1.0",
          artifact: "packages/utility-figma-use-0.1.0.tgz",
        },
        "utility/markitdown": {
          latest: "0.1.0",
          artifact: "packages/utility-markitdown-0.1.0.tgz",
        },
        "utility/cavecrew": {
          latest: "0.1.0",
          artifact: "packages/utility-cavecrew-0.1.0.tgz",
        },
        "utility/caveman": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-0.1.0.tgz",
        },
        "utility/caveman-commit": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-commit-0.1.0.tgz",
        },
        "utility/caveman-compress": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-compress-0.1.0.tgz",
        },
        "utility/caveman-help": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-help-0.1.0.tgz",
        },
        "utility/caveman-review": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-review-0.1.0.tgz",
        },
        "utility/caveman-stats": {
          latest: "0.1.0",
          artifact: "packages/utility-caveman-stats-0.1.0.tgz",
        },
      },
    });

    for (const entry of Object.values(index.packages)) {
      await expect(access(path.join(outputRoot, entry.artifact))).resolves.toBeUndefined();
    }
  });

  it("creates archives that extract to manifests and declared source content", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "nd-registry-build-"));

    await buildRegistry({ packagesRoot: "packages", outputRoot });

    const archivePath = path.join(outputRoot, "packages/provider-superpowers-0.1.0.tgz");
    const extractedRoot = await extractPackageArchive(archivePath);

    await expect(access(path.join(extractedRoot, "manifest.yaml"))).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/test-driven-development/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/implementer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/spec-reviewer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/subagent-driven-development/code-quality-reviewer-prompt.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(extractedRoot, "skills/using-git-worktrees/SKILL.md")),
    ).resolves.toBeUndefined();

    const workflowArchivePath = path.join(outputRoot, "packages/provider-workflow-stack-0.1.0.tgz");
    const workflowExtractedRoot = await extractPackageArchive(workflowArchivePath);
    await expect(
      access(path.join(workflowExtractedRoot, "skills/workflow-orchestration-kit/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(
        path.join(
          workflowExtractedRoot,
          "skills/workflow-core-kit/templates/skills/shared/workflow-state-template.yml",
        ),
      ),
    ).resolves.toBeUndefined();

    const frontendUtilityArchivePath = path.join(
      outputRoot,
      "packages/utility-frontend-react-e2e-test-implementation-0.1.0.tgz",
    );
    const frontendUtilityExtractedRoot = await extractPackageArchive(frontendUtilityArchivePath);
    await expect(
      access(path.join(frontendUtilityExtractedRoot, "skill/SKILL.md")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(frontendUtilityExtractedRoot, "skill/templates/scenario.template.e2e.js")),
    ).resolves.toBeUndefined();

    const backendServiceArchivePath = path.join(
      outputRoot,
      "packages/utility-backend-service-implementation-kit-0.1.0.tgz",
    );
    const backendServiceExtractedRoot = await extractPackageArchive(backendServiceArchivePath);
    await expect(
      access(
        path.join(
          backendServiceExtractedRoot,
          "skill/references/backend/service-implementation.template.md",
        ),
      ),
    ).resolves.toBeUndefined();

    const backendControllerArchivePath = path.join(
      outputRoot,
      "packages/utility-backend-controller-implementation-kit-0.1.0.tgz",
    );
    const backendControllerExtractedRoot = await extractPackageArchive(backendControllerArchivePath);
    await expect(
      access(
        path.join(
          backendControllerExtractedRoot,
          "skill/references/backend/controller-implementation.template.md",
        ),
      ),
    ).resolves.toBeUndefined();

    for (const artifact of [
      "utility-backend-deployment-management-0.1.0.tgz",
      "utility-backend-jenkins-build-0.1.0.tgz",
      "utility-backend-jenkins-build-script-0.1.0.tgz",
      "utility-backend-postman-flow-tests-0.1.0.tgz",
      "utility-backend-run-collection-0.1.0.tgz",
    ]) {
      const extractedRoot = await extractPackageArchive(path.join(outputRoot, "packages", artifact));
      await expect(access(path.join(extractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    }

    const androidInspectorArchivePath = path.join(
      outputRoot,
      "packages/utility-mobile-android-layout-inspector-0.1.0.tgz",
    );
    const androidInspectorExtractedRoot = await extractPackageArchive(androidInspectorArchivePath);
    await expect(
      access(path.join(androidInspectorExtractedRoot, "skill/scripts/capture_bundle.sh")),
    ).resolves.toBeUndefined();
    await expect(
      access(path.join(androidInspectorExtractedRoot, "skill/references/adb-layout-capture.md")),
    ).resolves.toBeUndefined();

    const officeKitArchivePath = path.join(outputRoot, "packages/utility-office-kit-0.1.0.tgz");
    const officeKitExtractedRoot = await extractPackageArchive(officeKitArchivePath);
    await expect(access(path.join(officeKitExtractedRoot, "manifest.yaml"))).resolves.toBeUndefined();
    await expect(access(path.join(officeKitExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();

    const docxArchivePath = path.join(outputRoot, "packages/utility-docx-0.1.0.tgz");
    const docxExtractedRoot = await extractPackageArchive(docxArchivePath);
    await expect(access(path.join(docxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(docxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(
      access(path.join(docxExtractedRoot, "skill/ooxml/scripts/unpack.py")),
    ).resolves.toBeUndefined();

    const pdfArchivePath = path.join(outputRoot, "packages/utility-pdf-0.1.0.tgz");
    const pdfExtractedRoot = await extractPackageArchive(pdfArchivePath);
    await expect(access(path.join(pdfExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(pdfExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(
      access(path.join(pdfExtractedRoot, "skill/scripts/fill_fillable_fields.py")),
    ).resolves.toBeUndefined();

    const pptxArchivePath = path.join(outputRoot, "packages/utility-pptx-0.1.0.tgz");
    const pptxExtractedRoot = await extractPackageArchive(pptxArchivePath);
    await expect(access(path.join(pptxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(pptxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(
      access(path.join(pptxExtractedRoot, "skill/scripts/html2pptx.js")),
    ).resolves.toBeUndefined();

    const xlsxArchivePath = path.join(outputRoot, "packages/utility-xlsx-0.1.0.tgz");
    const xlsxExtractedRoot = await extractPackageArchive(xlsxArchivePath);
    await expect(access(path.join(xlsxExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(access(path.join(xlsxExtractedRoot, "skill/LICENSE.txt"))).resolves.toBeUndefined();
    await expect(access(path.join(xlsxExtractedRoot, "skill/recalc.py"))).resolves.toBeUndefined();

    const readJiraArchivePath = path.join(outputRoot, "packages/utility-read-jira-issue-0.1.0.tgz");
    const readJiraExtractedRoot = await extractPackageArchive(readJiraArchivePath);
    await expect(access(path.join(readJiraExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();

    const markitdownArchivePath = path.join(outputRoot, "packages/utility-markitdown-0.1.0.tgz");
    const markitdownExtractedRoot = await extractPackageArchive(markitdownArchivePath);
    await expect(access(path.join(markitdownExtractedRoot, "skill/SKILL.md"))).resolves.toBeUndefined();
    await expect(
      access(path.join(markitdownExtractedRoot, "skill/scripts/convert_markitdown.py")),
    ).resolves.toBeUndefined();
  });

  it("cleans obsolete output files before rebuilding", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "nd-registry-build-"));

    await buildRegistry({ packagesRoot: "packages", outputRoot });
    await writeFile(path.join(outputRoot, "obsolete.txt"), "stale");
    await writeFile(path.join(outputRoot, "packages/obsolete.tgz"), "stale");

    await buildRegistry({ packagesRoot: "packages", outputRoot });

    await expect(access(path.join(outputRoot, "obsolete.txt"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(outputRoot, "packages/obsolete.tgz"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("generates identical archive bytes when source mtimes change", async () => {
    const sourcePath = path.join("packages", "utility", "read-jira-issue", "skill", "SKILL.md");
    const originalStat = await stat(sourcePath);
    const outputRootA = await mkdtemp(path.join(tmpdir(), "nd-registry-build-"));
    const outputRootB = await mkdtemp(path.join(tmpdir(), "nd-registry-build-"));
    const archivePath = path.join("packages", "utility-read-jira-issue-0.1.0.tgz");

    try {
      await buildRegistry({ packagesRoot: "packages", outputRoot: outputRootA });
      await utimes(sourcePath, new Date("2030-01-02T03:04:05.000Z"), new Date("2030-01-02T03:04:05.000Z"));
      await buildRegistry({ packagesRoot: "packages", outputRoot: outputRootB });

      await expect(sha256File(path.join(outputRootB, archivePath))).resolves.toBe(
        await sha256File(path.join(outputRootA, archivePath)),
      );
    } finally {
      await utimes(sourcePath, originalStat.atime, originalStat.mtime);
    }
  });
});

async function readRegistryIndex(outputRoot: string): Promise<RegistryIndex> {
  return YAML.parse(await readFile(path.join(outputRoot, "index.yaml"), "utf8")) as RegistryIndex;
}

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

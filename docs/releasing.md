# GitHub Actions and npm releases

[Back to the README](../README.md)

## Workflow overview

[`ci.yml`](../.github/workflows/ci.yml) validates pushes to `main` and pull requests,
and supports manual runs. It runs formatting, unit/component tests, demo build,
package installation checks, dependency audit, and desktop/mobile browser tests.
Successful runs provide an `npm-package` artifact containing the tested archive.

[`publish.yml`](../.github/workflows/publish.yml) runs the same validation for a
published, non-prerelease GitHub Release. Its tag must equal `v` plus the package
version. The publish job uses npm OIDC authentication and publishes the exact
archive validated by CI. PRs, ordinary pushes, and draft/prerelease releases do
not publish to npm. Account setup and the first publication are described in
the setup instructions below. These workflows have not run on GitHub yet.

## Release status

The package is MIT licensed and configured for public npm access. The public
repository is `erme2/feature-flag-evaluator`. A first local commit exists; no npm
publication or successful hosted workflow run has been verified in this work.

The private diary, correspondence, and original exercise brief are kept outside
the repository. The npm archive contains the built library, declarations,
README, Markdown guides, package metadata, and LICENSE. It contains no demo CSS.

## GitHub setup

The empty public repository has been created and `origin` is configured. After
reviewing and authorizing the local commits, push using authenticated Git:

```sh
git push -u origin main
```

If origin already exists, inspect it before changing it. The CI workflow runs
on the initial push and future pushes to main/PRs. It also supports manual runs.
Wait for CI to pass before publishing a version. A successful run exposes the
`npm-package` artifact, containing the installable `.tgz` archive.

The GitHub connector confirms repository access. Local Git over SSH returned
`Permission denied (publickey)`; Git authentication must be configured before
pushing this local history. No files have been pushed from this session.

## First npm publication

The `@erme2` scope requires an npm user or organization with that name and your
permission to publish within it. Local npm is not currently authenticated.
Complete npm login and any required account/2FA steps yourself; do not place
credentials in project files or chat.

For a new package, first publish the validated initial version with your npm
account so its package settings are available for trusted publisher setup:

```sh
npm login
npm ci
npm run format:check
npm test
npm run build:demo
npm run test:browser
npm run test:package
npm audit
npm publish artifacts/erme2-feature-flag-evaluator-0.1.0.tgz --access public --ignore-scripts
```

The last command makes version 0.1.0 public. Run it only when the license,
repository, package contents, and validation are ready. If a version is already
published, do not republish it: npm name/version combinations are immutable.
Confirm the result with:

```sh
npm view @erme2/feature-flag-evaluator version
```

## Configure trusted publishing

In the npm package settings, add a GitHub Actions trusted publisher with:

| Setting                  | Value                                                 |
| ------------------------ | ----------------------------------------------------- |
| GitHub organization/user | `erme2`                                               |
| Repository               | `feature-flag-evaluator`                              |
| Workflow filename        | `publish.yml`                                         |
| Environment              | Leave empty; the workflow does not use an environment |
| Allowed action           | Enable direct `npm publish`                           |

The publish job uses GitHub-hosted Ubuntu, Node 24, npm 11.19.0, and
`id-token: write`. It does not require an `NPM_TOKEN` secret. OIDC authenticates
the selected workflow, while npm generates provenance for the public package
from the public repository. The repository URL in package.json must match.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for the
provider configuration and [npm publishing](https://docs.npmjs.com/cli/v11/commands/npm-publish/)
for version and access behavior. The first account-authenticated publish and
subsequent OIDC release publish are separate setup steps.

## Subsequent releases

1. Update package.json and package-lock.json to a new stable version, for example
   with `npm version patch --no-git-tag-version`. Review and commit the changes.
2. Push to main and wait for CI to pass.
3. Create a GitHub Release targeting that commit with tag `v<version>`, such as
   `v0.1.1`. Publish it as a normal release. Drafts and prereleases do not publish
   npm versions through this workflow.
4. `publish.yml` reruns CI against the release commit, checks the tag against
   package.json, and publishes the same archive that passed package tests.
5. Confirm the workflow result and registry version, then install the published
   package in a consuming project.

The CI job has read-only repository permissions. The separate publish job gets
OIDC permission and downloads the tested artifact without installing project
dependencies or rerunning package lifecycle scripts. The workflow prevents two
publishing jobs from running simultaneously. It never publishes on a PR or
ordinary push.

Do not create a publishing GitHub Release for 0.1.0 after the manual bootstrap
publication; that would attempt to publish the same immutable version again.
Start automated publication at the next version.

## Local verification

`npm run test:package` builds/typechecks, packs, installs into temporary React 18
and 19 hosts, checks TypeScript imports and production bundling, and tests an
unstyled editor and callback in Chrome. It leaves the tested archive under
`artifacts/` and removes the temporary hosts. A registry connection and installed
Google Chrome are required. Playwright's normal demo tests start the server
automatically and save screenshots under `test-results/`.

A local test pass does not verify GitHub runner execution, npm ownership, OIDC
configuration, or publication. Record those outcomes only after they succeed.

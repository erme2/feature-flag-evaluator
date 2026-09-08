# GitHub Actions and npm releases

[Back to the README](../README.md)

## Workflow overview

[`ci.yml`](../.github/workflows/ci.yml) validates pushes to `main` and pull requests,
and supports manual runs. It runs formatting, unit/component tests, demo build,
package installation checks, dependency audit, and desktop/mobile browser tests.
Successful runs provide an `npm-package` artifact containing the tested archive.

[`publish.yml`](../.github/workflows/publish.yml) runs after a non-initial push to
`main`. It increments the patch version, validates and packs that version, commits
the package metadata, creates a matching `vX.Y.Z` tag, pushes both, and publishes
the tested archive through npm OIDC authentication. The workflow skips its own
release commit to prevent a version-bump loop. Account setup and the first
publication are described in the setup instructions below.

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

1. Make the intended source or documentation change on a branch.
2. Open and merge a pull request into `main` after CI passes.
3. The merge push runs `publish.yml`, which increments the patch version, reruns
   validation, commits the new package metadata, creates the matching tag, and
   publishes the tested archive.
4. Confirm the workflow result and registry version, then install the published
   package in a consuming project.

The release job gets repository write permission to commit the version bump and
push the tag, plus OIDC permission for npm. It validates the bumped version before
packing and publishing. The workflow prevents two publishing jobs from running
simultaneously and skips the initial push and its own release commit.

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

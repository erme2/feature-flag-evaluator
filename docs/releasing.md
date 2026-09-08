# GitHub Actions and GitHub Packages releases

[Back to the README](../README.md)

## Workflow overview

[`ci.yml`](../.github/workflows/ci.yml) validates pushes to `main` and pull requests,
and supports manual runs. It runs formatting, unit/component tests, demo build,
package installation checks, dependency audit, and desktop/mobile browser tests.
Successful runs provide an `npm-package` artifact containing the tested archive.

[`publish.yml`](../.github/workflows/publish.yml) runs after a non-initial push to
`main`. It increments the patch version, validates and packs that version, commits
the package metadata, creates a matching `vX.Y.Z` tag, pushes both, and publishes
the tested archive to GitHub Packages using the repository's `GITHUB_TOKEN`. The
workflow skips its own release commit to prevent a version-bump loop.

## Release status

The package is MIT licensed and configured for GitHub Packages access. The public
repository is `erme2/feature-flag-evaluator`. A first local commit exists; no npm
publication or successful hosted workflow run has been verified in this work.

The private diary, correspondence, and original exercise brief are kept outside
the repository. The package archive contains the built library, declarations,
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

## GitHub Packages setup

The package is published under the `erme2` GitHub owner. The workflow uses the
repository's built-in `GITHUB_TOKEN`, so no npm account or npm token is required.
In the repository's **Settings → Actions → General**, ensure GitHub Actions may
write packages.

For a manual bootstrap, publish a validated archive with a GitHub token that has
`write:packages`:

```sh
npm ci
npm run format:check
npm test
npm run build:demo
npm run test:browser
npm run test:package
npm audit
npm publish ./erme2-feature-flag-evaluator-0.1.0.tgz --access public --ignore-scripts --registry=https://npm.pkg.github.com
```

The package appears under the repository's **Packages** tab. Set its visibility
to **Public** there so all GitHub users can install it.

```sh

```

Consumers need a GitHub token with `read:packages` and this npm configuration:

```ini
@erme2:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

## Subsequent releases

1. Make the intended source or documentation change on a branch.
2. Open and merge a pull request into `main` after CI passes.
3. The merge push runs `publish.yml`, which increments the patch version, reruns
   validation, commits the new package metadata, creates the matching tag, and
   publishes the tested archive.
4. Confirm the workflow result and package version, then install the published
   package in a consuming project.

The release job gets repository write permission to commit the version bump and
push the tag, plus package write permission for GitHub Packages. It validates the
bumped version before packing and publishing. The workflow prevents two
publishing jobs from running simultaneously and skips the initial push and its
own release commit.

## Local verification

`npm run test:package` builds/typechecks, packs, installs into temporary React 18
and 19 hosts, checks TypeScript imports and production bundling, and tests an
unstyled editor and callback in Chrome. It leaves the tested archive under
`artifacts/` and removes the temporary hosts. A registry connection and installed
Google Chrome are required. Playwright's normal demo tests start the server
automatically and save screenshots under `test-results/`.

A local test pass does not verify GitHub runner execution, package visibility,
GitHub token permissions, or publication. Record those outcomes only after they
succeed.

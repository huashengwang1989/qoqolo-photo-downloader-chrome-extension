# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased]

### Fixed

- Image URLs: .big.jpg images are not the ones with best resolution available. Change to those with best resolution.

- Fixed the `maxCount`, which blocks the crawling for certain date range, as it did not take account into the date range selected.

- Minor lint and prettier fixes.

## [1.0.1] - 2025-12-18

### Added

- (For developer) License, release script, changelog

### Changed

- Improved crawling experience for Portfolio and Class Activity, especially for infinite scroll more items determination.

## [1.0.0] - 2025-01-17

### Added

- Photo crawl and export for Portfolio activities.
- Photo crawl and export for Class activities.
- Photo crawl and export for Recent Sign-in sign-outs.

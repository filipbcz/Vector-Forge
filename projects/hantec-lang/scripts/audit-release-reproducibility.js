#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bundlesRoot = path.join(root, 'release', 'bundles');

function die(message) {
  console.error(`[repro-audit] ERROR: ${message}`);
  process.exit(1);
}

function extractTimestampStamp(bundleName) {
  const match = bundleName.match(/(\d{8}T\d{6}Z)$/);
  return match ? match[1] : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listBundles(version, channel) {
  if (!fs.existsSync(bundlesRoot)) return [];
  const prefix = `${channel}-${version}-`;
  const exactBundleName = new RegExp(`^${escapeRegex(prefix)}\\d{8}T\\d{6}Z$`);
  return fs.readdirSync(bundlesRoot)
    .filter((name) => exactBundleName.test(name))
    .map((name) => ({
      name,
      stamp: name.slice(prefix.length),
      timestamp: extractTimestampStamp(name),
      dir: path.join(bundlesRoot, name)
    }))
    .sort((a, b) => {
      if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp);
      }
      return a.name.localeCompare(b.name);
    });
}

function parseChecksums(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const map = new Map();
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (!match) {
      die(`invalid checksum line in ${filePath}: ${line}`);
    }
    map.set(match[2], match[1].toLowerCase());
  }
  return map;
}

function diffChecksums(prevMap, nextMap) {
  const changes = [];
  const keys = new Set([...prevMap.keys(), ...nextMap.keys()]);
  for (const key of Array.from(keys).sort()) {
    const prev = prevMap.get(key);
    const next = nextMap.get(key);
    if (!prev) {
      changes.push({ type: 'added', file: key, next });
    } else if (!next) {
      changes.push({ type: 'removed', file: key, prev });
    } else if (prev !== next) {
      changes.push({ type: 'changed', file: key, prev, next });
    }
  }
  return changes;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function summaryLine(change) {
  if (change.type === 'changed') return `${change.file}: ${change.prev.slice(0, 12)} -> ${change.next.slice(0, 12)}`;
  if (change.type === 'added') return `${change.file}: added ${change.next.slice(0, 12)}`;
  return `${change.file}: removed ${change.prev.slice(0, 12)}`;
}

const pkgVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const version = process.argv[2] || pkgVersion;
const channel = process.argv[3] || process.env.RELEASE_CHANNEL || (version.includes('-rc') ? 'rc' : 'ga');
const bundles = listBundles(version, channel);
if (bundles.length < 2) {
  die(`need at least two bundles for ${channel} version ${version}, found ${bundles.length}`);
}

const prev = bundles[bundles.length - 2];
const next = bundles[bundles.length - 1];
const prevChecksumsPath = path.join(prev.dir, 'checksums.sha256');
const nextChecksumsPath = path.join(next.dir, 'checksums.sha256');
if (!fs.existsSync(prevChecksumsPath)) die(`missing checksums in previous bundle: ${prevChecksumsPath}`);
if (!fs.existsSync(nextChecksumsPath)) die(`missing checksums in current bundle: ${nextChecksumsPath}`);

const prevMap = parseChecksums(prevChecksumsPath);
const nextMap = parseChecksums(nextChecksumsPath);
const changes = diffChecksums(prevMap, nextMap);

const strictFiles = new Set(['release/linux/bin/mulda']);
const allowedNondeterministicFiles = new Set(['release/windows/bin/mulda.exe', 'release/manifest.json', 'release/manifest.source.json']);
const strictChanges = changes.filter((c) => strictFiles.has(c.file));
const informationalChanges = changes.filter((c) => !strictFiles.has(c.file));

const prevManifest = readJson(path.join(prev.dir, 'manifest.json'));
const nextManifest = readJson(path.join(next.dir, 'manifest.json'));
if (prevManifest.version !== nextManifest.version) {
  die(`bundle version mismatch in compared pair: ${prevManifest.version} vs ${nextManifest.version}`);
}

console.log(`[repro-audit] comparing bundles:`);
console.log(`[repro-audit]   prev: ${prev.name}`);
console.log(`[repro-audit]   next: ${next.name}`);

if (strictChanges.length > 0) {
  console.error('[repro-audit] BLOCKER: reproducibility drift in strict artifacts:');
  for (const change of strictChanges) {
    console.error(`[repro-audit]   - ${summaryLine(change)}`);
  }
  process.exit(2);
}

if (informationalChanges.length > 0) {
  const unexpected = informationalChanges.filter((c) => !allowedNondeterministicFiles.has(c.file));
  if (unexpected.length > 0) {
    console.error('[repro-audit] BLOCKER: unexpected drift in non-whitelisted files:');
    for (const change of unexpected) {
      console.error(`[repro-audit]   - ${summaryLine(change)}`);
    }
    process.exit(3);
  }

  console.log('[repro-audit] note: allowed non-deterministic drift detected (manifest timestamps and/or PE timestamp):');
  for (const change of informationalChanges) {
    console.log(`[repro-audit]   - ${summaryLine(change)}`);
  }
}

console.log('[repro-audit] PASS: strict artifact checksums are stable between successive bundles');

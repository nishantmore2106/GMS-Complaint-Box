const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Handle Windows MAX_PATH and OOM issues by excluding heavyweight folders
let blockList = [
//   /.*\/node_modules\/.*\/node_modules\/.*/, // Removed as it blocks pnpm's virtual store
  /.*\.git\/.*/,
  /.*\.agents\/.*/,
  /.*\.local\/.*/,
  /.*\/android\/src\/.*/,
  /.*\/ios\/Pods\/.*/,
];

try {
  const exclusionList = require("metro-config/src/defaults/exclusionList");
  config.resolver.blockList = exclusionList(blockList);
} catch (e) {
  config.resolver.blockList = blockList;
}

// Enable pnpm symlink support
config.resolver.unstable_enableSymlinks = true;

// Add watch folders and node module paths for workspace support
// Restrict watch folders to only necessary locations
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(projectRoot, "../../lib/api-client-react"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force single worker and limit memory usage
config.transformer.maxWorkers = 1;
config.maxWorkers = 1;

module.exports = config;

const fs = require('fs');
const path = require('path');

const BdWrapperPlugin = require('./BdWrapperPlugin');

function getBdDataPath() {
	const dataPath = process.env.APPDATA || process.env.XDG_CONFIG_HOME || (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support` : `${process.env.HOME}/.config`);
	return path.join(dataPath, 'BetterDiscord');
}

function findPlugins() {
	const PLUGINS_PATH = path.resolve('./src');
	const plugins = [];

	for (const dirent of fs.readdirSync(PLUGINS_PATH, { withFileTypes: true })) {
		const pluginPath = path.join(PLUGINS_PATH, dirent.name);
		const manifestPath = path.join(pluginPath, 'manifest.json');

		if (!dirent.isDirectory() || !fs.existsSync(manifestPath)) continue;

		plugins.push({
			folder: dirent.name,
			path: pluginPath,
			manifest: require(manifestPath),
		});
	}

	return plugins;
}

module.exports = (env, argv) => {
	const isDevelopment = argv.mode === 'development';
	const isProduction = argv.mode === 'production';

	const plugins = findPlugins();

	return {
		target: 'node',
		entry: Object.fromEntries(plugins.map((plugin) => [plugin.folder, plugin.path])),
		output: {
			filename: isDevelopment ? '[name].plugin.js' : '[name]/[name].plugin.js',
			path: isDevelopment ? path.join(getBdDataPath(), 'plugins') : path.resolve(__dirname, '..', 'dist'),
			clean: isProduction,
			library: {
				type: 'var',
				name: 'plugin',
				export: 'default',
			},
		},
		resolve: {
			extensions: ['.js'],
		},
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: ['raw-loader'], // Send raw styles to be managed with PluginUtilities
				},
			],
		},
		plugins: [
			...plugins.map((plugin) => {
				return new BdWrapperPlugin({
					entryName: plugin.folder,
					manifest: plugin.manifest,
				});
			}),
		].filter(Boolean),
		externals: {
			request: 'commonjs2 request',
			'@bandagedbd/bdapi': 'assign {BdApi: global.BdApi}',
			'@zlibrary/api': 'assign BoundedLibrary',
			'@zlibrary/plugin': 'assign Plugin',
		},
		optimization: {
			minimize: false,
		},
	};
};

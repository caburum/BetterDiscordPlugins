{{metaComment}}

const fs = require('fs');
const path = require('path');
const request = require('request');
const electron = require('electron');

const config = {{serializedConfig}};

function buildPlugin() {
	const [Plugin, BoundedLibrary] = global.ZeresPluginLibrary.buildPlugin(config);
	{{code}}

	return plugin;
}

module.exports = global.ZeresPluginLibrary
	? buildPlugin()
	: class {
			constructor() {
				this._config = config;
			}

			getName() {
				return config.info.name;
			}

			getAuthor() {
				return config.info.authors.map((a) => a.name).join(', ');
			}

			getDescription() {
				return config.info.description;
			}

			getVersion() {
				return config.info.version;
			}

			load() {
				global.BdApi.showConfirmationModal('Library plugin is needed', `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
					confirmText: 'Download',
					cancelText: 'Cancel',
					onConfirm() {
						request.get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', (error, response, body) => {
							if (error) {
								return electron.shell.openExternal('https://betterdiscord.app/Download?id=9');
							}

							fs.writeFileSync(path.join(global.BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body);
						});
					},
				});
			}

			start() {}

			stop() {}
	  };
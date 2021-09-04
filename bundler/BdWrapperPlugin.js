/**
 * Copyright (c) 2021 Jaime Filho
 * https://github.com/jaimeadf/BetterDiscordPlugins/blob/release/config/BdWrapperPlugin.js
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const fs = require('fs');
const path = require('path');

const { ConcatSource } = require('webpack-sources');
const { Compilation } = require('webpack');

const { render } = require('template-file');

const template = fs.readFileSync(path.resolve(__dirname, 'templates', 'plugin.template.js')).toString();

class BdMeta {
	constructor() {
		this.properties = new Map();
	}

	set(name, value) {
		if (value === undefined) return;
		this.properties.set(name, value);
	}

	remove(name) {
		this.properties.delete(name);
	}

	toString() {
		let result = '/**\n';

		for (const [name, value] of this.properties) {
			result += ` * @${name} ${value}\n`;
		}

		result += ' **/';

		return result;
	}
}

class BdWrapperPlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.thisCompilation.tap('BdWrapperPlugin', (compilation) => {
			const wrapFile = (file) => {
				compilation.updateAsset(
					file,
					(old) =>
						new ConcatSource(
							render(template, {
								metaComment: this.buildMeta().toString(),
								serializedConfig: JSON.stringify(this.buildConfig()),
								code: old.buffer().toString(),
							})
						)
				);
			};

			compilation.hooks.processAssets.tap(
				{
					name: 'BdWrapperPlugin',
					stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
				},
				() => {
					for (const chunk of compilation.chunks) {
						if (!chunk.canBeInitial() || chunk.name !== this.options.entryName) continue;

						for (const file of chunk.files) {
							wrapFile(file);
						}
					}
				}
			);
		});
	}

	buildMeta() {
		const { manifest } = this.options;
		const meta = new BdMeta();

		meta.set('name', manifest.name);
		meta.set('description', manifest.description);
		meta.set('version', manifest.version);
		meta.set('author', manifest.author?.name);
		meta.set('authorId', manifest.author?.id);
		meta.set('authorLink', manifest.author?.link);
		meta.set('invite', manifest.invite);
		meta.set('website', manifest.website);
		meta.set('source', manifest.source);
		meta.set('updateUrl', manifest.updateUrl);

		return meta;
	}

	buildConfig() {
		const { manifest } = this.options;

		return {
			info: {
				name: manifest.name,
				description: manifest.description,
				version: manifest.version,
				authors: [
					{
						name: manifest.author.name,
						discord_id: manifest.author.id,
					},
				],
				github: manifest.source,
				github_raw: manifest.updateUrl,
			},
			changelog: manifest.changelog,
		};
	}
}

module.exports = BdWrapperPlugin;

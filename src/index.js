import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocompletePrompt);

import chalk from 'chalk';
import ow from 'ow';
import pb from '@splash-cli/print-block';
import execa from 'execa';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import ms from 'ms';

import Ora from 'ora';
import Listr from 'listr';
import Conf from 'conf';


import {
	checkCask,
	checkHomeBrew,
	checkCaskList,
	getInstalledApps,
	exec
} from './utils'

const spinner = new Ora();
const config = new Conf({
	defaults: {
		apps: [],
		'update-delay': 1000 * 60 * 60 * 24
	}
});

const isInstalled = app => require('fs').existsSync(`/Applications/${app}.app`);

export default async (cmd, query, flags, cli) => {
	const tasks = new Listr([{
		title: 'Checking homebrew installation...',
		task: ctx => {
			exec('brew', ['--version']).catch(() => {
				ctx.hasBrew = false

				pb('Error: Homebrew not installed!')

				process.exit();
			})

			ctx.hasBrew = true;
		}
	}, {
		title: 'Checking cask installation...',
		enabled: ctx => ctx.hasBrew,
		task: ctx => {
			exec('brew', ['cask', '--version']).catch(() => {
				ctx.hasCask = false

				pb('Error: Cask not installed!')

				process.exit();
			})

			ctx.hasCask = true;
		}
	}])

	let casks = config.get('apps');

	console.clear();
	console.log();

	await checkCaskList();

	switch (cmd) {
		case "install":
			spinner.start('Loading cask apps...')
			casks = config.get('apps');
			spinner.succeed();

			if (!casks.length) {
				return pb(chalk.red('ERROR') + ': No cask apps found!')
			}

			pb('');

			const {
				cask
			} = await inquirer.prompt([{
				name: 'cask',
				message: 'Select an app to install:',
				type: 'autocomplete',
				source(answers, input) {
					input = input || query || '';
					return new Promise(function (resolve) {
						resolve(fuzzy.filter(input, casks, {
							extract: e => e.appName
						}).map(e => e.original.appName))
					});
				}
			}])

			if (isInstalled(cask) && !flags.force) {
				pb(chalk `{red {bold ERROR:}} "${cask}" is already installed!`, chalk `{dim Re run install with {green --force} to re-install!}`);
				return execa('open', [`/Applications/${cask}.app`, '--reveal'])
			} else if (isInstalled(cask) && flags.force) {
				tasks.add([{
					title: 'RE-Installing ' + cask,
					task: ctx => exec('brew', ['cask', 'reinstall', cask])
						.catch(e => {
							throw e
						})
				}])
			} else {
				tasks.add([{
					title: 'Installing ' + cask,
					task: ctx => exec('brew', ['cask', 'install', cask])
						.catch(e => {
							throw e
						})
				}])
			}

			await tasks.run()
			break;
		case "remove":
			spinner.start('Loading local cask apps...')
			casks = await getInstalledApps()
			spinner.succeed();

			if (!casks.length) {
				return pb(chalk.red('ERROR') + ': No local cask apps installed!')
			}

			pb('');

			const {
				cask: caskToRemove
			} = await inquirer.prompt([{
				name: 'cask',
				message: 'Select an app to remove:',
				type: 'autocomplete',
				when: a => casks.length > 15,
				source(answers, input) {
					input = input || query || '';

					return new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve(fuzzy.filter(input, casks).map(el => el.original))
						}, _.random(30, 500))
					});
				}
			}, {
				name: 'cask',
				message: 'Select an app to remove:',
				type: 'list',
				when: a => casks.length <= 15,
				choices: casks
			}])

			tasks.add([{
				title: 'Removing ' + caskToRemove,
				task: ctx => exec('brew', ['cask', 'remove', caskToRemove])
					.catch(e => {
						throw e
					})
			}])

			await tasks.run()
			break;
		default:
			if (flags.update) {
				await checkCaskList(true);
			} else if (flags.info) {
				const {
					cask: csk
				} = await inquirer.prompt([{
					name: 'cask',
					message: 'Select an app to install:',
					type: 'autocomplete',
					source(answers, input) {
						input = input || flags.info || '';
						return new Promise(function (resolve) {
							resolve(fuzzy.filter(input, casks, {
								extract: e => e.appName
							}).map(e => e.original.appName))
						});
					}
				}])

				pb(config.get('apps').filter(app => app.appName === csk).pop())
			} else if (flags.setDelay) {
				if (isNaN(Number(flags.setDelay))) {
					config.set('update-delay', eval(flags.setDelay))
					return pb(chalk `Delay updated to: ${ms(eval(flags.setDelay))}`)
				}

				config.set('update-delay', flags.setDelay)
				return pb(chalk `Delay updated to: ${ms(flags.setDelay)}`)
			} else if (flags.getSettings) {
				const settings = config.get()

				settings.apps = settings.apps.length;

				pb(settings)
			} else {
				cli.showHelp()
			}

			break;
	}
}
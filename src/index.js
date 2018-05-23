// TODO: Cleanup the code

import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocompletePrompt);

import chalk from 'chalk';
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
		delay: 1000 * 60 * 60 * 24
	}
});

const isInstalled = app => require('fs').existsSync(`/Applications/${app}.app`);

export default async (cmd, query, flags, cli) => {
	const tasks = new Listr([{
		title: 'Checking homebrew installation...',
		task: ctx => {
			exec('brew', ['--version']).catch(() => {
				ctx.hasBrew = false

				pb(
					chalk `{yellow Cask} not found.`,
					chalk `{dim Install via:}`,
					chalk `{dim {underline {green $} ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)"
					{green $} brew tap phinze/homebrew-cask
					{green $} brew install brew-cask}}`
				)

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

				pb(
					chalk `{yellow Homebrew} not found.`,
					chalk `{dim Install via:}`,
					chalk `{dim {underline /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)}}"}`
				);

				process.exit();
			})

			ctx.hasCask = true;
		}
	}])

	let casks = config.get('apps')

	console.clear();
	console.log();

	await checkCaskList();

	// TODO: Improve this switch
	switch (cmd) {
		case "install":
			spinner.start('Loading cask apps...')
			casks = config.get('apps').map(cask => {
				cask.title = cask.appName

				if (isInstalled(cask.appName)) {
					cask.title = chalk `{magenta ${cask.title}} {dim (installed)}`
				}

				return cask;
			});
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
						}).map(e => e.original.title))
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
			if (flags.forceUpdate) {
				await checkCaskList(true);
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

				pb('Settings:')
				Object.keys(settings).map(key => {
					let setting = settings[key];

					switch (key) {
						case 'apps':
							console.log(chalk `  {yellow Apps Index}: ${setting}`)
							break;
						case 'last-update':
							let d = new Date(setting);

							console.log(chalk `  {yellow ${key.split('-').map(item => item.charAt(0).toUpperCase() + item.substr(1,item.length-1)).join(' ')}}: ${d.toString()}`)
							break;
						default:
							console.log(chalk `  {yellow ${key.split('-').map(item => item.charAt(0).toUpperCase() + item.substr(1,item.length-1)).join(' ')}}: ${setting}`)
							break;
					}
				})
				console.log(chalk `  {dim -----------}`);
				console.log(chalk `  {yellow Config Path}: {underline ${config.path}}`);
			} else {
				cli.showHelp()
			}

			break;
	}
}
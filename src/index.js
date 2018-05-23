import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocompletePrompt);

import chalk from 'chalk';
import ow from 'ow';
import pb from '@splash-cli/print-block';
import execa from 'execa';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import Ora from 'ora';

import { checkCask, checkHomeBrew, getAppsList, getInstalledApps } from './utils'

const spinner = new Ora();

export default async (query, flags) => {
	try {
		spinner.start('Loading casks list...')

		const source = await getAppsList();

		spinner.stop();
		pb('')

		const { cask } = await inquirer.prompt([{
			type: 'autocomplete',
			name: 'cask',
			message: 'Search for casks:',
			when: a => source.length > 0,
			source(answers, input) {
				input = input || query|| '';
				return new Promise(function(resolve) {
					setTimeout(function() {
						resolve(fuzzy.filter(input, source, { extract: e => e.appName }).map(e => e.original.appName))
					}, _.random(30, 500));
				});
			}	
		}])

		if (cask) {
			try {
				spinner.start(chalk`Installing {yellow {bold ${cask}}}...`)

				let { stdout } = await execa('brew', ['cask', 'install', cask])

				spinner.succeed(chalk`{yellow {bold ${cask}}} installed!`)
			} catch (error) {
				throw error;
			}
		} else {
			console.log('Hello World', cask);
		}
	} catch (error) {
		throw error;
	}
}


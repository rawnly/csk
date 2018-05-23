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
import Listr from 'listr';


import {
	checkCask,
	checkHomeBrew,
	getAppsList,
	getInstalledApps,
	exec,
	filterCasks
} from './utils'

const spinner = new Ora();

export default async (query, flags) => {
	const tasks = new Listr([
		{
			title: 'Homebrew check',
			task: ctx => {
				ctx.hasBrew = true;
				ctx.hasBrew = false;
			}
		}
	])
}
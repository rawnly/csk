require('any-observable/register/rxjs-all'); // eslint-disable-line import/no-unassigned-import

import got from 'got';
import execa from 'execa';
import pb from '@splash-cli/print-block';
import chalk from 'chalk';
import Observable from 'any-observable';
import streamToObservable from 'stream-to-observable';
import fuzzy from 'fuzzy';
import split from 'split';
import _ from 'lodash';
import Conf from 'conf';
import Ora from 'ora';
import ow from 'ow';

const config = new Conf();
const spinner = new Ora({
	spinner: 'growVertical'
});

export async function checkCaskList(force = false) {
	ow(force, ow.boolean);

	let diff = config.get('delay');
	const last_check = config.get('last-update') || diff;

	if ((Date.now() - last_check) >= diff || force === true) {
		let s = Date.now();
		spinner.color = 'green';
		spinner.start(chalk `{green Updating apps list...}`);

		const apps = await getAppsList();

		config.set({
			apps,
			'last-update': Date.now()
		});

		let e = Date.now();
		spinner.succeed(chalk `{green List updated!} {bold {dim Took ${(e-s)/1000}s}}`)
		return true;
	}

	return false;
}

export function exec(cmd, args) {
	ow(cmd, ow.string);
	ow(args, ow.array);

	// Use `Observable` support if merged https://github.com/sindresorhus/execa/pull/26
	const cp = execa(cmd, args);

	return Observable.merge(
		streamToObservable(cp.stdout.pipe(split()), {
			await: cp
		}),
		streamToObservable(cp.stderr.pipe(split()), {
			await: cp
		})
	).filter(Boolean);
};


export const getAppsList = async (exclude = [], options = {
	client_id: 'f021bc212e0b3345936c',
	client_secret: 'f55cb9ab2f7de2f90ed60141c18b7105b1fa5f3b'
}) => {
	try {
		const {
			body: commits
		} = await  got(`https://api.github.com/repos/caskroom/homebrew-cask/commits?per_page=1&client_id=${options.client_id}&client_secret=${options.client_secret}`)
		const {
			body: casksList
		} = await got(`https://api.github.com/repos/caskroom/homebrew-cask/git/trees/${JSON.parse(commits)[0].sha}?recursive=1&client_id=${options.client_id}&client_secret=${options.client_secret}`);

		const {
			tree
		} = JSON.parse(casksList)
		let casks = tree
			.filter(el => /^Casks\/.+\.rb/.test(el.path))
			.map((el, i) => ({
				id: i,
				caskName: /^Casks\/(.+).rb/.exec(el.path)[1],
				appName: /^Casks\/(.+).rb/.exec(el.path)[1],
				entryName: /^Casks\/(.+).rb/.exec(el.path)[1].replace(/[^A-Za-z0-9]/g, ""),
				caskUrl: el.url
			}))

		if (exclude.length) {
			casks = casks.filter(cask => {
				return !(cask.appName in exclude)
			})
		}

		return casks;
	} catch (error) {
		return console.error(error);
	}
}

export async function getInstalledApps() {
	return new Promise((resolve, reject) => {
		execa('brew', ['cask', 'list']).then(({
				stdout
			}) => {
				resolve(stdout.split('\n').filter(item => item.trim().length > 0))
			})
			.catch(reject)
	});
}
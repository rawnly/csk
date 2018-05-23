import got from 'got';
import execa from 'execa';
import pb from '@splash-cli/print-block';
import chalk from 'chalk';

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
				resolve(stdout.split('\n'))
			})
			.catch(reject)
	});
}

export async function checkCask() {
	return new Promise((resolve, reject) => {
		execa('brew', ['cask', '--version'])
		.then(({ stdout: out }) => 	pb(chalk `{yellow Homebrew}: ${out.match(/^homebrew (\d+\.\d+\.\d+)/i)[1]}`))
		.catch((error) => {
			pb(
				chalk `{yellow Cask} not found.`,
				chalk `{dim Install via:}`,
				chalk `{dim {underline {green $} ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)"
					{green $} brew tap phinze/homebrew-cask
					{green $} brew install brew-cask}}`
			)
		})
	});
}

export async function checkHomeBrew() {
	return new Promise((resolve, reject) => {
		execa('brew', ['--version'])
		.then(({ stdout: out }) => 	pb(chalk `{yellow Homebrew}: ${out.match(/^homebrew (\d+\.\d+\.\d+)/i)[1]}`))
		.catch((error) => {
			pb(
				chalk `{yellow Homebrew} not found.`,
				chalk `{dim Install via:}`,
				chalk `{dim {underline /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)}}"
			}`);
		})
	});
}
import meow from 'meow';
import client from './index'
import pry from 'pryjs'
import chalk from 'chalk';
import pkg from '../package.json';

const cli = meow(chalk `

	{bold BETTER CASK {dim v${pkg.version}}}

	{bold {cyan USAGE}}
		$ {green better-cask} {dim [install|remove] [query and/or flags]}

	{bold {cyan OPTIONS}}
		{yellow -h --help}	{dim # Output this message}
		{yellow -v --version}	{dim # Ouput the version}

		{yellow -u --update}	{dim # Force remote apps list update}
		{yellow -i --info}	{dim # Get app infos}
`, {
	flags: {
		help: {
			type: 'boolean',
			alias: 'h'
		},
		setDelay: {
			type: 'number'
		},
		version: {
			type: 'boolean',
			alias: 'v'
		},
		forceUpdate: {
			type: 'boolean',
			alias: 'u',
			default: false
		},
		info: {
			type: 'boolean',
			alias: 'i',
			default: false
		}
	}
});

client(cli.input[0], cli.input.slice(1, cli.input.length).join(' '), cli.flags, cli)
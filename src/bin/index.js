#!/usr/bin/env node

import meow from 'meow';
import chalk from 'chalk';

import client from '../index'

const cli = meow(chalk `
	$ csk [action]

	Action can be:
		install | remove
	
	Options:
		--force-update		Force remote list update
		--set-delay <delay>	Set remote list update delay
		--get-settings		Get cli settings
	
	Examples:
		$ csk install 1password
		$ csk --set-delay 3600
		$ csk --set-delay '1000*60*60*24'
		$ csk --get-settings

`, {
	flags: {
		help: {
			type: 'boolean',
			alias: 'h'
		},
		version: {
			type: 'boolean',
			alias: 'v'
		},
		setDelay: 'number',
		getSettings: 'boolean',
		forceUpdate: 'boolean'
	}
});

client(cli.input[0], cli.input.slice(1, cli.input.length).join(' '), cli.flags, cli)
import meow from 'meow';
import client from './index'

const cli = meow(``, {
	flags: {
		help: {
			type: 'boolean',
			alias: 'h'
		},
		version: {
			type: 'boolean',
			alias: 'v'
		}
	}
});


client(cli.input.join(' '), cli.flags)
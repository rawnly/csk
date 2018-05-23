# CSK
> A better `brew cask`

![csk](https://user-images.githubusercontent.com/16429579/40456993-7ac2a418-5ef4-11e8-8623-e7738a13f933.gif)

## :computer: Installation
```bash
  yarn global add csk
```

##  🧠 Usage
```sh
  $ csk [action]

  Action can be:
  	install | remove

  Options:
  	--force-update		Force remote list update
  	--set-delay <delay>	Set remote list update delay
  	--get-settings		Get cli settings
  	--info			Get cask app infos

  Examples:
  	$ csk install 1password
  	$ csk --set-delay 3600
  	$ csk --set-delay '1000*60*60*24'
  	$ csk --get-settings
```
# node-new-service

Simple utility for generating and installing system startup scripts for
background services written for Node.js.

## Usage

Currently the intended usage is on Ubuntu systems, navigating to a node
package directory with a package.json "start" script. This utility will
generate an init.d-style script, copy it to the correct directory and
install it.

Not intended to be run as root, and works best with node that can be run as
root.

## Install

```bash
git clone https://github.com/alexanderankin/node-new-service.git
cd node-new-service
sudo npm link
cd ~/my-app
new-node-service
```

## Future

* refactor code to detect which startup system to use
* generate install and uninstall scripts in service's directory
* better wizard interface
* 'user permission error'-proof

## Contributing

Don't be a stranger - file lots of bugs! Thanks.

Of note, I use the Tj's "n" utility to manage node versions.

## Compatibility

- [ ] Epoch
- [ ] Mudar
- [x] Init.d
- [ ] inittab
- [ ] SysV
- [ ] Systemd
- [ ] Upstart

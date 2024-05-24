# Github Webhook Server

Multi-channel webhook server for [GitHub events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks).

## Installation

``` cli
npm i -G t-ski/github-webhook-server
```

> Install **github-webhook-server** globally in order to work with the presented CLI interface. Project local installations must prepend subsequently stated commands with `npx`.

## CLI Usage

``` cli
github-webhook-server [(--start|-S)=./] [(--stop|-T)] [(--monitor|-M)] [--help]
```

| Parameter | Shorthand | Description |
| --------- | --------- | ----------- |
| **--start** | **-S** | *Start a webhook server with the given config JSON* |
| **--stop** | **-T** | *Stop (terminate) a webhook server given the associated port* |
| **--monitor** | **-M** | *Monitor active webhook servers* |
| **--help** | | *Display help text* |

## Setup

A single webhook server is associated with a statically consumed config file (*.json). A config file contains both globally and hook specific information upon which the server instance is created and maintained.

### Globals

Global properties comprise server configurations that affect the spanning context.

``` json
{
  "name": "my-hook",
  "port": 1234
}
```

| Property | Desciption | Default |
| -------- | ---------- | ------- |
| `name` | *Name to associate with server process* | `null` |
| `port` | *Port to have the server listen on* | `9797` |

### Hook channels

Since the server can handle many hooks at once, each individual hook must be configured to the global `hooks` property array.  

``` json
{
  "hooks": [
    {
      "endpoint": "/endpoint",
      "secret": "abc...xyz",
      "cmd": "git pull && npm update",
      "module": "../app/hook.js",
      "cwd": "../app/"
    }, …
  ]
}
```

| Property | Desciption | Default |
| -------- | ---------- | ------- |
| `endpoint` | *Hook associated endpoint / request pathname as defined on GitHub* | `null` |
| `secret` | *Hook individual secret as present on GitHub* | `null` |
| `cmd` | *CLI command to perform upon hook activation* | `null` |
| `module` | *JS module to execute / interpret upon hook activation* | `null` |
| `cwd` | *Working directory of the hook bound dynamics* | `./` |

## 

<sub>© Thassilo Martin Schiepanski</sub>

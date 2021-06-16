(PRELIMINARY README)

# github-webhook-server

A simple GitHub webhook endpoint server for handling hooked events. Read more about [GitHub webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks).

## Installation

npm install github-webhook-server -g

## Usage

### Configuration

Set up a JSON file to store webhook related configuration parameter.

#### Port

Port to have webhook server listen on:

``` js
  "port": Number`
```

#### Pathname

Pathname to handle webhook events on:

``` js
  "pathname": String
```

> In the GitHub webhook settings, set up the endpoint according to the following scheme:\
> *[protocol]://[host]:[port][pathname]*.

#### Secret <sub>optional</sub>

High entropy secret for securing and validating webhook events as set up in the GitHub webhook settings:

``` js
  "secret": String
```

#### Resolve action <sub>optional</sub>

Resolve action information sub object.

``` js
  "resolve": {
    "commands": String,
    "cwd": String
  }
```

The resolve object may state the following parameter:\

`"commands"`  CLI command(s) to execute upon successful and validated webhook event

`"cwd"`       Current working directory to use for command(s) execution (relative to application start directory)

## Usage

Start the webhook server providing the configuration file using the following command scheme:

`github-webhook-server [relative-path-to-config-JSON]`

> We recommend starting the server as a demon or using a utility such as [forever](https://www.npmjs.com/package/forever) for keeping the server process alive.

Once the application starts up successfully, the push a test commit to the linked repository in order to check if the webhook is set up correctly.
Any activated event will cause the provided command(s) to execute accordingly.

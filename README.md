# docker-screammachine
A docker image that alerts in slack if something fishy is happening in streammachine.

It does a request to streammachine's `/api/streams` endpoint and looks at the
`last_ts` attribute of each stream.  If that timestamp is more than `SECONDS_OFFSET`
behind, it posts a message to a slack webhook.

## requirements

* slack webhook url (https://api.slack.com/incoming-webhooks)
* node v10.16.3


## deployment
The following environment variables need to be provided for this to work:

* `SOURCE_URL` the /api/sources endpoint in StreamMachine. (Example: `http://streammachine_url/api/streams`)  If this endpoint is
in a private network, then this script needs to either run within that
network or have access to that endpoing.
* `SECONDS_OFFSET` the threshold of number of seconds offset you'll tolerate
before you want this script to alert. (Example: 30)
* `WEBHOOK_URL` slack webhook URL. (Example: https://hooks.slack.com/services/LISAFRANK/BLAHBLAHUNICORNS124)
* `PREPEND_MESSAGE` what you'd like to prepend to the slack message. For example, if you want to `@channel` here or add
some emoji's like `:hear_no_evil: :radio:`

This can be set up to run as a regular cronjob on a machine (`node index.js`),
or set up as a container running as a kubernetes cronjob.


## development
The meat of the script is in `index.js`
# docker-screammachine
A docker image that alerts in slack if something fishy is happening in streammachine.

It does a request to streammachine's `/api/streams` endpoint and looks at the
`last_ts` attribute of each stream.  If that timestamp is more than `SECONDS_OFFSET`
behind, it posts a message to a slack webhook.

If you've provided a `streams.json` in the same directory as `index.json` or mount
it as a volume into your container, this script will also look to see if there
is a stream that it can recreate from it. If it can, it will delete that existing
stream from primary and recreate it.

Screammachine can also alert by checking the streamdash api URL and finding
the listeners count. If the listeners count fall below a certain threshold,
it will alert (see optional env variables below).

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

**optional**

* `LOW_LISTENERS_THRESHOLD`
* `STREAMDASH_HOURS_URL` the URL that your streamdash's hours api URL is at. Example: http://streamdash.com/api/hour


This can be set up to run as a regular cronjob on a machine (`node index.js`),
or set up as a container running as a kubernetes cronjob.


## development
The meat of the script is in `index.js`
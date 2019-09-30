const http = require('http');
const https = require('https');
const SOURCE_URL = process.env.SOURCE_URL;
const SECONDS_OFFSET = process.env.SECONDS_OFFSET;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PREPEND_MESSAGE = process.env.PREPEND_MESSAGE || ':cry:';

const notify = function(err) {
  const data = JSON.stringify({
    text: `${PREPEND_MESSAGE} ${err}`
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(WEBHOOK_URL, options, (resp) => {
  });

  req.on('error', (error) => {
    console.error("Error posting to slack:");
    console.error(error);
  });

  req.write(data);
  req.end();
};

if (SOURCE_URL === undefined) {
  console.error("No SOURCE_URL");
  return;
} else if (SECONDS_OFFSET === undefined) {
  console.error("No SECONDS_OFFSET");
  return;
} else if (WEBHOOK_URL === undefined) {
  console.error("No WEBHOOK_URL");
  return;
}

http.get(SOURCE_URL, (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const body = JSON.parse(data);
    if (body.length === 0) {
      notify("No streams found.");
      return;
    }
    body.forEach((stream) => {
      const source = stream.source;
      if (source === undefined) {
        notify(`No source for: ${stream.key}`);
        return;
      }
      const last_ts = source.last_ts;
      const now = new Date();
      if (last_ts === undefined) {
        notify("Could not find last_ts attribute");
        return;
      }
      const diff = now - new Date(last_ts);
      if (diff > (SECONDS_OFFSET * 1000)) {
        notify(`Source \`${stream.key}\` is more than ${SECONDS_OFFSET} second(s) behind. It's ${Math.round(diff/1000)} second(s) behind.`);
      }
    });
  });
}).on("error", (err) => {
  notify(err.message);
});
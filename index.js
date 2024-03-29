const http = require('http');
const https = require('https');

const SOURCE_URL = process.env.SOURCE_URL;
const SECONDS_OFFSET = process.env.SECONDS_OFFSET;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PREPEND_MESSAGE = process.env.PREPEND_MESSAGE || ':cry:';
const LOW_LISTENERS_THRESHOLD = process.env.LOW_LISTENERS_THRESHOLD;
const STREAMDASH_HOURS_URL = process.env.STREAMDASH_HOURS_URL;

// JSON file that contains the body to POST to streammachine when creating streams.
const streamsJson = require('./streams.json');

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

const createStream = function(streamKey) {
  const config = JSON.stringify(streamsJson[streamKey]);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': config.length
    }
  };

  const req = http.request(SOURCE_URL, options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      console.log(data)
    });
  });

  req.on('error', (error) => {
    console.error("Error creating to stream: " + streamKey);
    console.error(error);
  });


  req.write(config);
  req.end();
};


const recreateStream = function(streamKey) {
  console.log(`deleting stream: ${streamKey}`);
  const deleteUrl = `${SOURCE_URL}/${streamKey}`;
  const options = {
    method: 'DELETE'
  };

  const req = http.request(deleteUrl, options, (resp) => {
    resp.on('data', () => {
      createStream(streamKey);
    });
  });
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
    let notify_body = [];
    const body = JSON.parse(data);
    if (body.length === 0) {
      notify_body.push("No streams found.");
      return;
    }
    body.forEach((stream) => {
      const source = stream.source;
      if (source === undefined) {
        notify_body.push(`No source for: ${stream.key}`);
        return;
      }
      const last_ts = source.last_ts;
      const now = new Date();
      if (last_ts === undefined) {
        notify_body.push("Could not find last_ts attribute");
        return;
      }
      const diff = now - new Date(last_ts);

      // Uh oh, something is fishy with the stream. Throw an alert
      // and then try to fix it by deleting the stream and re-creating it.
      if (diff > (SECONDS_OFFSET * 1000)) {
        notify_body.push(`Source \`${stream.key}\` is more than ${SECONDS_OFFSET} second(s) behind. It's ${Math.round(diff/1000)} second(s) behind.`);
        if (streamsJson[stream.key] !== undefined) {
          recreateStream(stream.key);
        }
      } else {
        console.log(`${stream.key} stream okay`);
      }
    });
    if (notify_body.length > 0) {
      notify(notify_body.join("\n"));
    }
  });
}).on("error", (err) => {
  notify(err.message);
});

if (LOW_LISTENERS_THRESHOLD && STREAMDASH_HOURS_URL) {
  http.get(STREAMDASH_HOURS_URL, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      let notify_body = [];
      const body = JSON.parse(data);
      if (body === undefined) {
        return;
      }
      console.log(`listeners count was ${body.listens.listeners}`);
      if (body.listens.listeners < LOW_LISTENERS_THRESHOLD) {
        notify(`Listeners count (${body.listens.listeners}) fell below threshold (${LOW_LISTENERS_THRESHOLD}).` +
          `Something may be wrong with the stream. Check out Streamdash: ${STREAMDASH_HOURS_URL}`);
      }
    });
  });
}


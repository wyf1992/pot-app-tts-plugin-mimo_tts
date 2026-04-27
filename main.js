async function tts(text, lang, options = {}) {
  const { config, utils } = options;
  const { http } = utils;
  const { fetch, Body } = http;
  let { requestPath, apiKey, model, voice, voiceStyle } = config;

  if (!requestPath) {
    requestPath = "https://api.xiaomimimo.com/v1/chat/completions";
  }
  if (!/https?:\/\/.+/.test(requestPath)) {
    requestPath = `https://${requestPath}`;
  }
  if (requestPath.endsWith("/")) {
    requestPath = requestPath.slice(0, -1);
  }

  if (!apiKey) {
    throw "apiKey is required";
  }
  if (!model) {
    model = "mimo-v2.5-tts";
  }
  if (!voice) {
    voice = "Mia";
  }

  const res = await fetch(requestPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: Body.json({
      model,
      audio: {
        format: "wav",
        voice,
      },
      messages: [
        {
          role: "user",
          content: voiceStyle,
        },
        {
          role: "assistant",
          content: text,
        },
      ],
    }),
    responseType: 3,
  });
  if (res.ok) {
    let result = res.data.choices[0].message;
    if (result.audio && result.audio.data) {
      let base64 = result.audio.data;
      let data = CryptoJS.enc.Base64.parse(base64);
      let bytes = [];
      for (let i = 0; i < data.sigBytes; i++) {
        let byte = (data.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        bytes.push(byte);
      }
      return bytes;
    } else {
      throw JSON.stringify(result);
    }
  } else {
    throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(
      res.data
    )}`;
  }
}

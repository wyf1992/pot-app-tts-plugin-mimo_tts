async function tts(text, lang, options = {}) {
  const { config, utils } = options;
  const { http, CryptoJS } = utils;
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
  if (!text) {
    throw "text is required";
  }

  const messages = [];
  if (typeof voiceStyle === "string" && voiceStyle.trim()) {
    messages.push({
      role: "user",
      content: voiceStyle.trim(),
    });
  }
  messages.push({
    role: "assistant",
    content: text,
  });

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
      messages,
    }),
  });

  const decodeResponseData = (data) => {
    if (Array.isArray(data)) {
      const text = new TextDecoder("utf-8").decode(Uint8Array.from(data));
      return JSON.parse(text);
    }
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data;
  };

  if (res.ok) {
    const payload = decodeResponseData(res.data);
    const result = payload?.choices?.[0]?.message;
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
      throw JSON.stringify(payload);
    }
  } else {
    let errorText = JSON.stringify(res.data);
    if (Array.isArray(res.data)) {
      try {
        errorText = new TextDecoder("utf-8").decode(Uint8Array.from(res.data));
      } catch (e) {
        errorText = JSON.stringify(res.data);
      }
    }
    throw `Http Request Error\nHttp Status: ${res.status}\n${errorText}`;
  }
}

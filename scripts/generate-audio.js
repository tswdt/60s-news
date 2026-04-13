const https = require("https");
const fs = require("fs");
const path = require("path");

const VOICE = "zh-CN-YunyangNeural";
const OUTPUT_DIR = path.join(__dirname, "..", "audio");

function uuid() {
  return crypto.randomUUID().replaceAll("-", "");
}

function fetchVoices() {
  return new Promise((resolve, reject) => {
    https.get("https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclient=2024", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function tts(text, outputPath) {
  return new Promise((resolve, reject) => {
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientList=2024&ConnectionId=${uuid()}`;

    const WebSocket = require("ws");
    const ws = new WebSocket(wsUrl, {
      headers: {
        "Host": "speech.platform.bing.com",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
      }
    });

    const audioData = [];

    ws.on("open", () => {
      const speechConfig = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: false,
                wordBoundaryEnabled: false
              },
              outputFormat: "audio-24khz-48kbitrate-mono-mp3"
            }
          }
        }
      });

      const configMessage = `X-Timestamp:${new Date().toUTCString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${speechConfig}`;
      ws.send(configMessage);

      const ssmlMessage = `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toUTCString()}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'><voice name='${VOICE}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${text}</prosody></voice></speak>`;
      ws.send(ssmlMessage);
    });

    ws.on("message", (rawData, isBinary) => {
      if (!isBinary) {
        const data = rawData.toString("utf8");
        if (data.includes("turn.end")) {
          ws.close();
          const buffer = Buffer.concat(audioData);
          fs.writeFileSync(outputPath, buffer);
          resolve(outputPath);
        }
        return;
      }

      const data = rawData;
      const separator = "Path:audio\r\n";
      const index = data.indexOf(separator);
      if (index !== -1) {
        const content = data.subarray(index + separator.length);
        audioData.push(content);
      }
    });

    ws.on("error", reject);
    ws.on("close", () => {
      if (audioData.length === 0) {
        reject(new Error("No audio data received"));
      }
    });
  });
}

async function fetchNews(date) {
  return new Promise((resolve, reject) => {
    const url = `https://60s-static.viki.moe/60s/${date}.json`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function formatTextForSpeech(newsData) {
  const lines = [
    `今天是${newsData.date}，`,
    `今天是每日60秒新闻时间。`,
    `请听今日新闻：`
  ];

  if (newsData.news && Array.isArray(newsData.news)) {
    newsData.news.forEach((item, index) => {
      lines.push(`第${index + 1}条，${item}`);
    });
  }

  if (newsData.tip) {
    lines.push(`今日金句：${newsData.tip}`);
  }

  lines.push("以上是今日新闻，感谢收听。");

  return lines.join("");
}

async function generateAudio(date) {
  console.log(`正在获取 ${date} 的新闻数据...`);

  const newsData = await fetchNews(date);
  const text = formatTextForSpeech(newsData);

  console.log(`正在生成音频...`);
  console.log(`文本长度: ${text.length} 字符`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(OUTPUT_DIR, `${date}.mp3`);

  await tts(text, outputPath);

  console.log(`音频已生成: ${outputPath}`);
  return outputPath;
}

const date = process.argv[2] || new Date().toISOString().split("T")[0];

generateAudio(date)
  .then(() => {
    console.log("完成！");
    process.exit(0);
  })
  .catch(err => {
    console.error("生成失败:", err);
    process.exit(1);
  });
#!/usr/bin/env python3
import sys
import os
import json
from datetime import datetime

def get_today_date():
    return datetime.now().strftime("%Y-%m-%d")

def fetch_news(date):
    import urllib.request
    url = f"https://60s-static.viki.moe/60s/{date}.json"
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))

def format_text_for_speech(news_data):
    lines = [
        f"今天是{news_data['date']}，",
        "今天是每日60秒新闻时间。",
        "请听今日新闻："
    ]

    if "news" in news_data and isinstance(news_data["news"], list):
        for index, item in enumerate(news_data["news"]):
            lines.append(f"第{index + 1}条，{item}")

    if "tip" in news_data and news_data["tip"]:
        lines.append(f"今日金句：{news_data['tip']}")

    lines.append("以上是今日新闻，感谢收听。")

    return "，".join(lines)

def generate_audio(date, text):
    output_dir = os.path.join(os.path.dirname(__file__), "..", "audio")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{date}.mp3")

    try:
        import edge_tts
        import asyncio

        async def main():
            communicate = edge_tts.Communicate(text, "zh-CN-YunyangNeural")
            await communicate.save(output_path)

        asyncio.run(main())
        return output_path
    except ImportError:
        print("错误：需要安装 edge-tts Python 包")
        print("请运行: pip install edge-tts")
        sys.exit(1)
    except Exception as e:
        print(f"生成音频时出错: {e}")
        raise

def main():
    date = sys.argv[1] if len(sys.argv) > 1 else get_today_date()

    print(f"正在获取 {date} 的新闻数据...")

    try:
        news_data = fetch_news(date)
        text = format_text_for_speech(news_data)

        print(f"正在生成音频...")
        print(f"文本长度: {len(text)} 字符")

        output_path = generate_audio(date, text)

        print(f"音频已生成: {output_path}")
        print("完成！")

    except Exception as e:
        print(f"生成失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
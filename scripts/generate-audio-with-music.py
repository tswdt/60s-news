#!/usr/bin/env python3
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

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

def download_file(url, output_path):
    import urllib.request
    print(f"下载中: {url}")
    urllib.request.urlretrieve(url, output_path)
    print(f"已下载: {output_path}")

def add_background_music(voice_path, bg_music_path, output_path):
    from moviepy import AudioFileClip, CompositeAudioClip

    print("加载语音文件...")
    voice_clip = AudioFileClip(voice_path)

    print("加载背景音乐...")
    bg_clip = AudioFileClip(bg_music_path)

    voice_duration = voice_clip.duration
    bg_duration = bg_clip.duration

    print(f"语音长度: {voice_duration:.1f}秒")
    print(f"背景音乐长度: {bg_duration:.1f}秒")

    loop_count = int(voice_duration / bg_duration) + 2
    extended_bgs = []
    for i in range(loop_count):
        extended_bgs.append(bg_clip)
    extended_bg = CompositeAudioClip(extended_bgs).subclipped(0, voice_duration)

    adjusted_bg = extended_bg.with_volume_scaled(0.3)

    final_audio = CompositeAudioClip([voice_clip, adjusted_bg])

    print("导出音频...")
    final_audio.write_audiofile(output_path, codec='mp3', bitrate='128k')
    print(f"已生成带背景音乐的音频: {output_path}")

def generate_audio_with_music(date, text, bg_music_path=None):
    output_dir = os.path.join(os.path.dirname(__file__), "..", "audio")
    os.makedirs(output_dir, exist_ok=True)

    temp_voice_path = os.path.join(output_dir, f"{date}_voice.mp3")
    output_path = os.path.join(output_dir, f"{date}.mp3")

    try:
        import edge_tts
        import asyncio

        async def main():
            communicate = edge_tts.Communicate(text, "zh-CN-YunyangNeural")
            await communicate.save(temp_voice_path)

        asyncio.run(main())
        print(f"语音已生成: {temp_voice_path}")

        if bg_music_path and os.path.exists(bg_music_path):
            print(f"正在添加背景音乐...")
            add_background_music(temp_voice_path, bg_music_path, output_path)
            os.remove(temp_voice_path)
        else:
            if os.path.exists(output_path):
                os.remove(output_path)
            os.rename(temp_voice_path, output_path)

        return output_path

    except ImportError as e:
        print(f"错误：缺少必要的包: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"生成音频时出错: {e}")
        import traceback
        traceback.print_exc()
        if os.path.exists(temp_voice_path):
            os.remove(temp_voice_path)
        raise

def main():
    date = sys.argv[1] if len(sys.argv) > 1 else get_today_date()
    bg_music = sys.argv[2] if len(sys.argv) > 2 else None

    bg_music_path = None
    if bg_music:
        if bg_music.startswith("file://"):
            bg_music_path = bg_music[7:]
        elif os.path.isabs(bg_music):
            bg_music_path = bg_music
        else:
            bg_music_path = os.path.join(os.path.dirname(__file__), "..", bg_music)

    print(f"正在获取 {date} 的新闻数据...")

    try:
        news_data = fetch_news(date)
        text = format_text_for_speech(news_data)

        print(f"正在生成音频...")
        print(f"文本长度: {len(text)} 字符")

        output_path = generate_audio_with_music(date, text, bg_music_path)

        print(f"音频已生成: {output_path}")
        print("完成！")

    except Exception as e:
        print(f"生成失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
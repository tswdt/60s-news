#!/usr/bin/env python3
"""
上传音频到微信小程序云存储
"""
import os
import sys
import requests
import json

def get_access_token(appid, secret):
    """获取微信小程序 access_token"""
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    response = requests.get(url)
    data = response.json()
    if 'access_token' in data:
        return data['access_token']
    else:
        print(f"获取 access_token 失败: {data}")
        return None

def upload_file_to_cloud(access_token, env, file_path, cloud_path):
    """上传文件到微信云存储"""
    # 1. 获取上传链接
    url = f"https://api.weixin.qq.com/tcb/uploadfile?access_token={access_token}"
    payload = {
        "env": env,
        "path": cloud_path
    }
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result.get('errcode') != 0:
        print(f"获取上传链接失败: {result}")
        return False
    
    # 2. 使用返回的链接上传文件
    upload_url = result['url']
    token = result['token']
    authorization = result['authorization']
    file_id = result['file_id']
    
    with open(file_path, 'rb') as f:
        files = {
            'file': f
        }
        data = {
            'key': cloud_path,
            'Signature': authorization,
            'x-cos-security-token': token,
            'x-cos-meta-fileid': file_id
        }
        upload_response = requests.post(upload_url, files=files, data=data)
    
    if upload_response.status_code == 204:
        print(f"上传成功: {cloud_path}")
        return True
    else:
        print(f"上传失败: {upload_response.status_code} {upload_response.text}")
        return False

def delete_cloud_file(access_token, env, file_id):
    """删除云存储中的文件"""
    url = f"https://api.weixin.qq.com/tcb/batchdeletefile?access_token={access_token}"
    payload = {
        "env": env,
        "fileid_list": [file_id]
    }
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result.get('errcode') == 0:
        print(f"删除成功: {file_id}")
        return True
    else:
        print(f"删除失败: {result}")
        return False

def main():
    # 从环境变量获取配置
    appid = os.environ.get('WX_APPID')
    secret = os.environ.get('WX_SECRET')
    env = os.environ.get('WX_ENV')
    
    if not all([appid, secret, env]):
        print("错误: 缺少必要的环境变量 WX_APPID, WX_SECRET, WX_ENV")
        sys.exit(1)
    
    # 获取日期
    date = os.environ.get('DATE') or os.popen('date +%Y-%m-%d').read().strip()
    yesterday = os.popen('date -d "yesterday" +%Y-%m-%d').read().strip()
    
    # 获取 access_token
    access_token = get_access_token(appid, secret)
    if not access_token:
        sys.exit(1)
    
    # 上传今天的音频
    local_file = f"audio/{date}.mp3"
    cloud_path = f"audio/{date}.mp3"
    
    if os.path.exists(local_file):
        print(f"正在上传 {local_file} 到云存储...")
        if upload_file_to_cloud(access_token, env, local_file, cloud_path):
            print(f"✅ 音频上传成功: {cloud_path}")
        else:
            print(f"❌ 音频上传失败")
            sys.exit(1)
    else:
        print(f"❌ 本地文件不存在: {local_file}")
        sys.exit(1)
    
    # 删除昨天的音频
    yesterday_file_id = f"cloud://{env}.{env}/audio/{yesterday}.mp3"
    print(f"正在删除昨天的音频: {yesterday_file_id}")
    delete_cloud_file(access_token, env, yesterday_file_id)

if __name__ == '__main__':
    main()

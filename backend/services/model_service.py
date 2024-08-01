# services/model_service.py

import subprocess
import json
import logging
from openai import OpenAI
import anthropic


def run_local_model(prompt, model_name):
    try:
        result = subprocess.run(
            ["ollama", "run", model_name, prompt],
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running local model: {e}")
        logging.error(f"Error output: {e.stderr}")
        raise Exception(f"Error running local model: {e}")


def run_openai(prompt, api_key):
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def run_claude(prompt, api_key):
    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.completions.create(
            model="claude-3-5-sonnet",
            prompt=prompt,
            max_tokens_to_sample=1000
        )
        return response.completion
    except Exception as e:
        logging.error(f"Error calling Claude API: {e}")
        raise Exception(f"Error calling Claude API: {e}")


def run_other_api(prompt, api_key):
    # 这里可以实现调用其他API的逻辑
    raise NotImplementedError("Other API support not implemented yet")


def get_local_models():
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True, check=True)
        models = []
        for line in result.stdout.split('\n')[1:]:  # 跳过标题行
            if line.strip():
                models.append(line.split()[0])  # 获取模型名称（第一列）
        return models
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running 'ollama list': {e}")
        return []
    except Exception as e:
        logging.error(f"Unexpected error when getting local models: {e}")
        return []


# 添加一个通用的模型运行函数
def run_model(news_content, model_source, api_key=None, local_model=None):
    prompt = f"Analyze the economic impact of the following news:\n\n{news_content}"

    if model_source == 'local':
        return run_local_model(prompt, local_model)
    elif model_source == 'openai':
        return run_openai(prompt, api_key)
    elif model_source == 'claude':
        return run_claude(prompt, api_key)
    elif model_source == 'other':
        return run_other_api(prompt, api_key)
    else:
        raise ValueError(f"Unsupported model source: {model_source}")
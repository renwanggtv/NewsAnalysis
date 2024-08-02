import json
import logging
from ..services.model_service import run_local_model, run_openai, run_claude, run_other_api
import subprocess
import re
from flask import Flask, render_template, request, jsonify
class NewsAnalyzer:
    def __init__(self):
        self.initial_prompt = self.load_prompt("initial_prompt.txt")
        self.detailed_prompt = self.load_prompt("detailed_prompt.txt")

    def load_prompt(self, filename):
        try:
            with open(f"prompts/{filename}", 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            logging.error(f"{filename} not found. Using default prompt.")
            return ""

    def analyze_news(self, news_content, model_source, api_key=None, local_model=None):
        try:

            prompt = self.initial_prompt.format(news_content=news_content)
            logging.info(f"Analyzing news with prompt: {prompt}")
            logging.error(f"prompt: {prompt}")
            if model_source == 'local':
                result = run_local_model(prompt, local_model)
            elif model_source == 'openai':
                result = run_openai(prompt, api_key)
            elif model_source == 'claude':
                result = run_claude(prompt, api_key)
            elif model_source == 'other':
                result = run_other_api(prompt, api_key)
            else:
                raise ValueError(f"Unsupported model source: {model_source}")
            logging.info(f"Raw result from model: {result}")
            logging.error(f"result: {result}")
            cleaned_json = self.clean_json(result)
            logging.info(f"Cleaned JSON: {cleaned_json}")
            return json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            logging.error(f"JSON decode error: {e}")
            return {"error": f"Invalid JSON format: {str(e)}"}
        except Exception as e:
            logging.error(f"Error during analysis: {e}")
            return {"error": f"Error during analysis: {str(e)}"}

    def get_local_models(self):
        try:
            result = subprocess.run(["ollama", "list"], capture_output=True, text=True, check=True)
            models = []
            for line in result.stdout.split('\n')[1:]:  # 跳过标题行
                if line.strip():
                    models.append(line.split()[0])  # 获取模型名称（第一列）
            return models
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Error running 'ollama list': {e.stderr}")
        except Exception as e:
            raise RuntimeError(f"Unexpected error when getting local models: {str(e)}")
    def clean_json(self, json_str):
        logging.info(f"Cleaning JSON string: {json_str}")
        # 找到JSON对象的开始和结束
        start = json_str.find('{')
        end = json_str.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError("No valid JSON object found in the string")
        json_str = json_str[start:end]

        # 修复常见的JSON格式错误
        json_str = re.sub(r'(?<!\\)"(\w+)"(?=:)', r'"\1"', json_str)  # 确保键名被双引号包围
        json_str = re.sub(r'(?<=: )"([^"]*)"(?=[,}])', r'"\1"', json_str)  # 确保字符串值被双引号包围
        json_str = re.sub(r',\s*}', '}', json_str)  # 移除对象末尾多余的逗号
        json_str = re.sub(r',\s*]', ']', json_str)  # 移除数组末尾多余的逗号

        logging.info(f"Cleaned JSON string: {json_str}")
        return json_str

    def get_detailed_description(self, area_name, news_content, model_source, api_key=None, local_model=None):
        try:
            prompt = self.detailed_prompt.format(area_name=area_name, news_content=news_content)

            if model_source == 'local':
                result = run_local_model(prompt, local_model)
            elif model_source == 'openai':
                result = run_openai(prompt, api_key)
            elif model_source == 'claude':
                result = run_claude(prompt, api_key)
            elif model_source == 'other':
                result = run_other_api(prompt, api_key)
            else:
                raise ValueError(f"Unsupported model source: {model_source}")

            cleaned_json = self.clean_json(result)
            parsed_result = json.loads(cleaned_json)

            return parsed_result
        except Exception as e:
            logging.error(f"Error in get_detailed_description: {e}")
            return {"error": f"获取详细描述时发生错误: {str(e)}"}
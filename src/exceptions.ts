/**
 * 源文件: browser_use/exceptions.py
 * 功能描述: 定义项目异常类，提供 LLM 相关错误处理
 */

/**
 * LLM 相关异常类
 * 用于处理 LLM API 调用过程中的错误
 */
export class LLMException extends Error {
  public statusCode: number;
  public override message: string;

  constructor(statusCode: number, message: string) {
    super(`Error ${statusCode}: ${message}`);
    this.name = 'LLMException';
    this.statusCode = statusCode;
    this.message = message;
  }
}

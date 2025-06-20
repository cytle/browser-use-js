/**
 * Browser-Use JS 文件系统服务
 *
 * 源文件: browser_use/filesystem/file_system.py
 * 功能描述: 文件系统操作封装，提供安全的文件操作接口
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../logging.js';

/**
 * 文件操作选项
 */
export interface FileOperationOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modified: Date;
  created: Date;
}

/**
 * 文件系统服务类
 */
export class FileSystem {
  private allowedPaths: string[];
  private basePath: string;

  constructor(basePath: string = process.cwd(), allowedPaths?: string[]) {
    this.basePath = path.resolve(basePath);
    this.allowedPaths = allowedPaths || [this.basePath];
    logger.debug(`FileSystem initialized with base path: ${this.basePath}`);
  }

  /**
   * 验证路径是否被允许
   */
  private validatePath(filePath: string): string {
    const resolvedPath = path.resolve(filePath);

    // 检查路径是否在允许的路径范围内
    const isAllowed = this.allowedPaths.some(allowedPath => {
      const normalizedAllowed = path.resolve(allowedPath);
      return resolvedPath.startsWith(normalizedAllowed);
    });

    if (!isAllowed) {
      throw new Error(
        `Access denied: Path ${resolvedPath} is not within allowed directories`
      );
    }

    return resolvedPath;
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const validatedPath = this.validatePath(filePath);
      await fs.access(validatedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(
    filePath: string,
    options: FileOperationOptions = {}
  ): Promise<string> {
    try {
      const validatedPath = this.validatePath(filePath);
      const encoding = options.encoding || 'utf8';
      const content = await fs.readFile(validatedPath, { encoding });
      logger.debug(`Read file: ${filePath} (${content.length} characters)`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  /**
   * 写入文件内容
   */
  async writeFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const validatedPath = this.validatePath(filePath);

      // 确保目录存在
      const dirPath = path.dirname(validatedPath);
      await this.ensureDirectory(dirPath);

      const encoding = options.encoding || 'utf8';
      await fs.writeFile(validatedPath, content, {
        encoding,
        mode: options.mode,
        flag: options.flag,
      });

      logger.debug(`Wrote file: ${filePath} (${content.length} characters)`);
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  /**
   * 追加文件内容
   */
  async appendFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const validatedPath = this.validatePath(filePath);
      const encoding = options.encoding || 'utf8';
      await fs.appendFile(validatedPath, content, { encoding });
      logger.debug(
        `Appended to file: ${filePath} (${content.length} characters)`
      );
    } catch (error) {
      logger.error(`Failed to append to file ${filePath}:`, error);
      throw new Error(`Failed to append to file: ${error}`);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const validatedPath = this.validatePath(filePath);
      await fs.unlink(validatedPath);
      logger.debug(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}:`, error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(
    dirPath: string,
    recursive: boolean = true
  ): Promise<void> {
    try {
      const validatedPath = this.validatePath(dirPath);
      await fs.mkdir(validatedPath, { recursive });
      logger.debug(`Created directory: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    if (!(await this.exists(dirPath))) {
      await this.createDirectory(dirPath, true);
    }
  }

  /**
   * 删除目录
   */
  async deleteDirectory(
    dirPath: string,
    recursive: boolean = false
  ): Promise<void> {
    try {
      const validatedPath = this.validatePath(dirPath);
      await fs.rmdir(validatedPath, { recursive });
      logger.debug(`Deleted directory: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to delete directory ${dirPath}:`, error);
      throw new Error(`Failed to delete directory: ${error}`);
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    try {
      const validatedPath = this.validatePath(dirPath);
      const entries = await fs.readdir(validatedPath, { withFileTypes: true });

      const fileInfos: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = path.join(validatedPath, entry.name);
        const stats = await fs.stat(entryPath);

        fileInfos.push({
          path: entryPath,
          name: entry.name,
          size: stats.size,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          modified: stats.mtime,
          created: stats.birthtime,
        });
      }

      logger.debug(
        `Listed directory: ${dirPath} (${fileInfos.length} entries)`
      );
      return fileInfos;
    } catch (error) {
      logger.error(`Failed to list directory ${dirPath}:`, error);
      throw new Error(`Failed to list directory: ${error}`);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const validatedPath = this.validatePath(filePath);
      const stats = await fs.stat(validatedPath);

      return {
        path: validatedPath,
        name: path.basename(validatedPath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        modified: stats.mtime,
        created: stats.birthtime,
      };
    } catch (error) {
      logger.error(`Failed to get file info for ${filePath}:`, error);
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * 复制文件
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const validatedSource = this.validatePath(sourcePath);
      const validatedDest = this.validatePath(destPath);

      // 确保目标目录存在
      const destDir = path.dirname(validatedDest);
      await this.ensureDirectory(destDir);

      await fs.copyFile(validatedSource, validatedDest);
      logger.debug(`Copied file: ${sourcePath} -> ${destPath}`);
    } catch (error) {
      logger.error(`Failed to copy file ${sourcePath} to ${destPath}:`, error);
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  /**
   * 移动文件
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const validatedSource = this.validatePath(sourcePath);
      const validatedDest = this.validatePath(destPath);

      // 确保目标目录存在
      const destDir = path.dirname(validatedDest);
      await this.ensureDirectory(destDir);

      await fs.rename(validatedSource, validatedDest);
      logger.debug(`Moved file: ${sourcePath} -> ${destPath}`);
    } catch (error) {
      logger.error(`Failed to move file ${sourcePath} to ${destPath}:`, error);
      throw new Error(`Failed to move file: ${error}`);
    }
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * 获取文件名（不含扩展名）
   */
  getFileName(filePath: string): string {
    return path.parse(filePath).name;
  }

  /**
   * 获取目录名
   */
  getDirectoryName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 连接路径
   */
  joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * 获取相对路径
   */
  getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * 获取绝对路径
   */
  getAbsolutePath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * 检查路径是否为绝对路径
   */
  isAbsolutePath(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * 规范化路径
   */
  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * 获取允许的路径列表
   */
  getAllowedPaths(): string[] {
    return [...this.allowedPaths];
  }

  /**
   * 添加允许的路径
   */
  addAllowedPath(allowedPath: string): void {
    const resolvedPath = path.resolve(allowedPath);
    if (!this.allowedPaths.includes(resolvedPath)) {
      this.allowedPaths.push(resolvedPath);
      logger.debug(`Added allowed path: ${resolvedPath}`);
    }
  }

  /**
   * 移除允许的路径
   */
  removeAllowedPath(allowedPath: string): void {
    const resolvedPath = path.resolve(allowedPath);
    const index = this.allowedPaths.indexOf(resolvedPath);
    if (index > -1) {
      this.allowedPaths.splice(index, 1);
      logger.debug(`Removed allowed path: ${resolvedPath}`);
    }
  }
}

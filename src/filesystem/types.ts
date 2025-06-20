/**
 * 源文件: 新建文件
 * 功能描述: 定义文件系统相关的基础类型
 */

/**
 * 文件系统接口
 * 提供文件操作的抽象接口
 */
export interface FileSystem {
  /**
   * 读取文件内容
   */
  readFile(path: string): Promise<string>;

  /**
   * 写入文件内容
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * 检查文件是否存在
   */
  exists(path: string): Promise<boolean>;

  /**
   * 删除文件
   */
  deleteFile(path: string): Promise<void>;

  /**
   * 创建目录
   */
  createDirectory(path: string): Promise<void>;

  /**
   * 列出目录内容
   */
  listDirectory(path: string): Promise<string[]>;

  /**
   * 获取文件信息
   */
  getFileInfo(path: string): Promise<FileInfo>;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

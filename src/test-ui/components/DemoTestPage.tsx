/**
 * @file purpose: 演示测试页面组件
 *
 * 这个组件提供了一个包含各种可交互元素的测试页面，
 * 用于演示 Browser-Use JS 的 DOM 处理和 AI 代理功能。
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Search,
  User,
  Mail,
  Heart,
  Share,
  Download,
  Settings,
  Info,
} from 'lucide-react';

export function DemoTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progress, setProgress] = useState(45);
  const [likes, setLikes] = useState(128);
  const [isLiked, setIsLiked] = useState(false);

  const handleSearch = () => {
    alert(`搜索: ${searchQuery}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('表单已提交！');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className='space-y-8 p-6 bg-gray-50 min-h-screen'>
      {/* 页面标题 */}
      <div className='text-center'>
        <h1
          className='text-3xl font-bold text-gray-900 mb-2'
          data-testid='page-title'
        >
          Browser-Use JS 演示测试页面
        </h1>
        <p className='text-gray-600' data-testid='page-description'>
          这个页面包含各种可交互元素，用于测试 AI 代理的网页交互能力
        </p>
      </div>

      {/* 搜索区域 */}
      <Card data-testid='search-section'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' />
            搜索功能
          </CardTitle>
          <CardDescription>测试搜索框识别和输入功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <Input
              data-testid='search-input'
              placeholder='输入搜索关键词...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='flex-1'
            />
            <Button data-testid='search-button' onClick={handleSearch}>
              搜索
            </Button>
          </div>
          {searchQuery && (
            <div className='mt-2 text-sm text-gray-600'>
              当前搜索: <Badge variant='secondary'>{searchQuery}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 表单区域 */}
      <Card data-testid='form-section'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            用户信息表单
          </CardTitle>
          <CardDescription>测试表单字段识别和自动填写功能</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>姓名</label>
                <Input
                  data-testid='name-input'
                  placeholder='请输入姓名'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>邮箱</label>
                <Input
                  data-testid='email-input'
                  type='email'
                  placeholder='请输入邮箱'
                  value={formData.email}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>电话</label>
                <Input
                  data-testid='phone-input'
                  placeholder='请输入电话号码'
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>城市</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger data-testid='city-select'>
                    <SelectValue placeholder='选择城市' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='beijing'>北京</SelectItem>
                    <SelectItem value='shanghai'>上海</SelectItem>
                    <SelectItem value='guangzhou'>广州</SelectItem>
                    <SelectItem value='shenzhen'>深圳</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>留言</label>
              <Textarea
                data-testid='message-textarea'
                placeholder='请输入您的留言...'
                value={formData.message}
                onChange={e =>
                  setFormData(prev => ({ ...prev, message: e.target.value }))
                }
                rows={3}
              />
            </div>
            <Button
              data-testid='submit-button'
              type='submit'
              className='w-full'
            >
              提交表单
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 交互元素区域 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* 按钮组 */}
        <Card data-testid='buttons-section'>
          <CardHeader>
            <CardTitle>按钮交互</CardTitle>
            <CardDescription>测试各种按钮的点击功能</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-2'>
              <Button data-testid='primary-button' variant='default'>
                主要按钮
              </Button>
              <Button data-testid='secondary-button' variant='secondary'>
                次要按钮
              </Button>
              <Button data-testid='outline-button' variant='outline'>
                边框按钮
              </Button>
              <Button data-testid='destructive-button' variant='destructive'>
                危险按钮
              </Button>
            </div>
            <Separator />
            <div className='flex gap-2'>
              <Button
                data-testid='like-button'
                variant={isLiked ? 'default' : 'outline'}
                size='sm'
                onClick={handleLike}
                className='flex items-center gap-1'
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {likes}
              </Button>
              <Button data-testid='share-button' variant='outline' size='sm'>
                <Share className='h-4 w-4 mr-1' />
                分享
              </Button>
              <Button data-testid='download-button' variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-1' />
                下载
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 状态显示 */}
        <Card data-testid='status-section'>
          <CardHeader>
            <CardTitle>状态显示</CardTitle>
            <CardDescription>测试状态元素的识别</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>进度条</span>
                <span>{progress}%</span>
              </div>
              <Progress data-testid='progress-bar' value={progress} />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Badge data-testid='success-badge' variant='default'>
                成功
              </Badge>
              <Badge data-testid='warning-badge' variant='secondary'>
                警告
              </Badge>
              <Badge data-testid='error-badge' variant='destructive'>
                错误
              </Badge>
              <Badge data-testid='info-badge' variant='outline'>
                信息
              </Badge>
            </div>
            <Alert data-testid='alert-message'>
              <Info className='h-4 w-4' />
              <AlertDescription>
                这是一个信息提示框，用于测试 AI 代理对提示信息的理解能力。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* 导航链接区域 */}
      <Card data-testid='navigation-section'>
        <CardHeader>
          <CardTitle>导航链接</CardTitle>
          <CardDescription>测试链接识别和点击功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <a
              href='#home'
              data-testid='home-link'
              className='flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors'
            >
              <User className='h-4 w-4' />
              首页
            </a>
            <a
              href='#about'
              data-testid='about-link'
              className='flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors'
            >
              <Info className='h-4 w-4' />
              关于
            </a>
            <a
              href='#contact'
              data-testid='contact-link'
              className='flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors'
            >
              <Mail className='h-4 w-4' />
              联系
            </a>
            <a
              href='#settings'
              data-testid='settings-link'
              className='flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors'
            >
              <Settings className='h-4 w-4' />
              设置
            </a>
          </div>
        </CardContent>
      </Card>

      {/* 数据列表区域 */}
      <Card data-testid='data-section'>
        <CardHeader>
          <CardTitle>数据列表</CardTitle>
          <CardDescription>测试列表数据的识别和提取</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[
              { id: 1, name: '张三', role: '开发工程师', status: '在线' },
              { id: 2, name: '李四', role: '产品经理', status: '离线' },
              { id: 3, name: '王五', role: '设计师', status: '忙碌' },
              { id: 4, name: '赵六', role: '测试工程师', status: '在线' },
            ].map(user => (
              <div
                key={user.id}
                data-testid={`user-item-${user.id}`}
                className='flex items-center justify-between p-3 border rounded'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <User className='h-4 w-4 text-blue-600' />
                  </div>
                  <div>
                    <div
                      className='font-medium'
                      data-testid={`user-name-${user.id}`}
                    >
                      {user.name}
                    </div>
                    <div
                      className='text-sm text-gray-500'
                      data-testid={`user-role-${user.id}`}
                    >
                      {user.role}
                    </div>
                  </div>
                </div>
                <Badge
                  data-testid={`user-status-${user.id}`}
                  variant={
                    user.status === '在线'
                      ? 'default'
                      : user.status === '忙碌'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {user.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 页面底部 */}
      <div className='text-center text-sm text-gray-500 py-8'>
        <p>这是一个用于测试 Browser-Use JS 功能的演示页面</p>
        <p className='mt-1'>包含了各种常见的网页交互元素和数据结构</p>
      </div>
    </div>
  );
}

/**
 * @file purpose: 测试页面内容组件 - 提供各种可点击元素用于测试
 */

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Globe,
  Search,
  ShoppingCart,
  User,
  Star,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
  ThumbsUp,
  Download,
  Share,
  Settings,
  Menu,
  Home,
  Info,
  Mail,
  Phone,
  Calendar,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  Upload,
} from 'lucide-react';

export function TestPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(0);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [likes, setLikes] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [selectedTab, setSelectedTab] = useState('home');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: '',
    newsletter: false,
  });
  const [todoItems, setTodoItems] = useState([
    { id: 1, text: '学习 React', completed: false },
    { id: 2, text: '测试可点击元素', completed: true },
    { id: 3, text: '优化性能', completed: false },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      price: '¥19,999',
      rating: 4.8,
      image: '💻',
      description: '强大的专业级笔记本电脑',
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      price: '¥8,999',
      rating: 4.9,
      image: '📱',
      description: '最新款智能手机',
    },
    {
      id: 3,
      name: 'AirPods Pro',
      price: '¥1,899',
      rating: 4.7,
      image: '🎧',
      description: '主动降噪无线耳机',
    },
    {
      id: 4,
      name: 'iPad Air',
      price: '¥4,399',
      rating: 4.6,
      image: '📱',
      description: '轻薄便携平板电脑',
    },
  ];

  const handleSearch = () => {
    console.log('搜索:', searchQuery);
  };

  const addToCart = (productId: number) => {
    setCartItems(prev => prev + 1);
    console.log('添加到购物车:', productId);
  };

  const toggleLike = (productId: number) => {
    setLikedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleLike = () => setLikes(prev => prev + 1);
  const togglePlay = () => setIsPlaying(prev => !prev);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('表单提交:', formData);
    alert('表单已提交！');
  };

  const toggleTodo = (id: number) => {
    setTodoItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodoItems(prev => prev.filter(item => item.id !== id));
  };

  const addTodo = () => {
    const text = prompt('请输入新任务:');
    if (text) {
      setTodoItems(prev => [
        ...prev,
        { id: Date.now(), text, completed: false },
      ]);
    }
  };

  return (
    <div className='h-full bg-white dark:bg-slate-900 overflow-auto'>
      {/* 页面标题 */}
      <div className='text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
        <h1 className='text-3xl font-bold mb-2'>可点击元素测试页面</h1>
        <p className='text-lg opacity-90'>
          这个页面包含各种类型的可点击元素，用于测试 Browser-Use JS
          的元素识别能力
        </p>
      </div>

      {/* 网站头部 */}
      <header className='bg-blue-600 text-white p-4 shadow-lg'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Globe className='h-8 w-8' />
            <h1 className='text-2xl font-bold'>TechStore</h1>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='搜索商品...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-64 bg-white text-black'
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant='secondary' size='sm'>
                <Search className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex items-center gap-3'>
              <Button
                variant='ghost'
                size='sm'
                className='text-white hover:bg-blue-700'
              >
                <User className='h-5 w-5' />
                登录
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='text-white hover:bg-blue-700 relative'
              >
                <ShoppingCart className='h-5 w-5' />
                购物车
                {cartItems > 0 && (
                  <Badge className='absolute -top-2 -right-2 bg-red-500 text-white text-xs'>
                    {cartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 导航栏 */}
      <div className='bg-gray-100 p-4'>
        <nav className='flex flex-wrap gap-2'>
          {[
            { id: 'home', label: '首页', icon: Home },
            { id: 'about', label: '关于', icon: Info },
            { id: 'contact', label: '联系', icon: Mail },
            { id: 'services', label: '服务', icon: Settings },
            { id: 'profile', label: '个人资料', icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icon className='w-4 h-4' />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* 主要内容区域 */}
      <main className='p-6 space-y-6'>
        {/* 按钮测试区域 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MousePointer className='w-5 h-5' />
              按钮测试区域
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* 基础按钮 */}
            <div>
              <h3 className='text-lg font-semibold mb-2'>基础按钮</h3>
              <div className='flex flex-wrap gap-2'>
                <Button onClick={() => alert('主要按钮点击')}>主要按钮</Button>
                <Button
                  variant='secondary'
                  onClick={() => alert('次要按钮点击')}
                >
                  次要按钮
                </Button>
                <Button variant='outline' onClick={() => alert('轮廓按钮点击')}>
                  轮廓按钮
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => alert('危险按钮点击')}
                >
                  危险按钮
                </Button>
                <Button disabled>禁用按钮</Button>
              </div>
            </div>

            {/* 图标按钮 */}
            <div>
              <h3 className='text-lg font-semibold mb-2'>图标按钮</h3>
              <div className='flex flex-wrap gap-2'>
                <Button
                  onClick={handleLike}
                  className='flex items-center gap-2'
                >
                  <Heart className='w-4 h-4' />
                  点赞 ({likes})
                </Button>
                <Button
                  onClick={() => alert('分享')}
                  className='flex items-center gap-2'
                >
                  <Share className='w-4 h-4' />
                  分享
                </Button>
                <Button
                  onClick={() => alert('下载')}
                  className='flex items-center gap-2'
                >
                  <Download className='w-4 h-4' />
                  下载
                </Button>
                <Button
                  onClick={() => alert('收藏')}
                  className='flex items-center gap-2'
                >
                  <Star className='w-4 h-4' />
                  收藏
                </Button>
              </div>
            </div>

            {/* 媒体控制按钮 */}
            <div>
              <h3 className='text-lg font-semibold mb-2'>媒体控制</h3>
              <div className='flex items-center gap-4'>
                <Button
                  onClick={togglePlay}
                  className='flex items-center gap-2'
                  variant={isPlaying ? 'destructive' : 'default'}
                >
                  {isPlaying ? (
                    <Pause className='w-4 h-4' />
                  ) : (
                    <Play className='w-4 h-4' />
                  )}
                  {isPlaying ? '暂停' : '播放'}
                </Button>

                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setVolume(0)}
                  >
                    <VolumeX className='w-4 h-4' />
                  </Button>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={volume}
                    onChange={handleVolumeChange}
                    className='w-24'
                    aria-label='音量控制'
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setVolume(100)}
                  >
                    <Volume2 className='w-4 h-4' />
                  </Button>
                  <span className='text-sm text-gray-600'>{volume}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 链接测试区域 */}
        <Card>
          <CardHeader>
            <CardTitle>链接测试区域</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>各种链接类型</h3>
              <div className='space-y-2'>
                <div>
                  <a href='#' className='text-blue-600 hover:underline'>
                    普通链接
                  </a>
                </div>
                <div>
                  <a
                    href='https://example.com'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:underline flex items-center gap-1'
                  >
                    外部链接 <span className='text-xs'>↗</span>
                  </a>
                </div>
                <div>
                  <a
                    href='mailto:test@example.com'
                    className='text-blue-600 hover:underline flex items-center gap-1'
                  >
                    <Mail className='w-4 h-4' />
                    邮件链接
                  </a>
                </div>
                <div>
                  <a
                    href='tel:+1234567890'
                    className='text-blue-600 hover:underline flex items-center gap-1'
                  >
                    <Phone className='w-4 h-4' />
                    电话链接
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 表单测试区域 */}
        <Card>
          <CardHeader>
            <CardTitle>表单测试区域</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium mb-1'
                  >
                    姓名
                  </label>
                  <input
                    id='name'
                    type='text'
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='请输入您的姓名'
                  />
                </div>

                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium mb-1'
                  >
                    邮箱
                  </label>
                  <input
                    id='email'
                    type='email'
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='请输入您的邮箱'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='category'
                  className='block text-sm font-medium mb-1'
                >
                  类别
                </label>
                <select
                  id='category'
                  value={formData.category}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, category: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>请选择类别</option>
                  <option value='general'>一般咨询</option>
                  <option value='technical'>技术支持</option>
                  <option value='billing'>账单问题</option>
                  <option value='feedback'>意见反馈</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='message'
                  className='block text-sm font-medium mb-1'
                >
                  消息
                </label>
                <textarea
                  id='message'
                  value={formData.message}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='请输入您的消息...'
                />
              </div>

              <div className='flex items-center gap-2'>
                <input
                  id='newsletter'
                  type='checkbox'
                  checked={formData.newsletter}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      newsletter: e.target.checked,
                    }))
                  }
                  className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <label htmlFor='newsletter' className='text-sm'>
                  订阅我们的新闻通讯
                </label>
              </div>

              <div className='flex gap-2'>
                <Button type='submit'>提交表单</Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setFormData({
                      name: '',
                      email: '',
                      message: '',
                      category: '',
                      newsletter: false,
                    })
                  }
                >
                  重置表单
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 欢迎横幅 */}
        <div className='bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg'>
          <h2 className='text-3xl font-bold mb-2'>欢迎来到 TechStore</h2>
          <p className='text-lg opacity-90'>
            发现最新的科技产品，享受优质购物体验
          </p>
          <Button className='mt-4 bg-white text-blue-600 hover:bg-gray-100'>
            立即购买
          </Button>
        </div>

        {/* Todo 列表测试 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>Todo 列表测试</span>
              <Button
                onClick={addTodo}
                size='sm'
                className='flex items-center gap-1'
              >
                <Plus className='w-4 h-4' />
                添加任务
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {todoItems.map(item => (
                <div
                  key={item.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <button
                      onClick={() => toggleTodo(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {item.completed && <Check className='w-3 h-3' />}
                    </button>
                    <span
                      className={`${
                        item.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge variant={item.completed ? 'default' : 'secondary'}>
                      {item.completed ? '已完成' : '待完成'}
                    </Badge>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => deleteTodo(item.id)}
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ARIA 和可访问性测试 */}
        <Card>
          <CardHeader>
            <CardTitle>ARIA 和可访问性测试</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>ARIA 角色元素</h3>
              <div className='flex flex-wrap gap-2'>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={() => alert('ARIA 按钮点击')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      alert('ARIA 按钮键盘激活');
                    }
                  }}
                  className='px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  ARIA 按钮
                </div>

                <div
                  role='tab'
                  tabIndex={0}
                  aria-selected='false'
                  onClick={() => alert('ARIA 标签页点击')}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500'
                >
                  ARIA 标签页
                </div>

                <div
                  role='menuitem'
                  tabIndex={0}
                  onClick={() => alert('ARIA 菜单项点击')}
                  className='px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500'
                >
                  ARIA 菜单项
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-2'>可访问性标签</h3>
              <div className='space-y-2'>
                <button
                  aria-label='关闭对话框'
                  onClick={() => alert('关闭对话框')}
                  className='p-2 bg-red-500 text-white rounded hover:bg-red-600'
                >
                  <X className='w-4 h-4' />
                </button>

                <button
                  aria-describedby='help-text'
                  onClick={() => alert('帮助按钮')}
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  帮助
                </button>
                <div id='help-text' className='text-sm text-gray-600'>
                  点击此按钮获取帮助信息
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 文件上传测试 */}
        <Card>
          <CardHeader>
            <CardTitle>文件上传测试</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label
                htmlFor='file-upload'
                className='block text-sm font-medium mb-2'
              >
                选择文件
              </label>
              <input
                id='file-upload'
                ref={fileInputRef}
                type='file'
                multiple
                accept='.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx'
                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              />
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-2'
              >
                <Upload className='w-4 h-4' />
                选择文件
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                清除文件
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 产品网格 */}
        <div>
          <h3 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6'>
            热门商品
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {products.map(product => (
              <Card
                key={product.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader className='text-center'>
                  <div className='text-6xl mb-2'>{product.image}</div>
                  <CardTitle className='text-lg'>{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-gray-600 dark:text-gray-400 text-sm mb-3'>
                    {product.description}
                  </p>

                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-2xl font-bold text-blue-600'>
                      {product.price}
                    </span>
                    <div className='flex items-center gap-1'>
                      <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm text-gray-600'>
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      onClick={() => addToCart(product.id)}
                      className='flex-1'
                      size='sm'
                    >
                      <ShoppingCart className='h-4 w-4 mr-1' />
                      加入购物车
                    </Button>
                    <Button
                      onClick={() => toggleLike(product.id)}
                      variant='outline'
                      size='sm'
                      className={
                        likedItems.includes(product.id)
                          ? 'text-red-500 border-red-500'
                          : ''
                      }
                    >
                      <Heart
                        className={`h-4 w-4 ${likedItems.includes(product.id) ? 'fill-red-500' : ''}`}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 动态内容测试 */}
        <Card>
          <CardHeader>
            <CardTitle>动态内容测试</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>动态添加的元素</h3>
              <div id='dynamic-content' className='space-y-2'>
                <Button
                  onClick={() => {
                    const container =
                      document.getElementById('dynamic-content');
                    if (container) {
                      const newButton = document.createElement('button');
                      newButton.textContent = `动态按钮 ${Date.now()}`;
                      newButton.className =
                        'px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mr-2 mb-2';
                      newButton.onclick = () =>
                        alert(`点击了 ${newButton.textContent}`);
                      container.appendChild(newButton);
                    }
                  }}
                >
                  添加动态按钮
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 隐藏和禁用元素测试 */}
        <Card>
          <CardHeader>
            <CardTitle>隐藏和禁用元素测试</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <Button>正常按钮</Button>
              <Button disabled>禁用按钮</Button>
              <Button style={{ visibility: 'hidden' }}>隐藏按钮</Button>
              <Button style={{ display: 'none' }}>不显示按钮</Button>
              <Button style={{ opacity: 0.3 }}>半透明按钮</Button>
            </div>

            <div className='space-y-2'>
              <div>
                <input
                  type='text'
                  placeholder='正常输入框'
                  className='px-3 py-2 border rounded'
                />
              </div>
              <div>
                <input
                  type='text'
                  placeholder='禁用输入框'
                  disabled
                  className='px-3 py-2 border rounded'
                />
              </div>
              <div style={{ visibility: 'hidden' }}>
                <input
                  type='text'
                  placeholder='隐藏输入框'
                  className='px-3 py-2 border rounded'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 互动区域 */}
        <div className='bg-gray-50 dark:bg-slate-800 p-6 rounded-lg'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200 mb-4'>
            与我们互动
          </h3>
          <div className='flex gap-4'>
            <Button variant='outline' className='flex items-center gap-2'>
              <MessageCircle className='h-4 w-4' />
              在线客服
            </Button>
            <Button variant='outline' className='flex items-center gap-2'>
              <Share2 className='h-4 w-4' />
              分享给朋友
            </Button>
            <Button variant='outline' className='flex items-center gap-2'>
              <Star className='h-4 w-4' />
              评价我们
            </Button>
          </div>
        </div>
      </main>

      {/* 页面底部 */}
      <footer className='bg-gray-800 text-white p-6 mt-8'>
        <div className='text-center'>
          <p className='text-lg font-semibold mb-2'>
            TechStore - 您的科技购物首选
          </p>
          <p className='text-gray-400 text-sm'>
            这是一个演示页面，用于测试 Browser-Use JS AI 代理的交互能力
          </p>
          <div className='mt-4 flex justify-center gap-4 text-sm'>
            <a href='#' className='hover:text-blue-400'>
              关于我们
            </a>
            <a href='#' className='hover:text-blue-400'>
              联系方式
            </a>
            <a href='#' className='hover:text-blue-400'>
              隐私政策
            </a>
            <a href='#' className='hover:text-blue-400'>
              服务条款
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

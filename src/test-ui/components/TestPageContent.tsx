/**
 * @file purpose: 测试页面内容组件，用于在左侧区域显示示例网页内容
 */

import React, { useState } from 'react';
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
} from 'lucide-react';

/**
 * 测试页面内容组件
 * 模拟一个简单的电商网站页面，用于演示AI代理的交互能力
 */
export function TestPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(0);
  const [likedItems, setLikedItems] = useState<number[]>([]);

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

  return (
    <div className='h-full bg-white dark:bg-slate-900 overflow-auto'>
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

      {/* 主要内容区域 */}
      <main className='p-6'>
        {/* 欢迎横幅 */}
        <div className='bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg mb-8'>
          <h2 className='text-3xl font-bold mb-2'>欢迎来到 TechStore</h2>
          <p className='text-lg opacity-90'>
            发现最新的科技产品，享受优质购物体验
          </p>
          <Button className='mt-4 bg-white text-blue-600 hover:bg-gray-100'>
            立即购买
          </Button>
        </div>

        {/* 产品网格 */}
        <div className='mb-8'>
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

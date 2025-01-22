'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Share2, MoreVertical, ImageIcon, VideoIcon, ThumbsUp, Heart, Bookmark, Send, Smile, AtSign, Hash, X } from 'lucide-react'
import { Tooltip } from "@/components/ui/tooltip"
import { Search } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Bell } from 'lucide-react'
import { BASE_URL } from "@/Constants/Server"
import LinearProgress from "@mui/material/LinearProgress"
import { toast } from "sonner"
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'

export default function SocialFeed() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activePost, setActivePost] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [posts, setPosts] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [newPosts, setNewPosts] = useState([])
  const [blips, setBlips] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlip, setSelectedBlip] = useState(null)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tags: '',
    visibility: 'public',
    media: [],
    productIds: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef(null)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }, [selectedTab])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (!sellerToken) return

        const tokenData = JSON.parse(sellerToken)
        const token = tokenData.data

        switch (selectedTab) {
          case 'all':
            const postsRes = await fetch(`${BASE_URL}/posts`)
            const postsData = await postsRes.json()
            setPosts(postsData.posts)
            break

          case 'trending':
            const trendingRes = await fetch(`${BASE_URL}/posts/trending?page=1&limit=10`)
            const trendingData = await trendingRes.json()
            setTrendingPosts(trendingData.posts)
            break

          case 'new':
            const newRes = await fetch(`${BASE_URL}/posts/new?page=1&limit=10`)
            const newData = await newRes.json()
            setNewPosts(newData.posts)
            break

          case 'blips':
            const blipsRes = await fetch(`${BASE_URL}/products/blips?page=1&limit=10`)
            const blipsData = await blipsRes.json()
            setBlips(blipsData.blips)
            break

          case 'my-posts':
            const profileRes = await fetch(`${BASE_URL}/seller/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const profileData = await profileRes.json()
            const sellerId = profileData._id

            const myPostsRes = await fetch(`${BASE_URL}/posts/user/Seller/${sellerId}`)
            const myPostsData = await myPostsRes.json()
            setMyPosts(myPostsData.posts)
            break
        }

        const conversationsRes = await fetch(`${BASE_URL}/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const conversationsData = await conversationsRes.json()
        setConversations(conversationsData.conversations)

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedTab])

  const handleOpenPostActivity = (post) => {
    setActivePost(post)
  }

  const handleClosePostActivity = () => {
    setActivePost(null)
  }

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (!response.ok) throw new Error('Failed to add comment')

      const updatedPost = await response.json()
      setActivePost(updatedPost)
      setNewComment('')
      toast.success('Comment added successfully')

    } catch (error) {
      toast.error('Failed to add comment: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReact = async (postId) => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to react to post')

      fetchPosts()

    } catch (error) {
      toast.error('Failed to react to post: ' + error.message)
    }
  }

  const renderPosts = () => {
    let postsToRender = []
    switch (selectedTab) {
      case 'all':
        postsToRender = posts
        break
      case 'trending':
        postsToRender = trendingPosts
        break
      case 'new':
        postsToRender = newPosts
        break
      case 'my-posts':
        postsToRender = myPosts
        break
      default:
        postsToRender = posts
    }

    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600">No posts available</h3>
          <p className="text-gray-500 mt-2">Check back later for new content</p>
        </div>
      )
    }

    return postsToRender.map((post) => {
      if (!post || !post._id) return null

      const authorName = post.author?.name || post.author?.businessName || 'Anonymous'
      const authorImage = post.author?.image
      const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'
      const postBody = post.body || ''
      const postTags = Array.isArray(post.tags) ? post.tags : []
      const postImages = Array.isArray(post.images) ? post.images : []
      const reactionCount = post.reactions?.reduce((sum, r) => sum + (r.count || 0), 0) || 0
      const commentCount = Array.isArray(post.comments) ? post.comments.length : 0

      return (
        <Card key={post._id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center space-y-0 p-4">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 uppercase ring-2 ring-green/10">
                <AvatarImage src={authorImage} />
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold u hover:underline cursor-pointer">
                  {authorName}
                </p>
                <p className="text-sm text-gray-500">{postDate}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-lg">{postBody}</p>
            {postTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {postTags.map((tag, index) => (
                  <Badge
                    key={`${tag}-${index}`}
                    variant="secondary"
                    className="hover:bg-green/10 cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {postImages.length > 0 && (
              <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-4 p-4">
                  <div className="flex-1">
                    <Carousel
                      ref={carouselRef}
                      showThumbs={false}
                      showStatus={false}
                      showIndicators={false}
                      selectedItem={currentSlide}
                      onChange={(index) => setCurrentSlide(index)}
                      className="main-carousel"
                    >
                      {postImages.map((img, i) => (
                        <div 
                          key={i} 
                          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                        >
                          <img
                            src={img.url}
                            alt={`Post image ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </Carousel>
                  </div>
                  
                  {postImages.length > 1 && (
                    <div className="w-32 space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                      {postImages.map((img, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCurrentSlide(index)
                            carouselRef.current.moveTo(index)
                          }}
                          className={`
                            relative aspect-[16/9] rounded-lg overflow-hidden cursor-pointer
                            transition-all duration-200 hover:ring-2 hover:ring-green-500
                            ${currentSlide === index ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-200 dark:ring-gray-700'}
                          `}
                        >
                          <img
                            src={img.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className={`
                            absolute inset-0 bg-black/10 transition-opacity duration-200
                            ${currentSlide === index ? 'opacity-0' : 'hover:opacity-0'}
                          `} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleReact(post._id)}>
                  <Heart className={`h-4 w-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                  {reactionCount}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleOpenPostActivity(post)}>
                  <MessageCircle className="h-4 w-4" />
                  {commentCount}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark className={`h-4 w-4 ${post.bookmarked ? 'fill-current' : ''}`} />
                Save
              </Button>
            </div>
          </CardFooter>
        </Card>
      )
    })
  }

  const renderPostActivity = () => {
    if (!activePost) return null

    const reactions = activePost.reactions || []
    const comments = activePost.comments || []

    const getAuthorInitial = (author) => {
      if (!author) return 'A'
      if (typeof author === 'string') return author.charAt(0)
      if (author.name) return author.name.charAt(0)
      if (author.businessName) return author.businessName.charAt(0)
      return 'A'
    }

    const getAuthorName = (author) => {
      if (!author) return 'Anonymous'
      if (typeof author === 'string') return author
      if (author.name) return author.name
      if (author.businessName) return author.businessName
      return 'Anonymous'
    }

    return (
      <Dialog open={!!activePost} onOpenChange={handleClosePostActivity}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Reactions</h3>
              <div className="flex gap-2 flex-wrap">
                {reactions.map((reaction, index) => (
                  <Button key={index} variant="outline" size="sm" className="gap-2">
                    {reaction.type}
                    <span className="font-semibold">{reaction.count || 0}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Comments</h3>
              <ScrollArea className="h-[400px] pr-4">
                {comments.map((comment, index) => (
                  <div
                    key={comment._id || index}
                    className="flex items-start gap-3 mb-6"
                  >
                    <Avatar>
                      <AvatarImage
                        src={comment.author?.image}
                        alt={getAuthorName(comment.author)}
                      />
                      <AvatarFallback>
                        {getAuthorInitial(comment.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <p className="font-semibold">
                          {getAuthorName(comment.author)}
                        </p>
                        <p className="text-sm mt-1">{comment.content || ''}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleDateString()
                            : 'Recently'
                          }
                        </span>
                        <button className="hover:text-gray-700">Like</button>
                        <button className="hover:text-gray-700">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>

              <div className="flex items-center gap-2 mt-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAddComment(activePost._id)}
                  disabled={!newComment.trim() || isLoading}
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleTabChange = (value) => {
    setSelectedTab(value)
  }

  const renderBlips = () => {
    if (!blips || blips.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600">No blips available</h3>
          <p className="text-gray-500 mt-2">Check back later for new content</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {blips.map(blip => (
          <div
            key={blip._id}
            className="relative group cursor-pointer"
            onClick={() => handleBlipClick(blip)}
          >
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden">
              <img
                src={blip.images || "https://v0.dev/placeholder.svg"}
                alt={blip.productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-white">{blip.productName}</h3>
                <p className="text-sm text-gray-200">₦{blip.price?.toLocaleString()}</p>
                <div className="flex justify-between text-xs text-gray-300 mt-2">
                  <span>{blip.reviewCount || 0} reviews</span>
                  <span>Rating: {blip.averageRating || 'N/A'}</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const handleBlipClick = (blip) => {
    setSelectedBlip(blip)
  }

  const handleCloseVideo = () => {
    setSelectedBlip(null)
  }

  const renderVideoPlayer = () => {
    if (!selectedBlip) return null

    return (
      <Dialog open={!!selectedBlip} onOpenChange={handleCloseVideo}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
              onClick={handleCloseVideo}
            >
              <X className="h-6 w-6" />
            </Button>

            <video
              src={selectedBlip.blipUrl}
              className="w-full aspect-[9/16]"
              controls
              autoPlay
              playsInline
            >
              Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedBlip.productName}
              </h3>
              <div className="flex justify-between items-center">
                <p className="text-lg text-white">
                  ₦{selectedBlip.price?.toLocaleString()}
                </p>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    console.log('View product:', selectedBlip.productId)
                  }}
                >
                  View Product
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const formData = new FormData()
      formData.append('title', postForm.title)
      formData.append('body', postForm.body)
      formData.append('tags', postForm.tags)
      formData.append('visibility', postForm.visibility)

      postForm.media.forEach(file => {
        formData.append('media', file)
      })

      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to create post')

      toast.success('Post created successfully')
      setIsCreatePostOpen(false)
      setPostForm({
        title: '',
        body: '',
        tags: '',
        visibility: 'public',
        media: [],
        productIds: []
      })

      fetchPosts()

    } catch (error) {
      toast.error('Failed to create post: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete post')

      toast.success('Post deleted successfully')
      fetchPosts()

    } catch (error) {
      toast.error('Failed to delete post: ' + error.message)
    }
  }

  const renderCreatePostModal = () => {
    return (
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
                required
              />
            </div>

            <div>
              <Label htmlFor="body">Content</Label>
              <Textarea
                id="body"
                value={postForm.body}
                onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="What's on your mind?"
                required
              />
            </div>

            <div>
              <Label htmlFor="media">Media</Label>
              <Input
                id="media"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setPostForm(prev => ({
                  ...prev,
                  media: Array.from(e.target.files)
                }))}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can select multiple images and videos
              </p>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={postForm.tags}
                onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={postForm.visibility}
                onValueChange={(value) => setPostForm(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen dark:bg-gray-900'>
      <div className='py-8 px-4'>
        <header className='flex items-center justify-between mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-950 bg-clip-text text-transparent'>
            Auqli Connect
          </h1>
          <div className='flex items-center gap-4'>
            <Input
              placeholder="Search posts, people, or tags..."
              className="w-64 bg-white dark:bg-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search className="w-4 h-4 text-gray-400" />}
            />
            <Button variant="outline" className="gap-2">
              <Bell className="w-4 h-4" />
              <Badge variant="secondary" className="ml-1">3</Badge>
            </Button>
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Post
            </Button>
          </div>
        </header>

        <div className="flex gap-6">
          <div className="flex-1">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8 p-1 rounded-xl">
                {["all", "new", "trending", "my-posts", "blips"].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:bg-gray-950 data-[state=active]:text-white rounded-lg transition-all"
                  >
                    {tab.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="new" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="my-posts" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="blips">
                {renderBlips()}
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-80 hidden lg:block">
            <Card className="sticky top-8">
              <CardHeader className="p-4">
                <h2 className="text-xl font-bold">Messages</h2>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <CardContent className="p-4 space-y-4">
                  {conversations.map(chat => (
                    <div
                      key={chat._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={chat.participant.image || "https://v0.dev/placeholder.svg"} />
                          <AvatarFallback>{chat.participant.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{chat.participant.name}</p>
                          {chat.unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage?.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(chat.lastMessage?.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {renderPostActivity()}
      {renderVideoPlayer()}
      {renderCreatePostModal()}
    </div>
  )
}

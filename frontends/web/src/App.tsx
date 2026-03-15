/**
 * Main App Component
 * Root component with React Router for navigation
 * 
 * Features:
 * - React Router for client-side routing
 * - Protected routes requiring authentication
 * - Navigation menu for authenticated users
 * - Routes for login, post list, post form, and WebSocket chat
 * 
 * Requirements: 6.1
 */

import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Login } from './components/Login';
import { PostList } from './components/PostList';
import { PostForm } from './components/PostForm';
import { WebSocketChat } from './components/WebSocketChat';
import { GraphEditor } from './components/graph-editor/GraphEditor';
import { Dashboard } from './components/Dashboard';
import { Skills } from './components/Skills';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Post } from './types';
import './App.css';
import { useState } from 'react';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

/**
 * Layout Component
 * Provides navigation menu and logout functionality for authenticated pages
 */
function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>FastAPI Neo4j Multi-Frontend System</h1>
        <nav className="app-nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/posts" className="nav-link">Posts</Link>
          <Link to="/create" className="nav-link">Create Post</Link>
          <Link to="/chat" className="nav-link">Chat</Link>
          <Link to="/graph-editor" className="nav-link">Graph Editor</Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </nav>
      </header>
      <main className="app-content">
        {children}
      </main>
    </div>
  );
}

/**
 * Posts Page Component
 * Displays post list and handles editing
 */
function PostsPage() {
  const navigate = useNavigate();

  const handleEdit = (post: Post) => {
    navigate('/edit', { state: { post } });
  };

  return <PostList onEdit={handleEdit} />;
}

/**
 * Create Post Page Component
 */
function CreatePostPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/posts');
  };

  const handleCancel = () => {
    navigate('/posts');
  };

  return <PostForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}

/**
 * Edit Post Page Component
 */
function EditPostPage() {
  const navigate = useNavigate();
  const [post] = useState<Post | null>(() => {
    // Get post from navigation state
    const state = window.history.state?.usr?.post;
    return state || null;
  });

  const handleSuccess = () => {
    navigate('/posts');
  };

  const handleCancel = () => {
    navigate('/posts');
  };

  if (!post) {
    return <Navigate to="/posts" replace />;
  }

  return <PostForm post={post} onSuccess={handleSuccess} onCancel={handleCancel} />;
}

/**
 * Login Page Component
 */
function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

/**
 * Chat Page Component
 */
function ChatPage() {
  return <WebSocketChat />;
}

/**
 * Graph Editor Page Component
 */
function GraphEditorPage() {
  return <GraphEditor />;
}

/**
 * Main App Component
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <Layout>
                  <Skills />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <Layout>
                  <PostsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreatePostPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditPostPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graph-editor"
            element={
              <ProtectedRoute>
                <Layout>
                  <GraphEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

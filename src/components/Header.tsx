import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search, Plus, Menu, User, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { AuthModal } from "./AuthModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { searchQuery, selectedTags, setSearchQuery, clearSearch, removeTag, isSearching } = useSearch();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the query
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
              StackIt
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:hidden">
              SI
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 bg-gray-50/80 border-gray-200/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {(searchQuery || selectedTags.length > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <Link to="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            {isAuthenticated && (
              <Link to="/my-questions">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  My Questions
                </Button>
              </Link>
            )}
            <Link to="/users">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                      {user?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.reputation} reputation</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)} className="hidden sm:flex">
                  Login
                </Button>
                <Button size="sm" onClick={() => setShowAuthModal(true)}>
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 bg-gray-50/80 border-gray-200/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(searchQuery || selectedTags.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>

        {/* Tag Filters */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-4">
            <span className="text-sm text-gray-600 mr-2 flex items-center">Filtered by:</span>
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="text-xs h-6 text-gray-600 hover:text-gray-800"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </header>
  );
};

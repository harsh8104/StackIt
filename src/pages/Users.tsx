import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users as UsersIcon, ChevronLeft, ChevronRight, User, Calendar, X } from "lucide-react";
import { Header } from "@/components/Header";
import { api, User as UserType } from "@/services/api";
import { Link } from "react-router-dom";

const Users = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch users from API
    const { data: usersData, isLoading, error, refetch } = useQuery({
        queryKey: ['users', currentPage, searchQuery],
        queryFn: async () => {
            if (searchQuery.trim()) {
                const result = await api.searchUsers({
                    query: searchQuery.trim(),
                    page: currentPage,
                    limit: 20,
                });
                return result;
            } else {
                const result = await api.getAllUsers({
                    page: currentPage,
                    limit: 20,
                });
                return result;
            }
        },
        retry: 2,
        staleTime: 30000,
        enabled: !isSearching,
    });

    // Fetch questions for selected user
    const { data: userQuestionsData, isLoading: loadingQuestions } = useQuery({
        queryKey: ['userQuestions', selectedUser?._id],
        queryFn: async () => {
            if (!selectedUser) return { questions: [], pagination: { total: 0 } };
            const result = await api.getQuestionsByUser(selectedUser._id, {
                page: 1,
                limit: 10,
            });
            return result;
        },
        enabled: !!selectedUser,
        retry: 2,
        staleTime: 30000,
    });

    const users = usersData?.users || [];
    const userQuestions = userQuestionsData?.questions || [];

    // Reset page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(false);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
        setIsSearching(false);
    };

    const handleUserClick = (user: UserType) => {
        setSelectedUser(user);
    };

    const handleBackToUsers = () => {
        setSelectedUser(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (error) {
        console.error('Error fetching users:', error);
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">Error loading users</p>
                            <Button onClick={() => refetch()}>Retry</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        {selectedUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToUsers}
                                className="flex items-center space-x-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Back to Users</span>
                            </Button>
                        )}
                        <div className="flex items-center space-x-2">
                            <UsersIcon className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-800">
                                {selectedUser ? `${selectedUser.username}'s Questions` : 'All Users'}
                            </h1>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        {isLoading ? 'Loading...' : selectedUser ? `${userQuestions.length} questions` : `${usersData?.pagination?.total || 0} users`}
                    </div>
                </div>

                {/* Search Bar */}
                {!selectedUser && (
                    <div className="mb-6">
                        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search users by username or bio..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearching(true)}
                                className="pl-10 pr-10 bg-white/80 backdrop-blur-sm border-white/20 focus:bg-white transition-all"
                            />
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </form>
                        {searchQuery && (
                            <p className="text-sm text-gray-600 mt-2">
                                Searching for: "{searchQuery}"
                            </p>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Users List */}
                {!isLoading && !selectedUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <Card
                                key={user._id}
                                className="bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all cursor-pointer hover:shadow-lg"
                                onClick={() => handleUserClick(user)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {user.username}
                                            </h3>
                                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                                                <span>{user.reputation} reputation</span>
                                            </p>
                                            {user.bio && (
                                                <p className="text-sm text-gray-500 mt-1 truncate">
                                                    {user.bio}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-1 mt-2">
                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    Joined {formatDate(user.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {user.badges && user.badges.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {user.badges.slice(0, 3).map((badge, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {badge}
                                                </Badge>
                                            ))}
                                            {user.badges.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{user.badges.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* User Questions */}
                {selectedUser && !loadingQuestions && (
                    <div className="space-y-4">
                        {userQuestions.map((question) => (
                            <Card key={question._id} className="bg-white/60 backdrop-blur-sm border-white/20">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <Link
                                                to={`/question/${question._id}`}
                                                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                            >
                                                {question.title}
                                            </Link>
                                            <p className="text-gray-600 mt-2 line-clamp-2">
                                                {question.description}
                                            </p>
                                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                                <span>{question.voteCount} votes</span>
                                                <span>{question.answerCount} answers</span>
                                                <span>{question.views} views</span>
                                                <span>{formatDate(question.createdAt)}</span>
                                            </div>
                                            {question.tags && question.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    {question.tags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {userQuestions.length === 0 && (
                            <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/20">
                                <p className="text-gray-600">
                                    {selectedUser.username} hasn't asked any questions yet.
                                </p>
                            </Card>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!selectedUser && usersData?.pagination && usersData.pagination.pages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {usersData.pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(usersData.pagination.pages, prev + 1))}
                            disabled={currentPage === usersData.pagination.pages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* No Results */}
                {!isLoading && !selectedUser && users.length === 0 && (
                    <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/20">
                        <p className="text-gray-600">
                            No users found.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Users; 
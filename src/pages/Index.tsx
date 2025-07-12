
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { QuestionCard } from "@/components/QuestionCard";
import { AskQuestionModal } from "@/components/AskQuestionModal";
import { api, Question, Tag } from "@/services/api";
import { useSearch } from "@/contexts/SearchContext";

const Index = () => {
  const { searchQuery, selectedTags, addTag, isSearching } = useSearch();
  const [showAskModal, setShowAskModal] = useState(false);

  // Fetch questions from API
  const { data: questionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['questions', searchQuery, selectedTags],
    queryFn: async () => {
      console.log('Fetching questions with:', { search: searchQuery, tags: selectedTags });
      const result = await api.getQuestions({
        search: searchQuery.trim() ? searchQuery : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 20,
        sort: 'newest'
      });
      console.log('Questions result:', result);
      return result;
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Fetch popular tags
  const { data: popularTags = [] } = useQuery({
    queryKey: ['popularTags'],
    queryFn: async () => {
      return api.getPopularTags(20);
    },
  });

  const questions = questionsData?.questions || [];

  const handleTagClick = (tag: string) => {
    addTag(tag);
  };

  if (error) {
    console.error('Error fetching questions:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading questions</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                {isSearching ? `Search Results${searchQuery ? ` for "${searchQuery}"` : ''}` : 'Latest Questions'}
              </h1>
              <div className="text-sm text-gray-600">
                {isLoading ? 'Loading...' : `${questions.length} questions`}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Questions List */}
            {!isLoading && (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard key={question._id} question={question} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && questions.length === 0 && (
              <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/20">
                <p className="text-gray-600">
                  {isSearching
                    ? `No questions found matching "${searchQuery}"`
                    : "No questions found matching your criteria."
                  }
                </p>
                <Button
                  onClick={() => setShowAskModal(true)}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Ask Question
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <h3 className="font-semibold text-gray-800">Popular Tags</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag._id}
                      variant={selectedTags.includes(tag.name) ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <h3 className="font-semibold text-gray-800">Community Stats</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions</span>
                  <span className="font-semibold">{questionsData?.pagination?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tags</span>
                  <span className="font-semibold">{popularTags.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AskQuestionModal
        open={showAskModal}
        onOpenChange={setShowAskModal}
      />
    </div>
  );
};

export default Index;


import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ChevronUp, ChevronDown, Check, Clock, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/Header";
import { RichTextEditor } from "@/components/RichTextEditor";
import { api, Question, Answer } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const QuestionPage = () => {
  const { id } = useParams();
  const [newAnswer, setNewAnswer] = useState("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch question data
  const { data: question, isLoading: questionLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: async () => {
      if (!id) throw new Error('Question ID is required');
      return api.getQuestion(id);
    },
    enabled: !!id,
  });

  // Fetch answers data
  const { data: answersData, isLoading: answersLoading } = useQuery({
    queryKey: ['answers', id],
    queryFn: async () => {
      if (!id) throw new Error('Question ID is required');
      return api.getAnswers(id);
    },
    enabled: !!id,
  });

  // Vote question mutation
  const voteQuestionMutation = useMutation({
    mutationFn: async (voteType: 'upvote' | 'downvote') => {
      if (!id) throw new Error('Question ID is required');
      return api.voteQuestion(id, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  // Remove vote question mutation
  const removeVoteQuestionMutation = useMutation({
    mutationFn: async (voteType: 'upvote' | 'downvote') => {
      if (!id) throw new Error('Question ID is required');
      return api.removeVote(id, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      toast({
        title: "Vote removed",
        description: "Your vote has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove vote",
        variant: "destructive",
      });
    },
  });

  // Vote answer mutation
  const voteAnswerMutation = useMutation({
    mutationFn: async ({ answerId, voteType }: { answerId: string; voteType: 'upvote' | 'downvote' }) => {
      return api.voteAnswer(answerId, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  // Remove vote answer mutation
  const removeVoteAnswerMutation = useMutation({
    mutationFn: async ({ answerId, voteType }: { answerId: string; voteType: 'upvote' | 'downvote' }) => {
      return api.removeVoteAnswer(answerId, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      toast({
        title: "Vote removed",
        description: "Your vote has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove vote",
        variant: "destructive",
      });
    },
  });

  // Create answer mutation
  const createAnswerMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!id) throw new Error('Question ID is required');
      return api.createAnswer({ content, questionId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      setNewAnswer("");
      toast({
        title: "Success",
        description: "Answer posted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post answer",
        variant: "destructive",
      });
    },
  });

  const handleVoteQuestion = (voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to vote",
        variant: "destructive",
      });
      return;
    }

    if (!question) return;

    // Check if user is voting on their own question
    if (question.author._id === user?._id) {
      toast({
        title: "Cannot vote on own question",
        description: "You cannot vote on your own question",
        variant: "destructive",
      });
      return;
    }

    // Check if user has already voted
    const hasUpvoted = question.votes.upvotes.some(vote => vote.user === user?._id);
    const hasDownvoted = question.votes.downvotes.some(vote => vote.user === user?._id);

    if (voteType === 'upvote' && hasUpvoted) {
      // Remove upvote
      removeVoteQuestionMutation.mutate(voteType);
    } else if (voteType === 'downvote' && hasDownvoted) {
      // Remove downvote
      removeVoteQuestionMutation.mutate(voteType);
    } else {
      // Add vote
      voteQuestionMutation.mutate(voteType);
    }
  };

  const handleVoteAnswer = (answerId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to vote",
        variant: "destructive",
      });
      return;
    }

    const answer = answers.find(a => a._id === answerId);
    if (!answer) return;

    // Check if user is voting on their own answer
    if (answer.author._id === user?._id) {
      toast({
        title: "Cannot vote on own answer",
        description: "You cannot vote on your own answer",
        variant: "destructive",
      });
      return;
    }

    // Check if user has already voted
    const hasUpvoted = answer.votes.upvotes.some(vote => vote.user === user?._id);
    const hasDownvoted = answer.votes.downvotes.some(vote => vote.user === user?._id);

    if (voteType === 'upvote' && hasUpvoted) {
      // Remove upvote
      removeVoteAnswerMutation.mutate({ answerId, voteType });
    } else if (voteType === 'downvote' && hasDownvoted) {
      // Remove downvote
      removeVoteAnswerMutation.mutate({ answerId, voteType });
    } else {
      // Add vote
      voteAnswerMutation.mutate({ answerId, voteType });
    }
  };

  const handleSubmitAnswer = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to post an answer",
        variant: "destructive",
      });
      return;
    }

    if (newAnswer.trim()) {
      createAnswerMutation.mutate(newAnswer);
    }
  };

  const answers = answersData?.answers || [];

  // Check vote states for question
  const questionHasUpvoted = question?.votes.upvotes.some(vote => vote.user === user?._id) || false;
  const questionHasDownvoted = question?.votes.downvotes.some(vote => vote.user === user?._id) || false;

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Question not found</h1>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Back to Questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center space-y-2 min-w-[60px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-8 w-8 ${questionHasUpvoted ? 'text-green-600 bg-green-50' : 'hover:text-green-600'}`}
                      onClick={() => handleVoteQuestion('upvote')}
                      disabled={voteQuestionMutation.isPending || removeVoteQuestionMutation.isPending}
                    >
                      <ChevronUp className="h-5 w-5" />
                    </Button>
                    <span className="font-bold text-lg text-gray-700">{question.voteCount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-8 w-8 ${questionHasDownvoted ? 'text-red-600 bg-red-50' : 'hover:text-red-600'}`}
                      onClick={() => handleVoteQuestion('downvote')}
                      disabled={voteQuestionMutation.isPending || removeVoteQuestionMutation.isPending}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                      {question.title}
                    </h1>

                    <div className="prose prose-gray max-w-none mb-6">
                      <p className="text-gray-700 leading-relaxed">
                        {question.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Question Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Asked {timeAgo}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{question.answerCount} answer{question.answerCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {question.author.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hover:text-blue-600 cursor-pointer transition-colors">
                          {question.author.username}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Answers Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {answers.length} Answer{answers.length !== 1 ? 's' : ''}
              </h2>

              {answersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                answers.map((answer) => {
                  const answerHasUpvoted = answer.votes.upvotes.some(vote => vote.user === user?._id);
                  const answerHasDownvoted = answer.votes.downvotes.some(vote => vote.user === user?._id);

                  return (
                    <Card key={answer._id} className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {/* Vote Section */}
                          <div className="flex flex-col items-center space-y-2 min-w-[60px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-8 w-8 ${answerHasUpvoted ? 'text-green-600 bg-green-50' : 'hover:text-green-600'}`}
                              onClick={() => handleVoteAnswer(answer._id, 'upvote')}
                              disabled={voteAnswerMutation.isPending || removeVoteAnswerMutation.isPending}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-gray-700">{answer.voteCount}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-8 w-8 ${answerHasDownvoted ? 'text-red-600 bg-red-50' : 'hover:text-red-600'}`}
                              onClick={() => handleVoteAnswer(answer._id, 'downvote')}
                              disabled={voteAnswerMutation.isPending || removeVoteAnswerMutation.isPending}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            {answer.isAccepted && (
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>

                          {/* Answer Content */}
                          <div className="flex-1">
                            <div className="prose prose-gray max-w-none mb-4">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {answer.content}
                              </p>
                            </div>

                            {/* Answer Meta */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                    {answer.author.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="hover:text-blue-600 cursor-pointer transition-colors">
                                  {answer.author.username}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Answer Form */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-800">Your Answer</h3>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={newAnswer}
                  onChange={setNewAnswer}
                  placeholder="Write your answer here..."
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || createAnswerMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {createAnswerMutation.isPending ? "Posting..." : "Post Answer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Stats */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <h3 className="font-semibold text-gray-800">Question Stats</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{question.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Votes</span>
                  <span className="font-semibold">{question.voteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answers</span>
                  <span className="font-semibold">{question.answerCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;

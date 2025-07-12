
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronUp, ChevronDown, Check, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Question, api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ id, voteType }: { id: string; voteType: 'upvote' | 'downvote' }) => {
      return api.voteQuestion(id, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
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

  // Remove vote mutation
  const removeVoteMutation = useMutation({
    mutationFn: async ({ id, voteType }: { id: string; voteType: 'upvote' | 'downvote' }) => {
      return api.removeVote(id, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
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

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['myQuestions'] });
      toast({
        title: "Question deleted",
        description: "Your question has been deleted successfully.",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to vote",
        variant: "destructive",
      });
      return;
    }

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
      removeVoteMutation.mutate({ id: question._id, voteType });
    } else if (voteType === 'downvote' && hasDownvoted) {
      // Remove downvote
      removeVoteMutation.mutate({ id: question._id, voteType });
    } else {
      // Add vote
      voteMutation.mutate({ id: question._id, voteType });
    }
  };

  const hasUpvoted = question.votes.upvotes.some(vote => vote.user === user?._id);
  const hasDownvoted = question.votes.downvotes.some(vote => vote.user === user?._id);
  const isAuthor = question.author._id === user?._id;

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link to={`/question/${question._id}`}>
              <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
                {question.title}
              </h3>
            </Link>
            <p className="text-gray-600 mt-2 line-clamp-2">
              {question.description}
            </p>
          </div>

          {/* Vote Section */}
          <div className="flex flex-col items-center space-y-1 min-w-[60px]">
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 ${hasUpvoted ? 'text-green-600 bg-green-50' : 'hover:text-green-600'}`}
              onClick={() => handleVote('upvote')}
              disabled={voteMutation.isPending || removeVoteMutation.isPending}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-gray-700">{question.voteCount}</span>
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 ${hasDownvoted ? 'text-red-600 bg-red-50' : 'hover:text-red-600'}`}
              onClick={() => handleVote('downvote')}
              disabled={voteMutation.isPending || removeVoteMutation.isPending}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
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

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Answers */}
            <div className="flex items-center space-x-1 text-gray-600">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">
                {question.answerCount} answer{question.answerCount !== 1 ? 's' : ''}
              </span>
              {question.isAccepted && (
                <Check className="h-4 w-4 text-green-600 ml-1" />
              )}
            </div>

            {/* Time */}
            <div className="flex items-center space-x-1 text-gray-500 text-sm">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Author and Actions */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {question.author.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              {question.author.username}
            </span>

            {/* Delete Button - Only show for question author */}
            {isAuthor && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteQuestionMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone and will also delete all associated answers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteQuestionMutation.mutate(question._id)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteQuestionMutation.isPending}
                    >
                      {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

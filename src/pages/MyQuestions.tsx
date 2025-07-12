import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { QuestionCard } from "@/components/QuestionCard";
import { AskQuestionModal } from "@/components/AskQuestionModal";
import { api, Question } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MyQuestions = () => {
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [showAskModal, setShowAskModal] = useState(false);

    // Fetch user's questions
    const { data: questionsData, isLoading, error } = useQuery({
        queryKey: ['myQuestions', user?._id],
        queryFn: async () => {
            if (!user?._id) throw new Error('User not authenticated');
            return api.getQuestionsByUser(user._id, { limit: 20 });
        },
        enabled: !!user?._id && isAuthenticated,
    });

    const questions = questionsData?.questions || [];

    // If not authenticated, show login required message
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/20 max-w-md">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Login Required</h2>
                            <p className="text-gray-600 mb-4">
                                You need to be logged in to view your questions.
                            </p>
                            <Button
                                onClick={() => {
                                    // This will trigger the auth modal in the header
                                    const loginButton = document.querySelector('[data-login-button]') as HTMLButtonElement;
                                    if (loginButton) {
                                        loginButton.click();
                                    }
                                }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                Login to Continue
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Error loading your questions. Please try again.
                        </AlertDescription>
                    </Alert>
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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Questions</h1>
                        <p className="text-gray-600">
                            {isLoading ? 'Loading...' : `${questions.length} questions asked`}
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAskModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 transition-all transform hover:scale-105"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Ask New Question
                    </Button>
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

                {/* No Questions */}
                {!isLoading && questions.length === 0 && (
                    <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/20">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                No questions yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Start contributing to the community by asking your first question!
                            </p>
                            <Button
                                onClick={() => setShowAskModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                Ask Your First Question
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <AskQuestionModal
                open={showAskModal}
                onOpenChange={setShowAskModal}
            />
        </div>
    );
};

export default MyQuestions; 
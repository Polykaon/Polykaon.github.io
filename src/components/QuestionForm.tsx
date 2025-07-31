import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QuestionSection } from '../data/questions';

interface Answers {
  [key: string]: string;
}

interface QuestionFormProps {
  currentQuestion: QuestionSection | undefined;
  currentStep: number;
  totalSteps: number;
  answers: Answers;
  updateAnswer: (key: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  allAnswered: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  currentQuestion,
  currentStep,
  totalSteps,
  answers,
  updateAnswer,
  nextStep,
  prevStep,
  allAnswered
}) => {
  if (!currentQuestion) return null;

  const visibleStepQuestions = currentQuestion.questions?.filter(q => 
    !q.condition || q.condition(answers)
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {currentStep === 0 && (
          <div className="text-center mb-12">
            <div className="bg-gradient-to-r from-purple-600 to-blue-700 text-white px-8 py-6 rounded-2xl mx-auto max-w-4xl mb-6 shadow-lg">
              <h1 className="text-4xl font-bold mb-4">
                Applicability Checker
              </h1>
              <p className="text-xl text-purple-100 leading-relaxed">
                High-level assessment of applicable sustainability frameworks: OECD Guidelines for Multinational Enterprises on Responsible Business Conduct, UNGPs, CSRD/ESRS, EU Taxonomy, and CSDDD
              </p>
              <p className="text-lg text-purple-200 mt-2">
                (Demo Version)
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentQuestion.title}
            </h2>
            <div className="w-16 h-1 bg-white rounded-full opacity-80"></div>
          </div>
          
          <div className="p-8">
            {visibleStepQuestions.map((question, index) => (
              <div key={question.key} className={index > 0 ? 'mt-8' : ''}>
                <label className="block text-lg font-semibold text-gray-800 mb-4 leading-relaxed">
                  {typeof question.label === 'function' ? question.label(answers) : question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === 'select' && (
                  <select
                    value={answers[question.key] || ''}
                    onChange={(e) => updateAnswer(question.key, e.target.value)}
                    className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="">Please select...</option>
                    {question.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {question.help && (
                  <p className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">
                    {typeof question.help === 'function' ? question.help(answers) : question.help}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={!allAnswered}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-700 text-white rounded-xl hover:from-purple-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {currentStep === totalSteps - 1 ? 'Generate Report' : 'Next'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
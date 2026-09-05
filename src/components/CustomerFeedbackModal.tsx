import React, { useState } from 'react';
import { Star, MessageSquare, AlertCircle, Sparkles, Check, ExternalLink, X, Copy, HeartHandshake } from 'lucide-react';
import { CustomerFeedback, RestaurantProfile, FeedbackType } from '../types';
import { submitCustomerFeedback } from '../utils/restaurantService';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantProfile;
  tableNumber: string;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  tableNumber,
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('review');
  const [rating, setRating] = useState<number>(5);
  const [customerName, setCustomerName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [copiedReview, setCopiedReview] = useState<boolean>(false);
  const [redirectedToGoogle, setRedirectedToGoogle] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStarClick = (num: number) => {
    setRating(num);
    if (num <= 3 && feedbackType === 'review') {
      // Prompt if they had an issue
      setFeedbackType('complaint');
    } else if (num >= 4 && feedbackType === 'complaint') {
      setFeedbackType('review');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await submitCustomerFeedback({
        restaurantId: restaurant.id,
        table: tableNumber,
        customerName: customerName.trim() || undefined,
        type: feedbackType,
        rating: feedbackType === 'review' ? rating : undefined,
        comment: comment.trim(),
        googleReviewRedirected: rating >= 4 && feedbackType === 'review',
      });

      // Auto-copy text if it's a positive review for easy pasting into Google
      if (feedbackType === 'review' && rating >= 4 && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(comment.trim());
          setCopiedReview(true);
        } catch {
          // ignore clipboard error
        }
      }

      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Could not submit feedback at this moment. Please let staff know!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGoogleReview = () => {
    if (comment.trim() && navigator.clipboard) {
      navigator.clipboard.writeText(comment.trim()).catch(() => {});
      setCopiedReview(true);
    }
    setRedirectedToGoogle(true);
    window.open(restaurant.googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResetAndClose = () => {
    setSubmittedSuccess(false);
    setCopiedReview(false);
    setRedirectedToGoogle(false);
    setComment('');
    setCustomerName('');
    setRating(5);
    setFeedbackType('review');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-5 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative animate-in zoom-in-95 my-4">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white hover:bg-neutral-100 border-2 border-black text-[#1A1A1A] transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A5F]" /> {restaurant.name}
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-[#1A1A1A]">
            {submittedSuccess
              ? feedbackType === 'review'
                ? 'THANK YOU FOR YOUR REVIEW!'
                : 'MESSAGE RECEIVED!'
              : 'TABLE FEEDBACK & REVIEWS'}
          </h2>
          <p className="text-xs text-neutral-600 font-bold mt-1">
            Seated at <span className="text-[#FF5A5F] font-black underline">{tableNumber}</span>
          </p>
        </div>

        {/* Success View */}
        {submittedSuccess ? (
          <div className="space-y-4 text-center py-2">
            {feedbackType === 'review' && rating >= 4 ? (
              <div className="bg-[#E8F8F5] border-3 border-black rounded-2xl p-4 text-left space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#06D6A0] flex items-center justify-center border-2 border-black text-[#1A1A1A]">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#1A1A1A]">Saved to Restaurant Feed!</h4>
                    <p className="text-xs text-neutral-600 font-bold">
                      {copiedReview ? 'Your review was copied to your clipboard.' : 'Ready to share on Google.'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-700 font-bold leading-relaxed">
                  Support our local kitchen by posting this directly on our official <strong>Google Reviews</strong> page:
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleOpenGoogleReview}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition cursor-pointer active:translate-y-0.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Google Review & Paste</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(comment).then(() => setCopiedReview(true));
                      }
                    }}
                    className="py-3 px-3 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] font-black text-xs border-2 border-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Copy text again"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedReview ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {redirectedToGoogle && (
                  <p className="text-[11px] text-[#06D6A0] font-black text-center pt-1">
                    ✨ Thank you for supporting our restaurant on Google!
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#FFF4E5] border-3 border-black rounded-2xl p-4 text-left space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFD166] flex items-center justify-center border-2 border-black text-[#1A1A1A]">
                    <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#1A1A1A]">Manager Alerted to {tableNumber}</h4>
                    <p className="text-xs text-neutral-600 font-bold">
                      Our shift supervisor has received your message.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-700 font-bold leading-relaxed">
                  We apologize for any inconvenience! A manager or floor staff will attend to <strong>{tableNumber}</strong> immediately to make things right.
                </p>
              </div>
            )}

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-black text-xs border-2 border-black transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Back to Games Lounge
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FFF9F2] rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => {
                  setFeedbackType('review');
                  if (rating < 4) setRating(5);
                }}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  feedbackType === 'review'
                    ? 'bg-[#FFD166] text-[#1A1A1A] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-[#FFD166] text-[#1A1A1A]" />
                <span>Review</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedbackType('complaint');
                  if (rating > 3) setRating(2);
                }}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  feedbackType === 'complaint'
                    ? 'bg-[#FF5A5F] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Issue</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('suggestion')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  feedbackType === 'suggestion'
                    ? 'bg-[#118AB2] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Idea</span>
              </button>
            </div>

            {/* Rating Stars (for Reviews & Complaints) */}
            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1.5">
                {feedbackType === 'review' ? 'Rate Your Experience *' : 'Service Rating:'}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="p-1 transition transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-[#FFD166] text-[#1A1A1A] stroke-[2]'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-black text-neutral-600 ml-2">
                  {rating === 5 && '🌟 Excellent!'}
                  {rating === 4 && '👍 Great!'}
                  {rating === 3 && '😐 Average'}
                  {rating === 2 && '👎 Needs Work'}
                  {rating === 1 && '⚠️ Poor'}
                </span>
              </div>
            </div>

            {/* Optional Customer Name */}
            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                Your Name <span className="text-neutral-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alex M."
                className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            {/* Comments / Details */}
            <div>
              <label className="block text-xs font-black text-[#1A1A1A] mb-1">
                {feedbackType === 'review'
                  ? 'What did you enjoy most about the food, drinks, or games?'
                  : feedbackType === 'complaint'
                  ? 'Please describe the issue so our manager can assist Table ' + tableNumber
                  : 'What games, food, or features would you like to see?'} *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required
                placeholder={
                  feedbackType === 'review'
                    ? 'The cocktails were fantastic and our table loved the Trivia and Imposter games!'
                    : feedbackType === 'complaint'
                    ? 'e.g. Food was slightly delayed or our drink order was missing.'
                    : 'Add more movie trivia questions!'
                }
                className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl p-3 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
              />
            </div>

            {/* Google Review Note for 4-5 Stars */}
            {feedbackType === 'review' && rating >= 4 && (
              <div className="bg-[#F0F7FF] border-2 border-[#4285F4] rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <Sparkles className="w-4 h-4 text-[#4285F4] shrink-0" />
                <span>
                  Positive reviews can be copied and posted directly to our <strong>Google Reviews</strong> page on the next screen!
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="w-full py-3 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] disabled:opacity-50 text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {feedbackType === 'review'
                      ? 'Submit Review'
                      : feedbackType === 'complaint'
                      ? 'Alert Manager Privately'
                      : 'Send Suggestion'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

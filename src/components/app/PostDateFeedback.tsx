"use client";

import { useState } from "react";

interface PostDateFeedbackProps {
  matchName: string;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  onClose: () => void;
}

export interface FeedbackData {
  rating: number; // 1-5
  matchedProfile: boolean | null;
  wouldMeetAgain: boolean | null;
  comment: string;
}

const stars = [1, 2, 3, 4, 5];

export default function PostDateFeedback({ matchName, onSubmit, onClose }: PostDateFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<boolean | null>(null);
  const [wouldMeetAgain, setWouldMeetAgain] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSending(true);
    await onSubmit({ rating, matchedProfile, wouldMeetAgain, comment });
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm mx-auto bg-bg border border-border rounded-3xl p-6 text-center">
        <p className="text-3xl mb-3">{"\\u2705"}</p>
        <p className="text-[15px] font-bold mb-1">Merci pour ton retour !</p>
        <p className="text-[13px] text-text-muted">
          Ton feedback nous aide a ameliorer les matchs.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-white"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-bg border border-border rounded-3xl p-6">
      <h2 className="text-[17px] font-bold mb-1">
        Comment s&apos;est passe le date ?
      </h2>
      <p className="text-[13px] text-text-muted mb-5">
        Ton retour sur ta rencontre avec {matchName}
      </p>

      {/* Star rating */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
          Note globale
        </p>
        <div className="flex gap-2">
          {stars.map(s => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className="text-2xl transition-transform active:scale-110"
              aria-label={`${s} etoile${s > 1 ? "s" : ""}`}
            >
              {s <= rating ? "\u2B50" : "\u2606"}
            </button>
          ))}
        </div>
      </div>

      {/* Question 1 */}
      <div className="mb-4">
        <p className="text-[13px] font-medium mb-2">
          La personne correspondait au profil ?
        </p>
        <div className="flex gap-2">
          <ToggleBtn
            active={matchedProfile === true}
            onClick={() => setMatchedProfile(true)}
            label="Oui"
          />
          <ToggleBtn
            active={matchedProfile === false}
            onClick={() => setMatchedProfile(false)}
            label="Non"
          />
        </div>
      </div>

      {/* Question 2 */}
      <div className="mb-4">
        <p className="text-[13px] font-medium mb-2">
          Tu aimerais la revoir ?
        </p>
        <div className="flex gap-2">
          <ToggleBtn
            active={wouldMeetAgain === true}
            onClick={() => setWouldMeetAgain(true)}
            label="Oui"
          />
          <ToggleBtn
            active={wouldMeetAgain === false}
            onClick={() => setWouldMeetAgain(false)}
            label="Non"
          />
        </div>
      </div>

      {/* Comment */}
      <div className="mb-5">
        <label
          htmlFor="feedback-comment"
          className="block text-[11px] font-semibold text-text-muted mb-1"
        >
          Commentaire (optionnel)
        </label>
        <textarea
          id="feedback-comment"
          rows={2}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Raconte-nous..."
          maxLength={500}
          className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || sending}
        className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
      >
        {sending ? "Envoi..." : "Envoyer le feedback"}
      </button>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-muted"
      }`}
    >
      {label}
    </button>
  );
}

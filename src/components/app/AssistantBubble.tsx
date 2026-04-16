"use client";

// ========================================
// AssistantBubble — Chat bubble components for the AI Matchmaker
// ========================================
//
// Four bubble types:
//   1. AI text bubble (left, light card, moon avatar)
//   2. User text bubble (right, gradient bg)
//   3. Options bubble (horizontal pill buttons)
//   4. Suggestion bubble (mini card with photo, title, compatibility, CTA)
//   + Typing indicator (3 dots with delay simulation)

import { motion, AnimatePresence } from "motion/react";
import { chatVariants, springs, micro } from "@/lib/motion-design";
import type {
  AssistantMessage,
  AssistantOption,
  AssistantSuggestion,
  PlanningDetails,
} from "@/lib/useAssistant";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface AssistantBubbleProps {
  message: AssistantMessage;
  onOptionSelect?: (optionId: string) => void;
  onSuggestionSelect?: (suggestionId: string) => void;
  isLatest?: boolean;
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function AssistantBubble({
  message,
  onOptionSelect,
  onSuggestionSelect,
  isLatest,
}: AssistantBubbleProps) {
  if (message.role === "user") {
    return <UserBubble content={message.content} />;
  }

  return (
    <AIBubble
      message={message}
      onOptionSelect={onOptionSelect}
      onSuggestionSelect={onSuggestionSelect}
      isLatest={isLatest}
    />
  );
}

// ─────────────────────────────────────────
// AI Bubble
// ─────────────────────────────────────────

function AIBubble({
  message,
  onOptionSelect,
  onSuggestionSelect,
  isLatest,
}: {
  message: AssistantMessage;
  onOptionSelect?: (optionId: string) => void;
  onSuggestionSelect?: (suggestionId: string) => void;
  isLatest?: boolean;
}) {
  return (
    <motion.div
      className="flex items-start gap-2.5 max-w-[90%]"
      variants={chatVariants.bubbleReceived}
      initial="hidden"
      animate="visible"
    >
      {/* Moon avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[14px]">
        &#9790;
      </div>

      <div className="flex-1 space-y-2.5">
        {/* Text content */}
        <div className="bg-bg border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-[14px] text-text leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Options pills */}
        {message.type === "options" && message.options && isLatest && (
          <OptionsPills
            options={message.options}
            onSelect={onOptionSelect}
          />
        )}

        {/* Suggestion cards */}
        {message.type === "suggestions" && message.suggestions && (
          <SuggestionCards
            suggestions={message.suggestions}
            onSelect={onSuggestionSelect}
            isLatest={isLatest}
          />
        )}

        {/* Planning details */}
        {message.type === "planning" && message.planningDetails && (
          <PlanningCard details={message.planningDetails} />
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// User Bubble
// ─────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <motion.div
      className="flex justify-end"
      variants={chatVariants.bubbleSent}
      initial="hidden"
      animate="visible"
    >
      <div
        className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-white text-[14px] font-medium"
        style={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #00FF88 150%)",
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Options Pills
// ─────────────────────────────────────────

function OptionsPills({
  options,
  onSelect,
}: {
  options: AssistantOption[];
  onSelect?: (id: string) => void;
}) {
  return (
    <motion.div
      className="flex flex-wrap gap-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.elastic, delay: 0.2 }}
    >
      {options.map((option, i) => (
        <motion.button
          key={option.id}
          onClick={() => onSelect?.(option.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border/60 bg-bg text-[13px] font-semibold text-text hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5 transition-colors"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...springs.elastic, delay: 0.1 + i * 0.05 }}
          whileTap={micro.tapScale}
        >
          <span className="text-[16px]">{option.emoji}</span>
          <span>{option.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Suggestion Cards
// ─────────────────────────────────────────

function SuggestionCards({
  suggestions,
  onSelect,
  isLatest,
}: {
  suggestions: AssistantSuggestion[];
  onSelect?: (id: string) => void;
  isLatest?: boolean;
}) {
  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, i) => (
        <motion.div
          key={suggestion.id}
          className="border border-border/50 rounded-2xl bg-bg overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springs.heavy, delay: 0.3 + i * 0.15 }}
        >
          {/* Card header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start gap-3">
              {/* Photo or emoji */}
              {suggestion.matchPhoto ? (
                <img
                  src={suggestion.matchPhoto}
                  alt={suggestion.matchName || ""}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[24px] flex-shrink-0">
                  {suggestion.emoji}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-text truncate">
                  {suggestion.title}
                </h4>
                {suggestion.compatibility && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-16 h-1.5 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${suggestion.compatibility}%`,
                          background: "linear-gradient(90deg, #8B5CF6, #00FF88)",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#00FF88]">
                      {suggestion.compatibility}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[12px] text-text-muted leading-relaxed mt-2">
              {suggestion.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2.5">
              <MetaPill icon={<IconPin />} label={suggestion.location.split(",")[0]} />
              <MetaPill icon={<IconClock />} label={suggestion.time} />
              <MetaPill icon={<IconPrice />} label={suggestion.price} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {suggestion.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/8 text-[10px] font-semibold text-[#8B5CF6] border border-[#8B5CF6]/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          {isLatest && (
            <motion.button
              onClick={() => onSelect?.(suggestion.id)}
              className="w-full px-4 py-3 border-t border-border/30 text-[13px] font-bold text-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-colors text-center"
              whileTap={micro.tapScale}
            >
              Choisir ce plan
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Planning Card
// ─────────────────────────────────────────

function PlanningCard({ details }: { details: PlanningDetails }) {
  return (
    <motion.div
      className="border border-[#00FF88]/30 rounded-2xl bg-[#00FF88]/5 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.heavy}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#00FF88]/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[18px]">&#9989;</span>
          <h4 className="text-[15px] font-black text-text">
            Ton plan est pret !
          </h4>
        </div>
        <p className="text-[13px] font-bold text-text">
          {details.suggestion.title}
        </p>
      </div>

      {/* Details grid */}
      <div className="px-4 py-3 space-y-3">
        <PlanningRow
          icon={<IconClock />}
          label="Heure"
          value={details.suggestedTime}
        />
        <PlanningRow
          icon={<IconPin />}
          label="Point de rencontre"
          value={details.meetingPoint}
        />
      </div>

      {/* Conversation starters */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] font-bold mb-2">
          Sujets de conversation
        </p>
        <div className="space-y-1.5">
          {details.conversationStarters.map((starter, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[12px] text-text-soft"
            >
              <span className="text-[#8B5CF6] mt-0.5 flex-shrink-0">&#x2022;</span>
              <span>{starter}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] font-bold mb-2">
          Conseils
        </p>
        <div className="space-y-1.5">
          {details.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[12px] text-text-soft"
            >
              <span className="text-[#00FF88] mt-0.5 flex-shrink-0">&#x2713;</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────

export function TypingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={springs.elastic}
    >
      {/* Moon avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[14px]">
        &#9790;
      </div>

      <div className="bg-bg border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-text-muted/40"
            animate={chatVariants.typingDot(i)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function MetaPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 text-text-muted">
      {icon}
      <span className="text-[11px] font-medium truncate max-w-[100px]">
        {label}
      </span>
    </div>
  );
}

function PlanningRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-text-muted">{icon}</div>
      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          {label}
        </p>
        <p className="text-[13px] text-text font-semibold">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Inline Icons
// ─────────────────────────────────────────

function IconPin() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="currentColor"
        opacity={0.6}
      />
      <circle cx={12} cy={9} r={2.5} fill="white" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconPrice() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M12 6v12M9 9.5c0-1 1.5-2 3-2s3 .8 3 2-1.5 2-3 2.5-3 1.2-3 2.5 1.5 2 3 2 3-1 3-2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

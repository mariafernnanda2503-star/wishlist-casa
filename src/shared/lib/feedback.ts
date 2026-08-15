"use client";

import { toast } from "sonner";

import { logger, type LogContext } from "./logger";

type ErrorFeedback = {
  event: string;
  error: unknown;
  context?: LogContext;
};

type FeedbackDetails = {
  event: string;
  context?: LogContext;
};

export const feedback = {
  success(message: string, details: FeedbackDetails) {
    logger.success(details.event, details.context);
    toast.success(message);
  },
  info(message: string, details: FeedbackDetails) {
    logger.info(details.event, details.context);
    toast.info(message);
  },
  warning(message: string, details: FeedbackDetails) {
    logger.warn(details.event, details.context);
    toast.warning(message);
  },
  error(message: string, details: ErrorFeedback) {
    logger.error(details.event, details.error, details.context);
    toast.error(message);
  },
};

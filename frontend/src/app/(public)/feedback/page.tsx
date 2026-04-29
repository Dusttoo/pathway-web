"use client";

import { useState } from "react";
import {
  Bug,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { FeedbackType } from "@/lib/types/feedback";

type TabType = "bug" | "feature" | "feedback";

interface FormData {
  title: string;
  description: string;
  // Bug-specific fields
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  // Feature-specific fields
  useCase?: string;
  proposedSolution?: string;
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bug");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    useCase: "",
    proposedSolution: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    ticketNumber?: string;
  }>({ type: null, message: "" });
  const [showValidation, setShowValidation] = useState(false);

  const tabs = [
    {
      id: "bug" as TabType,
      label: "Report Bug",
      icon: Bug,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      description: "Found something broken? Let us know!",
    },
    {
      id: "feature" as TabType,
      label: "Request Feature",
      icon: Lightbulb,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      description: "Have an idea? We'd love to hear it!",
    },
    {
      id: "feedback" as TabType,
      label: "General Feedback",
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      description: "Share your thoughts and suggestions",
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Build description based on feedback type
      let combinedDescription = "";

      if (activeTab === "bug") {
        combinedDescription = `## Steps to Reproduce\n${formData.stepsToReproduce || "N/A"}\n\n`;
        combinedDescription += `## Expected Behavior\n${formData.expectedBehavior || "N/A"}\n\n`;
        combinedDescription += `## Actual Behavior\n${formData.actualBehavior || "N/A"}`;
        if (formData.description?.trim()) {
          combinedDescription += `\n\n## Additional Context\n${formData.description}`;
        }
      } else if (activeTab === "feature") {
        combinedDescription = `## Use Case\n${formData.useCase || "N/A"}\n\n`;
        combinedDescription += `## Proposed Solution\n${formData.proposedSolution || "N/A"}`;
        if (formData.description?.trim()) {
          combinedDescription += `\n\n## Additional Details\n${formData.description}`;
        }
      } else {
        combinedDescription = formData.description;
      }

      // Gather metadata
      const metadata: Record<string, any> = {
        browser: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // Add screen dimensions for bug reports
      if (activeTab === "bug") {
        metadata.screen_width = window.screen.width;
        metadata.screen_height = window.screen.height;
        metadata.viewport_width = window.innerWidth;
        metadata.viewport_height = window.innerHeight;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab as FeedbackType, title: formData.title, description: combinedDescription, metadata }),
      });
      if (!res.ok) throw new Error(await res.text());

      setSubmitStatus({
        type: "success",
        message: "Thank you! Your feedback has been submitted successfully.",
        ticketNumber: undefined,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        stepsToReproduce: "",
        expectedBehavior: "",
        actualBehavior: "",
        useCase: "",
        proposedSolution: "",
      });

      // Scroll to success message
      setTimeout(() => {
        document.getElementById("submit-status")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message:
          error.message ||
          "Failed to submit feedback. Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation helpers
  const getFieldError = (field: string, minLength: number): string | null => {
    const value = formData[field as keyof FormData];
    if (!showValidation) return null;
    if (!value || value.trim().length === 0) {
      return "This field is required";
    }
    if (value.trim().length < minLength) {
      return `Minimum ${minLength} characters required (${value.trim().length}/${minLength})`;
    }
    return null;
  };

  const isFormValid = (() => {
    if (formData.title.trim().length < 5) return false;

    if (activeTab === "bug") {
      return (
        (formData.stepsToReproduce?.trim().length ?? 0) >= 10 &&
        (formData.expectedBehavior?.trim().length ?? 0) >= 10 &&
        (formData.actualBehavior?.trim().length ?? 0) >= 10
      );
    } else if (activeTab === "feature") {
      return (
        (formData.useCase?.trim().length ?? 0) >= 10 &&
        (formData.proposedSolution?.trim().length ?? 0) >= 10
      );
    } else {
      return formData.description.trim().length >= 10;
    }
  })();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-16">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/20 rounded-full px-4 py-2 mb-6">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              We're listening
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Feedback & Support
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us make Pathway better! Report bugs, request features, or
            share your thoughts.
          </p>
        </div>
      </section>

      {/* Main Feedback Form */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSubmitStatus({ type: null, message: "" });
                  }}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? `${tab.bgColor} ${tab.borderColor} shadow-md`
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`${isActive ? tab.bgColor : "bg-muted"} p-2 rounded-lg`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? tab.color : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {tab.label}
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Status Messages */}
          {submitStatus.type && (
            <div
              id="submit-status"
              className={`mb-6 p-4 rounded-lg border-2 ${
                submitStatus.type === "success"
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {submitStatus.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      submitStatus.type === "success"
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {submitStatus.message}
                  </p>
                  {submitStatus.ticketNumber && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ticket number:{" "}
                      <code className="bg-background px-2 py-0.5 rounded border">
                        {submitStatus.ticketNumber}
                      </code>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`${activeTabData.bgColor} p-3 rounded-lg`}>
                <activeTabData.icon
                  className={`h-6 w-6 ${activeTabData.color}`}
                />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  {activeTabData.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTabData.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field - Common for all types */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-2"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={
                    activeTab === "bug"
                      ? "Brief summary of the bug"
                      : activeTab === "feature"
                        ? "Feature you'd like to see"
                        : "What's on your mind?"
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  minLength={5}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/500 characters (minimum 5)
                </p>
              </div>

              {/* Bug Report Fields */}
              {activeTab === "bug" && (
                <>
                  <div>
                    <label
                      htmlFor="stepsToReproduce"
                      className="block text-sm font-medium mb-2"
                    >
                      Steps to Reproduce <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="stepsToReproduce"
                      value={formData.stepsToReproduce}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stepsToReproduce: e.target.value,
                        })
                      }
                      placeholder="Please list the exact steps to reproduce this issue:&#10;1. &#10;2. &#10;3. "
                      rows={6}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono text-sm"
                      required
                      minLength={10}
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.stepsToReproduce?.length || 0}/5000 characters
                      (minimum 10)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="expectedBehavior"
                      className="block text-sm font-medium mb-2"
                    >
                      Expected Behavior <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="expectedBehavior"
                      value={formData.expectedBehavior}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedBehavior: e.target.value,
                        })
                      }
                      placeholder="What did you expect to happen?"
                      rows={4}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      required
                      minLength={10}
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.expectedBehavior?.length || 0}/5000 characters
                      (minimum 10)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="actualBehavior"
                      className="block text-sm font-medium mb-2"
                    >
                      Actual Behavior <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="actualBehavior"
                      value={formData.actualBehavior}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualBehavior: e.target.value,
                        })
                      }
                      placeholder="What actually happened instead?"
                      rows={4}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      required
                      minLength={10}
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.actualBehavior?.length || 0}/5000 characters
                      (minimum 10)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium mb-2"
                    >
                      Additional Context
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Any additional information, error messages, screenshots descriptions, etc. (optional)"
                      rows={4}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length}/5000 characters (optional)
                    </p>
                  </div>
                </>
              )}

              {/* Feature Request Fields */}
              {activeTab === "feature" && (
                <>
                  <div>
                    <label
                      htmlFor="useCase"
                      className="block text-sm font-medium mb-2"
                    >
                      Use Case <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="useCase"
                      value={formData.useCase}
                      onChange={(e) =>
                        setFormData({ ...formData, useCase: e.target.value })
                      }
                      placeholder="What problem would this feature solve? How would you use it?"
                      rows={6}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      required
                      minLength={10}
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.useCase?.length || 0}/5000 characters (minimum
                      10)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="proposedSolution"
                      className="block text-sm font-medium mb-2"
                    >
                      Proposed Solution <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="proposedSolution"
                      value={formData.proposedSolution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proposedSolution: e.target.value,
                        })
                      }
                      placeholder="How do you envision this feature working? What would the user experience be like?"
                      rows={6}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      required
                      minLength={10}
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.proposedSolution?.length || 0}/5000 characters
                      (minimum 10)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium mb-2"
                    >
                      Additional Details
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Any additional context, examples, or related features? (optional)"
                      rows={4}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                      maxLength={5000}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length}/5000 characters (optional)
                    </p>
                  </div>
                </>
              )}

              {/* General Feedback Fields */}
              {activeTab === "feedback" && (
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium mb-2"
                  >
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell us what you think about Pathway..."
                    rows={12}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    required
                    minLength={10}
                    maxLength={5000}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/5000 characters (minimum 10)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                onClick={() => !isFormValid && setShowValidation(true)}
                disabled={isSubmitting}
                className={`w-full btn-primary ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <activeTabData.icon className="h-4 w-4" />
                    Submit {activeTabData.label}
                  </>
                )}
              </button>

              {/* Validation Summary */}
              {showValidation && !isFormValid && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">
                        Please fix the following errors:
                      </p>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {formData.title.trim().length < 5 && (
                          <li>Title must be at least 5 characters</li>
                        )}
                        {activeTab === "bug" &&
                          (formData.stepsToReproduce?.trim().length ?? 0) <
                            10 && (
                            <li>
                              Steps to Reproduce must be at least 10 characters
                            </li>
                          )}
                        {activeTab === "bug" &&
                          (formData.expectedBehavior?.trim().length ?? 0) <
                            10 && (
                            <li>
                              Expected Behavior must be at least 10 characters
                            </li>
                          )}
                        {activeTab === "bug" &&
                          (formData.actualBehavior?.trim().length ?? 0) <
                            10 && (
                            <li>
                              Actual Behavior must be at least 10 characters
                            </li>
                          )}
                        {activeTab === "feature" &&
                          (formData.useCase?.trim().length ?? 0) < 10 && (
                            <li>Use Case must be at least 10 characters</li>
                          )}
                        {activeTab === "feature" &&
                          (formData.proposedSolution?.trim().length ?? 0) <
                            10 && (
                            <li>
                              Proposed Solution must be at least 10 characters
                            </li>
                          )}
                        {activeTab === "feedback" &&
                          formData.description.trim().length < 10 && (
                            <li>
                              Your Feedback must be at least 10 characters
                            </li>
                          )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 bg-muted">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          <div className="card p-6 md:p-8">
            <h3 className="text-2xl font-heading font-bold mb-6">
              💡 Tips for Great Feedback
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="font-semibold min-w-[120px] text-foreground">
                  Be specific:
                </span>
                <span className="text-muted-foreground">
                  Include details like character names, campaign names, and
                  exact steps to reproduce issues
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-semibold min-w-[120px] text-foreground">
                  One issue:
                </span>
                <span className="text-muted-foreground">
                  Submit separate reports for different bugs or features
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-semibold min-w-[120px] text-foreground">
                  Include context:
                </span>
                <span className="text-muted-foreground">
                  Tell us what you were trying to do and what you expected to
                  happen
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-semibold min-w-[120px] text-foreground">
                  Be patient:
                </span>
                <span className="text-muted-foreground">
                  We review all feedback and prioritize based on impact and
                  feasibility
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Feedback Screen
 * Allows users to send feedback via email
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { APP_VERSION } from "./AboutScreen";

interface FeedbackScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Feedback">;
}

type FeedbackType = "bug" | "feature" | "improvement" | "other";

export default function FeedbackScreen({ navigation }: FeedbackScreenProps) {
  const insets = useSafeAreaInsets();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate inputs
    if (!subject.trim()) {
      Alert.alert("Missing Subject", "Please enter a subject for your feedback.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Missing Message", "Please enter your feedback message.");
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address or leave it blank.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct email subject and body
      const emailSubject = `[${feedbackType.toUpperCase()}] ${subject}`;
      const emailBody = `
Feedback Type: ${feedbackType}
App Version: ${APP_VERSION}
User Email: ${email || "Not provided"}

Message:
${message}

---
Sent from Daily Dividend Capture App
      `.trim();

      // Send feedback directly using fetch (background submission)
      const response = await fetch("https://formspree.io/f/xanyygve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email || "anonymous@user.com",
          subject: emailSubject,
          message: emailBody,
          _replyto: email || undefined,
          _subject: emailSubject,
        }),
      });

      console.log("Formspree response status:", response.status);
      const responseText = await response.text();
      console.log("Formspree response body:", responseText);

      if (response.ok) {
        // Show success message
        Alert.alert(
          "Feedback Sent!",
          "Thank you for your feedback! We have received your message and will review it shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form
                setSubject("");
                setMessage("");
                setEmail("");
                setFeedbackType("bug");
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        console.error("Formspree error response:", responseText);
        throw new Error(`Failed to send feedback: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      Alert.alert(
        "Error Sending Feedback",
        "We could not send your feedback at this time. Please try again later or email us directly at ofreyes2@yahoo.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0f172a]"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View>
            <Text className="text-white text-xl font-bold">Send Feedback</Text>
            <Text className="text-slate-400 text-sm">We value your input</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Feedback Type Selection */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">Feedback Type</Text>
          <View className="flex-row flex-wrap gap-2">
            <FeedbackTypeButton
              type="bug"
              label="Bug Report"
              icon="bug"
              selected={feedbackType === "bug"}
              onPress={() => setFeedbackType("bug")}
            />
            <FeedbackTypeButton
              type="feature"
              label="Feature Request"
              icon="bulb"
              selected={feedbackType === "feature"}
              onPress={() => setFeedbackType("feature")}
            />
            <FeedbackTypeButton
              type="improvement"
              label="Improvement"
              icon="trending-up"
              selected={feedbackType === "improvement"}
              onPress={() => setFeedbackType("improvement")}
            />
            <FeedbackTypeButton
              type="other"
              label="Other"
              icon="chatbox-ellipses"
              selected={feedbackType === "other"}
              onPress={() => setFeedbackType("other")}
            />
          </View>
        </View>

        {/* Subject Input */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">Subject *</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your feedback"
            placeholderTextColor="#64748b"
            className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
            maxLength={100}
          />
        </View>

        {/* Message Input */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">Message *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us more about your feedback..."
            placeholderTextColor="#64748b"
            className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text className="text-slate-500 text-xs mt-2 text-right">
            {message.length}/1000 characters
          </Text>
        </View>

        {/* Email Input (Optional) */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">
            Your Email <Text className="text-slate-500 text-sm">(Optional)</Text>
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your.email@example.com"
            placeholderTextColor="#64748b"
            className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text className="text-slate-500 text-xs mt-2">
            Provide your email if you would like a response
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-xl p-4 flex-row items-center justify-center mb-6 ${
            isSubmitting ? "bg-blue-800" : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          {isSubmitting ? (
            <>
              <Ionicons name="hourglass" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Sending...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Send Feedback</Text>
            </>
          )}
        </Pressable>

        {/* Info Card */}
        <View className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-6">
          <View className="flex-row">
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-400 text-sm leading-5">
                Your feedback will be sent directly to our team at ofreyes2@yahoo.com. We typically
                respond within 24-48 hours.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Feedback Type Button Component
function FeedbackTypeButton({
  type,
  label,
  icon,
  selected,
  onPress,
}: {
  type: FeedbackType;
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-2 rounded-lg border ${
        selected
          ? "bg-blue-600 border-blue-600"
          : "bg-slate-800 border-slate-700 active:bg-slate-700"
      }`}
    >
      <Ionicons name={icon as any} size={16} color={selected ? "white" : "#94a3b8"} />
      <Text className={`ml-2 text-sm font-medium ${selected ? "text-white" : "text-slate-400"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

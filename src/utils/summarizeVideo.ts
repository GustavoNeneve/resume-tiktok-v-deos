import Axios from "axios"
import { TiktokAPI } from "./downloader/tiktokAPIDownloader"
import { _geminiApiUrl } from "../constants/api"
import { VideoSummaryResponse } from "../types/summarize"
import { ERROR_MESSAGES } from "../constants"

/** Constants */
const GEMINI_MODEL = "gemini-1.5-flash"

/**
 * Build a prompt for Gemini to summarize TikTok video content
 */
const buildSummaryPrompt = (
  description: string,
  author: string,
  hashtags: string[]
): string => {
  const hashtagStr =
    hashtags && hashtags.length > 0
      ? `Hashtags: ${hashtags.map((h) => `#${h}`).join(", ")}`
      : ""

  return [
    `You are summarizing a TikTok video. Based on the information below, write a concise and informative summary of what the video is likely about (2-4 sentences).`,
    ``,
    `Author: ${author}`,
    `Description: ${description}`,
    hashtagStr,
    ``,
    `Summary:`
  ].join("\n")
}

/**
 * Call the Google Gemini API to generate a summary
 */
const callGeminiApi = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const url = _geminiApiUrl(GEMINI_MODEL, apiKey)

  try {
    const response = await Axios.post(url, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!text) {
      throw new Error("No summary returned from Gemini API")
    }

    return text
  } catch (error) {
    if (Axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      if (status === 400) throw new Error("Gemini API: Bad request - check your API key or input")
      if (status === 401 || status === 403) throw new Error("Gemini API: Invalid or unauthorized API key")
      if (status === 429) throw new Error("Gemini API: Rate limit exceeded - try again later")
      throw new Error(`Gemini API error (HTTP ${status}): ${error.response.data?.error?.message || error.message}`)
    }
    throw error
  }
}

/**
 * Summarize a TikTok Video using Google Gemini API
 * @param {string} url - The TikTok video URL
 * @param {string} geminiApiKey - Your Google Gemini API key (free at https://aistudio.google.com/app/apikey)
 * @param {Object} [options] - Optional settings
 * @param {string} [options.proxy] - Optional proxy URL
 * @returns {Promise<VideoSummaryResponse>}
 */
export const summarizeVideo = async (
  url: string,
  geminiApiKey: string,
  options?: {
    proxy?: string
  }
): Promise<VideoSummaryResponse> => {
  try {
    if (!geminiApiKey) {
      return {
        status: "error",
        message: "Gemini API key is required"
      }
    }

    // Fetch TikTok video information
    const videoData = await TiktokAPI(url, options?.proxy)

    if (videoData.status !== "success" || !videoData.result) {
      return {
        status: "error",
        message: videoData.message || ERROR_MESSAGES.NETWORK_ERROR
      }
    }

    const { result } = videoData
    const description = result.desc || ""
    const author = result.author?.nickname || ""
    const hashtags = result.hashtag || []

    // Build prompt and call Gemini
    const prompt = buildSummaryPrompt(description, author, hashtags)
    const summary = await callGeminiApi(prompt, geminiApiKey)

    return {
      status: "success",
      result: {
        videoId: result.id,
        author,
        description,
        hashtags,
        summary
      }
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
    }
  }
}

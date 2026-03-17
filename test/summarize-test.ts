// Test for TikTok Video Summarization using Google Gemini API
import Tiktok from "../src/index"

async function testSummarizeVideo() {
  try {
    const url = process.env.TEST_VIDEO_URL || "https://www.tiktok.com/@username/video/0000000000000000000" // Set TEST_VIDEO_URL env var to a valid TikTok video URL
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      console.error("Error: GEMINI_API_KEY environment variable is not set.")
      console.error("Get a free key at https://aistudio.google.com/app/apikey and run:")
      console.error("  GEMINI_API_KEY=your_key npx ts-node test/summarize-test.ts")
      process.exit(1)
    }

    console.log(`\nTesting SummarizeVideo`)
    console.log(`URL: ${url}`)

    const result = await Tiktok.SummarizeVideo(url, geminiApiKey)

    if (result.status === "success" && result.result) {
      const r = result.result
      console.log(`\nVideo ID: ${r.videoId}`)
      console.log(`Author: ${r.author}`)
      console.log(`Description: ${r.description}`)
      console.log(`Hashtags: ${r.hashtags?.join(", ")}`)
      console.log(`\nSummary:`)
      console.log(r.summary)
      console.log("========================")
    } else {
      console.error("Error:", result.message)
    }
  } catch (error) {
    console.error("Test failed:", error)
  }
}

testSummarizeVideo()

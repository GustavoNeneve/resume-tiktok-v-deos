import { BaseResponse } from "./common"

export type VideoSummaryResult = {
  videoId?: string
  author?: string
  description?: string
  hashtags?: string[]
  summary: string
}

export type VideoSummaryResponse = BaseResponse & {
  result?: VideoSummaryResult
}

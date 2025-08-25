export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500)
  }

  return new ApiError("Unknown error occurred", 500)
}

export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ""

  console.error(`${timestamp} ${contextStr}Error:`, error)

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }
}

export function validateEnvironment() {
  const requiredVars = ["BLINDPAY_API_KEY"]
  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}. Please add these to your Vercel project settings under Environment Variables.`
    throw new ApiError(errorMessage, 500, "MISSING_ENV_VARS")
  }
}
